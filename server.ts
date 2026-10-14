// Rosa Maria server: serves the built app and makes every database and checker call, so no key
// ever reaches the browser.
import express from "express";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { MemoryStore, MemoryMedia, createFirestoreStore, createGcsMedia, type Store, type MediaStore, type UserDoc } from "./server/store";
import { PRAYERS, prayerById } from "./shared/prayers";
import { textHash, publicPrayer, deskPrayer, cleanReviewer, saintKey, saintHash, publicSaints, deskSaint, type Review } from "./server/reviews";
import { SAINTS, saintById, unknownSaintNames } from "./shared/saints";
import { occasionById, isDesign, cleanText, NOTE_MAX, NAME_MAX, CARD_ID } from "./shared/cards";
import { noteQuestions, combineFlags, describeFlags } from "./server/cardChecks";
import { askJev } from "./server/jev";
import type { CardDoc } from "./server/store";
import { aiConfigured, makePicture, checkPicture, isBusy } from "./server/ai";
import { checkPicturePrompt, pictureIsSafe, ownsPicture, PICTURE_PATH, PICTURE_TYPES, PICTURE_MAX_BYTES, PICTURE_PROMPT_MAX } from "./shared/pictures";
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
// Uploaded card photos are bigger than anything else (the page shrinks them first); everything else stays small.
const smallJson = express.json({ limit: "1mb" });
const photoJson = express.json({ limit: "8mb" });
app.use((req, res, next) => (req.path === "/api/cards/picture/upload" ? photoJson : smallJson)(req, res, next));

// ---------- Data: database and sessions ----------

// DATA_STORE=memory keeps everything in memory (local runs, tests). Otherwise Firestore.
const USE_MEMORY = process.env.DATA_STORE === "memory";
const store: Store = USE_MEMORY ? new MemoryStore() : await createFirestoreStore();
// Card pictures: a Cloud Storage bucket (GCS_BUCKET), or memory when there is none (lost on restart).
const GCS_BUCKET = process.env.GCS_BUCKET || "";
const media: MediaStore = USE_MEMORY || !GCS_BUCKET ? new MemoryMedia() : await createGcsMedia(GCS_BUCKET);
if (!USE_MEMORY && !GCS_BUCKET) console.warn("GCS_BUCKET is not set: card pictures are kept in memory and lost when the server restarts.");

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

/** Counts one use against today's limit; false when the limit is already reached. */
const takeDaily = async (key: string, limit: number) => (await store.bumpUsage(`${new Date().toISOString().slice(0, 10)}_${key}`)) <= limit;
const CARD_DAILY_LIMIT = Number(process.env.CARD_DAILY_LIMIT) || 30;
const GLOBAL_CARD_DAILY_LIMIT = Number(process.env.GLOBAL_CARD_DAILY_LIMIT) || 3000;

const OPEN_PATHS = new Set(["/api/config", "/api/unlock"]);
/**
 * Readable by anyone, even while the app is locked or invite-only: a card's recipient opens its link (and may
 * pray a decade) without a passcode or account. Only checked prayers and signed-off saints are ever sent.
 */
const isPublicRead = (method: string, p: string) =>
  method === "GET" && (p === "/api/prayers" || p === "/api/saints" || /^\/api\/cards\/[A-Za-z0-9_-]{16}$/.test(p) || p.startsWith("/api/media/"));
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
  if (OPEN_PATHS.has(p)) return next();
  if (isPublicRead(req.method, p)) {
    if (overLimit(`all:${req.ip || "unknown"}`, GENERAL_RATE_LIMIT)) {
      return res.status(429).json({ error: "Too many requests. Please wait a few minutes and try again." });
    }
    return next();
  }
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
  // The review desk has its own code; everything else needs a member once the beta is invite-only.
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
    pictureAI: aiConfigured(),
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

/** "Delete my data": the cards you sent and their pictures, the account link, unused invites and the user record. */
app.delete("/api/me", async (req, res) => {
  try {
    await store.deleteCardsBy(req.uid!);
    await media.deletePrefix(`pictures/${req.uid}/`);
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

// ---------- Prayers: shown only once a person has checked the exact words ----------

// Reviews change rarely and are read on every visit: keep them for a minute.
let reviewCache: { at: number; reviews: Map<string, Review> } | null = null;
const currentReviews = async () => {
  if (!reviewCache || Date.now() - reviewCache.at > 60_000) {
    const list = await store.listReviews();
    reviewCache = { at: Date.now(), reviews: new Map(list.map((r) => [r.itemId, r])) };
  }
  return reviewCache.reviews;
};

app.get("/api/prayers", async (_req, res) => {
  try {
    const reviews = await currentReviews();
    res.json({ prayers: PRAYERS.map((p) => publicPrayer(p, reviews)) });
  } catch (err: any) {
    console.error("prayers:", err);
    res.status(500).json({ error: "Could not load the prayers." });
  }
});

app.get("/api/saints", async (_req, res) => {
  try {
    res.json({ saints: publicSaints(SAINTS, await currentReviews()) });
  } catch (err: any) {
    console.error("saints:", err);
    res.status(500).json({ error: "Could not load the saints." });
  }
});

// ---------- Prayer cards ----------

/** The plain rules, then JEV. Saint names not on the verified list are noted for a person to look at. */
async function checkNote(note: string) {
  if (!note) return describeFlags([]);
  const jev = await askJev(`A personal note on a Catholic prayer card:\n${note}`, noteQuestions());
  for (const name of unknownSaintNames(note)) await store.flagSaintName(name).catch(() => {});
  return describeFlags(combineFlags(note, jev));
}

app.post("/api/cards/check", async (req, res) => {
  try {
    res.json(await checkNote(cleanText(req.body?.note, NOTE_MAX)));
  } catch (err: any) {
    console.error("card check:", err);
    res.status(500).json({ error: "Could not check the note. Please try again." });
  }
});

// ---------- Card pictures: your own photo, or one made with AI (never people or holy figures) ----------

const mediaUrl = (path: string) => `/api/media/${path}?s=${sessions.mediaSig(path)}`;
const PICTURE_DAILY_LIMIT = Number(process.env.PICTURE_DAILY_LIMIT) || 10;
const GLOBAL_PICTURE_DAILY_LIMIT = Number(process.env.GLOBAL_PICTURE_DAILY_LIMIT) || 300;
const UPLOAD_DAILY_LIMIT = Number(process.env.UPLOAD_DAILY_LIMIT) || 20;

const keepPicture = async (uid: string, data: Buffer, mimeType: string) => {
  const path = `pictures/${uid}/${crypto.randomBytes(8).toString("hex")}.${PICTURE_TYPES[mimeType]}`;
  await media.put(path, data, mimeType);
  return path;
};

app.post("/api/cards/picture/make", async (req, res) => {
  const prompt = String(req.body?.prompt || "").trim().slice(0, PICTURE_PROMPT_MAX);
  const ok = checkPicturePrompt(prompt);
  if (!ok.ok) return res.status(400).json({ error: ok.message });
  if (!aiConfigured()) return res.status(503).json({ error: "Making pictures isn't switched on yet. You can upload your own photo instead." });
  if (overLimit(`pic:${req.uid}`, 15)) return res.status(429).json({ error: "Please wait a few minutes before making another picture." });
  if (!(await takeDaily(`pic_${req.uid}`, PICTURE_DAILY_LIMIT)) || !(await takeDaily("pic_all", GLOBAL_PICTURE_DAILY_LIMIT))) {
    return res.status(429).json({ error: "That's all the pictures we can make today. Please try again tomorrow, or upload your own photo." });
  }
  try {
    const picture = await makePicture(prompt);
    if (!picture || !PICTURE_TYPES[picture.mimeType]) return res.status(502).json({ error: "No picture came back this time. Please try again." });
    if (!pictureIsSafe(await checkPicture(picture.data, picture.mimeType))) {
      return res.status(422).json({ error: "That picture didn't come out right for a prayer card. Please try again, or change the description a little." });
    }
    const path = await keepPicture(req.uid!, Buffer.from(picture.data, "base64"), picture.mimeType);
    res.json({ picture: { path, kind: "ai", url: mediaUrl(path) } });
  } catch (err: any) {
    console.error("make picture:", err);
    res.status(isBusy(err) ? 503 : 500).json({ error: isBusy(err) ? "Google's AI is busy right now. Try again in a minute." : "Could not make the picture. Please try again." });
  }
});

app.post("/api/cards/picture/upload", async (req, res) => {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body?.image || ""));
  if (!m) return res.status(400).json({ error: "Please choose a photo (JPG, PNG or WebP)." });
  const data = Buffer.from(m[2], "base64");
  if (!data.length || data.length > PICTURE_MAX_BYTES) return res.status(413).json({ error: "That photo is too large. Please choose a smaller one." });
  if (!(await takeDaily(`upload_${req.uid}`, UPLOAD_DAILY_LIMIT))) return res.status(429).json({ error: "That's a lot of photos for one day. Please try again tomorrow." });
  try {
    // Your own photos may show people and church statues; only clearly unsuitable pictures are refused.
    if (aiConfigured()) {
      const verdict = await checkPicture(m[2], m[1]);
      if (verdict?.inappropriate === true) return res.status(422).json({ error: "That photo can't be used on a prayer card. Please choose another." });
    }
    const path = await keepPicture(req.uid!, data, m[1]);
    res.json({ picture: { path, kind: "photo", url: mediaUrl(path) } });
  } catch (err: any) {
    console.error("upload picture:", err);
    res.status(500).json({ error: "Could not save the photo. Please try again." });
  }
});

app.get("/api/media/*path", async (req, res) => {
  const path = ([] as string[]).concat((req.params as any).path).join("/");
  if (!PICTURE_PATH.test(path) || !sessions.mediaSigValid(path, req.query.s)) return res.status(404).end();
  try {
    const file = await media.get(path);
    if (!file) return res.status(404).end();
    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.send(file.data);
  } catch (err: any) {
    console.error("media:", err);
    res.status(500).end();
  }
});

const clientCard = async (c: CardDoc) => {
  const reviews = await currentReviews();
  const prayer = prayerById(c.prayerId);
  const { senderUid, flags, picture, ...rest } = c;
  return {
    ...rest,
    ...(picture ? { picture: { kind: picture.kind, url: mediaUrl(picture.path) } } : {}),
    prayer: prayer ? publicPrayer(prayer, reviews) : null,
  };
};

app.post("/api/cards", async (req, res) => {
  const b = req.body || {};
  const occasion = occasionById(String(b.occasion || ""));
  if (!occasion) return res.status(400).json({ error: "Pick an occasion for the card." });
  if (!isDesign(b.design)) return res.status(400).json({ error: "Pick a card design." });
  const prayer = prayerById(String(b.prayerId || ""));
  try {
    const reviews = await currentReviews();
    if (!prayer || publicPrayer(prayer, reviews).status !== "reviewed") {
      return res.status(400).json({ error: "Pick one of the checked prayers for the card." });
    }
    const note = cleanText(b.note, NOTE_MAX);
    const check = await checkNote(note);
    if (check.blocked) return res.status(400).json({ error: check.flags.find((f) => f.kind === "chain")!.message, ...check });
    if (check.flags.length && b.keepNote !== true) return res.status(409).json(check);
    if (!(await takeDaily(`cards_${req.uid}`, CARD_DAILY_LIMIT)) || !(await takeDaily("cards_all", GLOBAL_CARD_DAILY_LIMIT))) {
      return res.status(429).json({ error: "That's a lot of cards for one day. Please send more tomorrow." });
    }
    const pic = b.picture;
    if (pic && (!ownsPicture(String(pic.path || ""), req.uid!) || !["photo", "ai"].includes(pic.kind))) {
      return res.status(400).json({ error: "That picture can't be used. Please choose it again." });
    }
    const card: CardDoc = {
      id: crypto.randomBytes(12).toString("base64url"),
      occasion: occasion.id,
      design: b.design,
      prayerId: prayer.id,
      toName: cleanText(b.toName, NAME_MAX),
      fromName: cleanText(b.fromName, NAME_MAX),
      note,
      ...(pic ? { picture: { path: String(pic.path), kind: pic.kind } } : {}),
      flags: check.flags.map((f) => f.kind),
      senderUid: req.uid!,
      createdAt: new Date().toISOString(),
    };
    await store.putCard(card);
    res.json({ card: await clientCard(card) });
  } catch (err: any) {
    console.error("send card:", err);
    res.status(500).json({ error: "Could not make the card. Please try again." });
  }
});

app.get("/api/cards/:id", async (req, res) => {
  const id = String(req.params.id || "");
  if (!CARD_ID.test(id)) return res.status(404).json({ error: "We couldn't find that card." });
  try {
    const card = await store.getCard(id);
    if (!card) return res.status(404).json({ error: "We couldn't find that card. It may have been removed." });
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ card: await clientCard(card) });
  } catch (err: any) {
    console.error("open card:", err);
    res.status(500).json({ error: "Could not open the card. Please try again." });
  }
});

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

// ---------- Review desk (ADMIN_CODE) ----------

app.use("/api/admin", (req, res, next) => {
  if (!ADMIN_CODE) return res.status(404).json({ error: "The review desk is switched off on this server." });
  if (!secretMatches(req.get("x-admin-code"), ADMIN_CODE)) return res.status(403).json({ error: "That reviewer code isn't right." });
  next();
});

app.get("/api/admin/prayers", async (_req, res) => {
  try {
    const reviews = new Map((await store.listReviews()).map((r) => [r.itemId, r]));
    res.json({ prayers: PRAYERS.map((p) => deskPrayer(p, reviews)) });
  } catch (err: any) {
    console.error("admin prayers:", err);
    res.status(500).json({ error: "Could not load the prayers." });
  }
});

/**
 * A person signs off a prayer. They must say they compared it word for word, and send the fingerprint of the
 * words they were shown, so a sign-off can never land on words they didn't see.
 */
app.post("/api/admin/prayers/:id/review", async (req, res) => {
  const prayer = prayerById(String(req.params.id));
  if (!prayer) return res.status(404).json({ error: "That prayer isn't in the library." });
  const b = req.body || {};
  const reviewedBy = cleanReviewer(b.reviewedBy);
  if (!reviewedBy) return res.status(400).json({ error: "Write the name of the person who checked it." });
  if (b.comparedWordForWord !== true) return res.status(400).json({ error: "Tick the box to confirm you compared it word for word." });
  if (b.textHash !== textHash(prayer.text)) return res.status(409).json({ error: "This prayer's words have changed since you opened it. Reload and check it again." });
  const review: Review = { itemId: prayer.id, textHash: textHash(prayer.text), reviewedBy, reviewedOn: new Date().toISOString().slice(0, 10) };
  try {
    await store.putReview(review);
    reviewCache = null;
    res.json({ prayer: deskPrayer(prayer, new Map([[prayer.id, review]])) });
  } catch (err: any) {
    console.error("review prayer:", err);
    res.status(500).json({ error: "Could not save the review." });
  }
});

app.delete("/api/admin/prayers/:id/review", async (req, res) => {
  const prayer = prayerById(String(req.params.id));
  if (!prayer) return res.status(404).json({ error: "That prayer isn't in the library." });
  try {
    await store.deleteReview(prayer.id);
    reviewCache = null;
    res.json({ prayer: deskPrayer(prayer, new Map()) });
  } catch (err: any) {
    console.error("unreview prayer:", err);
    res.status(500).json({ error: "Could not undo the review." });
  }
});

app.get("/api/admin/saints", async (_req, res) => {
  try {
    const reviews = new Map((await store.listReviews()).map((r) => [r.itemId, r]));
    res.json({ saints: SAINTS.map((s) => deskSaint(s, reviews)), flagged: await store.listSaintFlags(100) });
  } catch (err: any) {
    console.error("admin saints:", err);
    res.status(500).json({ error: "Could not load the saints." });
  }
});

app.post("/api/admin/saints/:id/review", async (req, res) => {
  const saint = saintById(String(req.params.id));
  if (!saint) return res.status(404).json({ error: "That saint isn't on the list." });
  const b = req.body || {};
  const reviewedBy = cleanReviewer(b.reviewedBy);
  if (!reviewedBy) return res.status(400).json({ error: "Write the name of the person who checked it." });
  if (b.comparedWithSource !== true) return res.status(400).json({ error: "Tick the box to confirm you checked it against the source." });
  if (b.textHash !== saintHash(saint)) return res.status(409).json({ error: "This entry has changed since you opened it. Reload and check it again." });
  const review: Review = { itemId: saintKey(saint.id), textHash: saintHash(saint), reviewedBy, reviewedOn: new Date().toISOString().slice(0, 10) };
  try {
    await store.putReview(review);
    reviewCache = null;
    res.json({ saint: deskSaint(saint, new Map([[review.itemId, review]])) });
  } catch (err: any) {
    console.error("review saint:", err);
    res.status(500).json({ error: "Could not save the review." });
  }
});

app.delete("/api/admin/saints/:id/review", async (req, res) => {
  const saint = saintById(String(req.params.id));
  if (!saint) return res.status(404).json({ error: "That saint isn't on the list." });
  try {
    await store.deleteReview(saintKey(saint.id));
    reviewCache = null;
    res.json({ saint: deskSaint(saint, new Map()) });
  } catch (err: any) {
    console.error("unreview saint:", err);
    res.status(500).json({ error: "Could not undo the review." });
  }
});

app.delete("/api/admin/saint-flags", async (req, res) => {
  try {
    await store.dismissSaintFlag(String(req.body?.name || ""));
    res.json({ ok: true });
  } catch (err: any) {
    console.error("dismiss saint flag:", err);
    res.status(500).json({ error: "Could not clear that name." });
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

// Review desk: make invite codes, see members and the waitlist.
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
