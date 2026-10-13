// Rosa Maria server: serves the built app and makes every database and checker call, so no key
// ever reaches the browser.
import express from "express";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { MemoryStore, createFirestoreStore, type Store, type UserDoc } from "./server/store";
import { askJev, jevConfigured } from "./server/jev";
import { KINDS, labelQuestions, applyLabels, labelFlags, NOT_LABELED, pieceState, type LibraryPiece, type PieceStatus } from "./server/library";
import { knownMisattribution, checkWikiquote, needsSourceCheck, sourceFlags, isSourceFlag, sourceSaysWrong, type SourceCheck } from "./server/sources";
import { createSessions } from "./server/session";
import {
  STARTER_INVITES, REDEEM_MESSAGES, newInvite, normalizeCode, normalizeEmail, isValidEmail, parseAdminEmails,
} from "./server/accounts";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
app.set("trust proxy", true); // Cloud Run sits behind Google's proxy; this gives the real visitor IP.
app.use(express.json({ limit: "1mb" }));

// ---------- Data: database and sessions ----------

// DATA_STORE=memory keeps everything in memory (local runs, tests). Otherwise Firestore.
const USE_MEMORY = process.env.DATA_STORE === "memory";
const store: Store = USE_MEMORY ? new MemoryStore() : await createFirestoreStore();

let SESSION_SECRET = process.env.SESSION_SECRET || "";
if (!SESSION_SECRET) {
  SESSION_SECRET = crypto.randomBytes(32).toString("hex");
  console.warn("SESSION_SECRET is not set: using a temporary one, so everyone's sign-in resets when the server restarts.");
}
const sessions = createSessions(SESSION_SECRET);

// ---------- Protection: headers, passcode, session, rate limits ----------

const isProd = process.env.NODE_ENV === "production";
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isProd) {
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        // Google's sign-in button (Google Identity Services) loads from accounts.google.com.
        "script-src 'self' https://accounts.google.com/gsi/client",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
        "frame-src https://accounts.google.com/gsi/",
        "font-src 'self' data: https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://accounts.google.com/gsi/",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ")
    );
  }
  next();
});

const APP_PASSCODE = process.env.APP_PASSCODE || "";
const ADMIN_CODE = process.env.ADMIN_CODE || "";
const secretMatches = (given: unknown, secret: string) => {
  if (typeof given !== "string" || !given || !secret) return false;
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(secret).digest();
  return crypto.timingSafeEqual(a, b);
};
const passcodeMatches = (given: unknown) => secretMatches(given, APP_PASSCODE);

// ---------- Invite-only beta: Google sign-in + invite codes ----------

// INVITE_ONLY replaces the shared passcode: you sign in with Google and redeem an invite once.
const INVITE_ONLY = /^(true|1|on)$/i.test(process.env.INVITE_ONLY || "");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const ADMIN_EMAILS = parseAdminEmails(process.env.ADMIN_EMAILS);
// Tests only: accept "test:<sub>:<email>:<signature>" instead of a real Google token.
const AUTH_TEST_SECRET = process.env.AUTH_TEST_SECRET || "";
if (AUTH_TEST_SECRET) console.warn("AUTH_TEST_SECRET is set: test sign-ins are accepted. Never set this on the real server.");
if (INVITE_ONLY && !GOOGLE_CLIENT_ID && !AUTH_TEST_SECRET) console.warn("INVITE_ONLY is on but GOOGLE_CLIENT_ID is not set: nobody can sign in.");

let googleClient: any = null;
/** Checks a Google sign-in token. Returns the account, or null when it isn't genuine. */
async function verifyGoogle(credential: unknown): Promise<{ sub: string; email: string; name: string } | null> {
  const token = String(credential || "");
  if (AUTH_TEST_SECRET && token.startsWith("test:")) {
    const [, sub, email, sig] = token.split(":");
    const want = crypto.createHmac("sha256", AUTH_TEST_SECRET).update(`${sub}|${email}`).digest("hex");
    return sub && email && sig && secretMatches(sig, want) ? { sub, email: normalizeEmail(email), name: email.split("@")[0] } : null;
  }
  if (!GOOGLE_CLIENT_ID || !token) return null;
  try {
    if (!googleClient) {
      const { OAuth2Client } = await import("google-auth-library");
      googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    }
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    if (!p?.sub || !p.email || p.email_verified === false) return null;
    return { sub: p.sub, email: normalizeEmail(p.email), name: String(p.name || p.email.split("@")[0]).slice(0, 80) };
  } catch (err: any) {
    console.warn("Google sign-in rejected:", err?.message || err);
    return null;
  }
}

// Members rarely stop being members (only "Delete my data"), so remember the yeses.
const memberCache = new Set<string>();
const isMember = async (uid: string) => {
  if (memberCache.has(uid)) return true;
  const user = await store.getUser(uid);
  if (user?.member) memberCache.add(uid);
  return !!user?.member;
};

const WINDOW_MS = 10 * 60 * 1000;
// Requests per visitor per 10 minutes.
const GENERAL_RATE_LIMIT = Number(process.env.GENERAL_RATE_LIMIT_PER_10MIN) || 400;
const hits = new Map<string, number[]>();
const overLimit = (key: string, limit: number) => {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
};
// Forget idle visitors so the map can't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
}, WINDOW_MS).unref();

/** Where credited sayings are looked up. "off" turns the lookup off; tests point it at a stand-in. */
const WIKIQUOTE_BASE_URL = process.env.WIKIQUOTE_BASE_URL ?? "https://en.wikiquote.org";

const OPEN_PATHS = new Set(["/api/config", "/api/unlock"]);
const SESSION_FREE = new Set(["/api/config", "/api/unlock", "/api/session", "/api/waitlist"]);
// Reachable before you're a member (to sign in, redeem an invite or join the waitlist).
const MEMBER_FREE = new Set(["/api/config", "/api/unlock", "/api/session", "/api/me/status", "/api/auth/google", "/api/invites/redeem", "/api/waitlist"]);

declare global {
  namespace Express {
    interface Request {
      uid?: string;
    }
  }
}

app.use("/api", (req, res, next) => {
  const p = req.originalUrl.split("?")[0];
  // Media links are signed per file, so <img> tags work without headers.
  if (OPEN_PATHS.has(p)) return next();
  if (!INVITE_ONLY && APP_PASSCODE && !passcodeMatches(req.get("x-app-passcode"))) {
    return res.status(401).json({ error: "Locked. Enter the app passcode." });
  }
  if (!SESSION_FREE.has(p)) {
    const uid = sessions.verify(req.get("x-rosa-session"));
    if (!uid) return res.status(401).json({ error: "Session expired. Refresh the page.", session: "invalid" });
    req.uid = uid;
  }
  const who = req.uid || req.ip || "unknown";
  if (overLimit(`all:${who}`, GENERAL_RATE_LIMIT)) {
    return res.status(429).json({ error: "Too many requests. Please wait a few minutes and try again." });
  }
  // The curator area has its own code; everything else needs a member once the beta is invite-only.
  if (INVITE_ONLY && !MEMBER_FREE.has(p) && !p.startsWith("/api/admin")) {
    isMember(req.uid || "")
      .then((ok) => (ok ? next() : res.status(403).json({ error: "Rosa Maria is invite-only during the beta.", invite: "required" })))
      .catch((err) => {
        console.error("member check:", err);
        res.status(500).json({ error: "Could not check your invite. Please try again." });
      });
    return;
  }
  next();
});

app.post("/api/unlock", (req, res) => {
  if (!APP_PASSCODE || passcodeMatches(req.body?.passcode)) return res.json({ ok: true });
  setTimeout(() => res.status(401).json({ error: "That passcode isn't right." }), 800);
});

app.get("/api/config", (_req, res) => {
  res.json({
    locked: !INVITE_ONLY && !!APP_PASSCODE,
    inviteOnly: INVITE_ONLY,
    googleClientId: GOOGLE_CLIENT_ID || null,
    dataStore: store.kind,
  });
});

/** A new anonymous identity, or confirms the one this browser already has. */
app.post("/api/session", (req, res) => {
  const existing = sessions.verify(req.body?.token);
  if (existing) return res.json({ uid: existing, token: req.body.token });
  return res.json(sessions.issue());
});

const newUserDoc = (): UserDoc => {
  const now = new Date().toISOString();
  return { createdAt: now, updatedAt: now };
};

/** "Delete my data": the account link, unused invites and the user record. */
app.delete("/api/me", async (req, res) => {
  try {
    await store.deleteAccountsForUid(req.uid!);
    await store.deleteUnusedInvites(req.uid!);
    await store.deleteUser(req.uid!);
    memberCache.delete(req.uid!);
    res.json({ deleted: true });
  } catch (err: any) {
    console.error("delete me:", err);
    res.status(500).json({ error: "Could not delete your data. Please try again." });
  }
});

// ---------- Reviewer's library: JEV checks, a person decides ----------

/** The list and Wikiquote's view of who really said it. */
async function checkSource(p: LibraryPiece): Promise<SourceCheck> {
  const known = knownMisattribution(p.text, p.author);
  const wq = await checkWikiquote(p.text, p.author, WIKIQUOTE_BASE_URL);
  return { wikiquote: wq.result, ...(wq.url ? { url: wq.url } : {}), ...(known ? { known: known.truth } : {}), checkedAt: new Date().toISOString() };
}

/** Labels (JEV) and checks the source of a piece. `force` redoes both, after an edit. */
async function processPiece(piece: LibraryPiece, force = false): Promise<LibraryPiece> {
  const next = { ...piece };
  if (force || !next.labels) {
    const { labels } = applyLabels(await askJev(pieceState(next), labelQuestions()));
    if (labels) next.labels = labels;
  }
  // Flags are rebuilt from the labels each time, so a stricter rule reaches pieces labeled before it.
  next.flags = [...(next.labels ? labelFlags(next.labels) : [NOT_LABELED]), ...next.flags.filter(isSourceFlag)];
  if (needsSourceCheck(next) && (force || !next.sourceCheck || next.sourceCheck.wikiquote === "unavailable")) {
    next.sourceCheck = await checkSource(next);
    next.flags = [...next.flags.filter((f) => !isSourceFlag(f)), ...sourceFlags(next.sourceCheck)];
    // Wrongly credited: take it out of use until a person looks, unless they already vouched for it.
    if (next.status === "approved" && !next.sourceChecked && sourceSaysWrong(next.sourceCheck)) next.status = "pending";
  }
  return next;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const n = i++;
        out[n] = await fn(items[n]);
      }
    })
  );
  return out;
}

// ---------- Curator (ADMIN_CODE): import, review, approve ----------

app.use("/api/admin", (req, res, next) => {
  if (!ADMIN_CODE) return res.status(404).json({ error: "Curating is switched off on this server." });
  if (!secretMatches(req.get("x-admin-code"), ADMIN_CODE)) return res.status(403).json({ error: "That curator code isn't right." });
  next();
});

const curatorPiece = (p: LibraryPiece) => ({ ...p, needsSourceCheck: needsSourceCheck(p) });
const STATUS_ORDER: Record<PieceStatus, number> = { pending: 0, approved: 1, rejected: 2 };
const needsWork = (p: LibraryPiece) => !p.labels || (needsSourceCheck(p) && !p.sourceCheck);

app.get("/api/admin/library", async (_req, res) => {
  try {
    const pieces = (await store.listLibrary()).sort(
      (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.createdAt.localeCompare(a.createdAt)
    );
    res.json({
      pieces: pieces.map(curatorPiece),
      waiting: pieces.filter((p) => p.status !== "rejected" && needsWork(p)).length,
      jev: jevConfigured(),
    });
  } catch (err: any) {
    console.error("admin library:", err);
    res.status(500).json({ error: "Could not load the library." });
  }
});

const cleanPiece = (raw: any) => ({
  text: String(raw?.text || "").trim().slice(0, 800),
  translation: String(raw?.translation || "").trim().slice(0, 800) || undefined,
  author: String(raw?.author || "").trim().slice(0, 120),
  source: String(raw?.source || "").trim().slice(0, 200) || undefined,
});

app.post("/api/admin/library", async (req, res) => {
  const raw = (Array.isArray(req.body?.pieces) ? req.body.pieces : []).slice(0, 100);
  const kind = KINDS.has(req.body?.kind) ? req.body.kind : "quote";
  const fresh: LibraryPiece[] = raw
    .map(cleanPiece)
    .filter((p: ReturnType<typeof cleanPiece>) => p.text && p.author)
    .map((p: ReturnType<typeof cleanPiece>) => ({
      ...p,
      id: `lib-${crypto.randomBytes(6).toString("hex")}`,
      kind,
      status: "pending" as const,
      flags: [],
      createdAt: new Date().toISOString(),
    }));
  if (!fresh.length) return res.status(400).json({ error: "Nothing to add. Each line needs the words and who said them." });
  try {
    const done = await mapLimit(fresh, 4, (p) => processPiece(p));
    await mapLimit(done, 8, (p) => store.putPiece(p));
    res.json({ added: done.length });
  } catch (err: any) {
    console.error("admin add:", err);
    res.status(500).json({ error: "Could not add those pieces." });
  }
});

app.post("/api/admin/library/process", async (_req, res) => {
  try {
    const todo = (await store.listLibrary()).filter((p) => p.status !== "rejected" && needsWork(p));
    const batch = todo.slice(0, 40);
    const done = await mapLimit(batch, 4, (p) => processPiece(p));
    await mapLimit(done, 8, (p) => store.putPiece(p));
    res.json({ processed: done.length, remaining: todo.length - batch.length, jev: jevConfigured() });
  } catch (err: any) {
    console.error("admin process:", err);
    res.status(500).json({ error: "Could not check the library." });
  }
});

app.patch("/api/admin/library/:id", async (req, res) => {
  try {
    const piece = await store.getPiece(String(req.params.id));
    if (!piece) return res.status(404).json({ error: "That piece isn't in the library." });
    const b = req.body || {};
    let next: LibraryPiece = { ...piece };
    const edits = cleanPiece({ ...piece, ...b });
    const changed = edits.text !== piece.text || edits.translation !== piece.translation || edits.author !== piece.author || edits.source !== piece.source;
    if (!edits.text || !edits.author) return res.status(400).json({ error: "A piece needs its words and who said them." });
    next = { ...next, ...edits };
    // The tick vouches for these exact words and credit: editing either clears it unless it's ticked again.
    if (typeof b.sourceChecked === "boolean") next.sourceChecked = b.sourceChecked;
    else if (edits.text !== piece.text || edits.author !== piece.author) next.sourceChecked = false;
    if (["pending", "approved", "rejected"].includes(b.status)) {
      next.status = b.status;
      next.reviewedAt = new Date().toISOString();
    }
    if (changed || (next.status === "approved" && needsWork(next))) {
      const status = next.status;
      next = await processPiece(next, changed);
      next.status = status; // what the curator just chose stands
    }
    await store.putPiece(next);
    res.json({ piece: curatorPiece(next) });
  } catch (err: any) {
    console.error("admin update:", err);
    res.status(500).json({ error: "Could not update that piece." });
  }
});

// ---------- Beta: sign-in, invites, waitlist ----------

const clientInvite = (i: { code: string; usedAt?: string; createdAt: string }) => ({ code: i.code, used: !!i.usedAt, createdAt: i.createdAt });

app.get("/api/me/status", async (req, res) => {
  try {
    const user = await store.getUser(req.uid!);
    res.json({ inviteOnly: INVITE_ONLY, member: !!user?.member, signedIn: !!user?.account, email: user?.account?.email || null, name: user?.account?.name || null });
  } catch (err: any) {
    console.error("status:", err);
    res.status(500).json({ error: "Could not load your account." });
  }
});

/**
 * Sign in with Google. The first time, the Google account is linked to this browser's user (so today's
 * progress is kept). On another device it switches to that same user: same streak, posts and journal.
 */
app.post("/api/auth/google", async (req, res) => {
  const who = await verifyGoogle(req.body?.credential);
  if (!who) return res.status(401).json({ error: "Google sign-in didn't work. Please try again.", session: "kept" });
  try {
    const link = await store.linkAccount({ sub: who.sub, uid: req.uid!, email: who.email, name: who.name, linkedAt: new Date().toISOString() });
    const uid = link.uid;
    const founder = ADMIN_EMAILS.has(who.email);
    let starter = false;
    const user = await store.updateUser(uid, (cur) => {
      const base = cur || newUserDoc();
      const next: UserDoc = { ...base, account: { email: who.email, name: who.name }, updatedAt: new Date().toISOString() };
      if (founder && !base.member) {
        next.member = { since: new Date().toISOString(), invitedBy: "founder" };
        starter = true;
      }
      return next;
    });
    if (starter) await store.addInvites(Array.from({ length: STARTER_INVITES }, () => newInvite(uid)));
    if (user.member) memberCache.add(uid);
    res.json({
      member: !!user.member,
      email: who.email,
      name: who.name,
      ...(uid !== req.uid ? { token: sessions.tokenFor(uid) } : {}),
    });
  } catch (err: any) {
    console.error("google sign-in:", err);
    res.status(500).json({ error: "Could not sign you in. Please try again." });
  }
});

app.post("/api/invites/redeem", async (req, res) => {
  const code = normalizeCode(req.body?.code);
  if (!code) return res.status(400).json({ error: REDEEM_MESSAGES["not-found"] });
  try {
    const user = await store.getUser(req.uid!);
    if (user?.member) return res.json({ member: true });
    if (!user?.account) return res.status(400).json({ error: "Sign in with Google first, so your invite stays with you." });
    const { result, createdBy } = await store.redeemInvite(code, req.uid!);
    if (result !== "ok") return res.status(400).json({ error: REDEEM_MESSAGES[result] });
    await store.updateUser(req.uid!, (cur) => ({
      ...(cur || newUserDoc()),
      member: { since: new Date().toISOString(), invitedBy: createdBy || "admin" },
      updatedAt: new Date().toISOString(),
    }));
    await store.addInvites(Array.from({ length: STARTER_INVITES }, () => newInvite(req.uid!)));
    memberCache.add(req.uid!);
    res.json({ member: true });
  } catch (err: any) {
    console.error("redeem:", err);
    res.status(500).json({ error: "Could not use that invite. Please try again." });
  }
});

app.get("/api/me/invites", async (req, res) => {
  try {
    res.json({ invites: (await store.listInvites(req.uid!, 50)).map(clientInvite) });
  } catch (err: any) {
    console.error("my invites:", err);
    res.status(500).json({ error: "Could not load your invites." });
  }
});

app.post("/api/waitlist", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) return res.status(400).json({ error: "That email address doesn't look right." });
  if (overLimit(`waitlist:${req.ip}`, 5)) return res.status(429).json({ error: "Please wait a few minutes and try again." });
  try {
    const added = await store.addToWaitlist({ email, createdAt: new Date().toISOString() });
    res.json({ ok: true, already: !added });
  } catch (err: any) {
    console.error("waitlist:", err);
    res.status(500).json({ error: "Could not add you to the waitlist. Please try again." });
  }
});

// Curator: make codes, see members and the waitlist.
app.post("/api/admin/invites", async (req, res) => {
  const count = Math.max(1, Math.min(50, Math.floor(Number(req.body?.count) || 1)));
  const note = String(req.body?.note || "").trim().slice(0, 120) || undefined;
  try {
    const invites = Array.from({ length: count }, () => newInvite("admin", note));
    await store.addInvites(invites);
    res.json({ codes: invites.map((i) => i.code) });
  } catch (err: any) {
    console.error("admin invites:", err);
    res.status(500).json({ error: "Could not make invite codes." });
  }
});

app.get("/api/admin/beta", async (_req, res) => {
  try {
    const [accounts, invites, waitlist] = await Promise.all([store.listAccounts(200), store.listInvites("admin", 200), store.listWaitlist(500)]);
    const members = await mapLimit(accounts, 8, async (a) => {
      const user = await store.getUser(a.uid);
      return {
        name: a.name,
        email: a.email,
        signedUp: a.linkedAt,
        member: !!user?.member,
        since: user?.member?.since || null,
        invitedBy: user?.member?.invitedBy || null,
      };
    });
    const names = new Map(accounts.map((a) => [a.uid, a.name]));
    res.json({
      members: members.map((m) => ({ ...m, invitedBy: m.invitedBy && names.has(m.invitedBy) ? names.get(m.invitedBy) : m.invitedBy })),
      invites: invites.map((i) => ({ ...clientInvite(i), note: i.note || null })),
      waitlist,
    });
  } catch (err: any) {
    console.error("admin beta:", err);
    res.status(500).json({ error: "Could not load the beta." });
  }
});

app.post("/api/admin/waitlist/invite", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) return res.status(400).json({ error: "That email address doesn't look right." });
  try {
    const invite = newInvite("admin", `for ${email}`);
    await store.addInvites([invite]);
    await store.markWaitlistInvited(email, invite.code);
    res.json({ code: invite.code });
  } catch (err: any) {
    console.error("waitlist invite:", err);
    res.status(500).json({ error: "Could not make that invite." });
  }
});

// ---------- App ----------

async function start() {
  if (process.env.NODE_ENV === "production") {
    const dist = path.resolve(__dirname, "dist");
    app.use(express.static(dist));
    app.get("/{*splat}", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }
  app
    .listen(PORT, "0.0.0.0", () => {
      console.log(`Rosa Maria listening on http://0.0.0.0:${PORT}`);
      console.log(`Data: ${store.kind}${store.kind === "firestore" ? ` (project ${process.env.GOOGLE_CLOUD_PROJECT || "NOT SET"})` : ""}`);
    })
    .on("error", (err: any) => {
      if (err?.code === "EADDRINUSE") console.error(`Port ${PORT} is already in use. Stop the other copy first.`);
      else console.error(err);
      process.exit(1);
    });
}

start();
