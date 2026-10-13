# Rosa Maria: hand-off and instruction sheet

For whoever builds Rosa Maria next (a Claude Code session on any account, or a person). Read `CLAUDE.md`
first; it holds the rules that never bend. This sheet explains what Rosa Maria is, what you start from, and
the order to build it in.

**To start a session, Napoleon says:** "Read CLAUDE.md and docs/HANDOFF.md, then do the next step that
isn't done yet." Keep the checklist at the bottom of this file up to date in each pull request, so the next
session knows where things stand.

---

## 1. What Rosa Maria is
- **For:** Filipino families and OFWs in the US (about 4 million Filipino Americans), and their families at home.
- **What it does, first version:**
  1. **Pray the Rosary** — a calm, bead-by-bead guide. Today's Mysteries are picked automatically.
  2. **Prayer cards** — like the 1990s Blue Mountain e-cards: pick an occasion, a card design, a verified
     prayer and a personal note, then send a link by Messenger, Viber, WhatsApp or text. The person who
     opens it sees a gentle animated card and a **"Pray a decade with me"** button.
- **Language:** English first, Filipino (Tagalog) next, then both side by side.
- **Tone:** warm, simple, reverent. Never pushy. Free to pray and to send cards.
- **Dedication:** an About page honouring Nanay Rosa Maria, in Napoleon's own words (ask him for the wording).

## 2. What you start from
This repository is a copy of Napoleon's app **Inspire** (as of October 2026), so a lot of the hard plumbing
already works. `README.md` still describes Inspire; rewrite it in step 1.

**Keep and reuse (rename "Inspire" to "Rosa Maria" as you go):**
- `server.ts` — the Express server that does every database and AI call, so no key reaches the browser.
- `server/store.ts` — Firestore storage, with an in-memory version for tests (`DATA_STORE=memory`).
- `server/session.ts` — anonymous visitor IDs signed by the server.
- `server/accounts.ts` + `components/InviteGate.tsx`, `GoogleSignInButton.tsx`, `InvitesCard.tsx` — Google
  sign-in, invite codes, the waitlist. Useful for a private beta; can be switched off with `INVITE_ONLY`.
- `components/CurateView.tsx` (opens at `/#curate`) — a reviewer's desk: add, edit, approve, reject, with a
  "source checked" tick. This becomes the **prayer and saint review desk**.
- `server/jev.ts` — the TypeSafe JEV client (the checker). `server/sources.ts` shows the pattern for
  checking content against outside sources.
- `components/WoopWorksheet.tsx` — print-to-PDF on one page with a QR code; reuse it for printed prayer cards.
- `components/BraggingCardModal.tsx` — makes a shareable image and link; a starting point for cards.
- `Dockerfile` and the Cloud Run deploy in `README.md`.
- Tests: `npm test` (`shared/*.test.ts`, `server/*.test.ts`).

**Strip out (step 1):** everything about social posts and creators — personas, captions, image and video
generation, the quote Vault and quote library content, the manifest series and WOOP, sparks/XP/ranks,
Monetize, Auto-Post, the KGL brand studio (`KGL_*` files, `kgl_mcp_server_spec.json`), and the Gemini
image/video/caption routes. Remove the code, its routes and its tests together, and keep the build green.

## 3. Build order (one pull request per step; wait for "merge" each time)
1. **Strip and rename.** Rosa Maria name, colours and icon; new `README.md`; remove the parts listed above;
   a plain home page with two doors: "Pray the Rosary" and "Send a prayer card". Tests, build, phone check.
2. **The locked prayer library.**
   - A data file of prayers, each with: id, title, language (`en` / `fil`), full text, **source** (e.g.
     "USCCB", "Compendium Appendix A", "CBCP"), **reviewedBy** and **reviewedOn**.
   - Only reviewed prayers are shown. Unreviewed ones show "awaiting review". No AI ever writes or edits them.
   - Start with the English texts in `docs/rosary-basics.md` (marked "to be checked"). Napoleon or a priest /
     lay minister checks each against the source, then it is marked reviewed.
   - Filipino texts are added only when copied from an official CBCP or parish source.
3. **Pray the Rosary.**
   - Follows the order in `docs/rosary-basics.md`: crucifix → Creed, Our Father, 3 Hail Marys, Glory Be, five
     decades (announce the Mystery, Our Father, 10 Hail Marys, Glory Be, optional Fatima Prayer), Hail Holy
     Queen, closing prayer.
   - Mysteries by day: Joyful (Mon, Sat), Sorrowful (Tue, Fri), Glorious (Wed, Sun), Luminous (Thu).
   - Tap anywhere to move to the next bead; a ring of beads shows progress; an English/Filipino toggle; large
     readable text; works offline once loaded; no sign-in needed.
   - Unit-test the bead sequence (should be 5 decades, 53 Hail Marys in total, 6 Our Fathers) and the
     day-to-mysteries table.
4. **Prayer cards.**
   - Occasions: birthday, safe travel, sickness / healing, exams, new baby, in loving memory (*pasiyam*),
     thank you. Each occasion suggests verified prayers only.
   - 4–6 gentle card designs (soft colours, roses, Marian blue). No AI-made images of Mary, Jesus or saints.
   - The sender adds a short personal note. JEV checks the note for chain-letter pressure, promised outcomes,
     luck or curse wording; the sender sees a kind suggestion, never a scolding.
   - Sending makes a private link (unguessable id). The recipient's page: animated card, the note, the
     prayer, "Pray a decade with me" (opens the Rosary at one decade), and "Send one back".
   - Optional: print the card on one page (reuse the worksheet's print + QR approach).
5. **Verified saints.** A data file of saints and feast days copied from the General Roman Calendar (plus the
   US and Philippine calendars), each with its source. Start with San Lorenzo Ruiz (canonized 1987, a patron
   for Filipino overseas workers) and San Pedro Calungsod (canonized 2012). A "Saint of the day" card on the
   home page. Any saint named in a card note that isn't in the list is flagged for review.
6. **Later (ask Napoleon before starting):** the novena library; family intentions (a private link, "I
   prayed 🙏", ends after 9 days); "Make your own prayer" with JEV checks, always labelled "Your own prayer";
   printed cards for wakes, novenas and baptisms; the About page dedication.

## 4. Where the content comes from
See `docs/rosary-basics.md` section 1. In short:
- **Vatican:** *Compendium of the Catechism of the Catholic Church*, Appendix A (Common Prayers).
- **US English:** USCCB prayer texts.
- **Filipino:** CBCP and Philippine parish texts (*Ama Namin*, *Aba Ginoong Maria*, *Luwalhati*,
  *Sumasampalataya Ako*, *Aba Po, Santa Mariang Hari*).
- **Luminous Mysteries:** St. John Paul II, *Rosarium Virginis Mariae* (2002).
- **Saints:** General Roman Calendar, Roman Martyrology, Dicastery for the Causes of Saints.

## 5. Setup (separate from Inspire)
Rosa Maria gets **its own Google Cloud project**, so its data, limits and bill never mix with Inspire's.
- Follow `README.md` Steps 1–3 (from the Inspire copy) with these changes: a new project, the service name
  `rosa-maria`, secret names starting `rosa-` (e.g. `rosa-session-secret`, `rosa-curator-code`,
  `rosa-jev-key`), and a new storage bucket. Region `asia-southeast1` is fine; `us-west1` is closer to most
  Filipino Americans — ask Napoleon.
- Settings (names only; values go in Secret Manager or the deploy command, never in the code or chat):
  `GOOGLE_GENAI_USE_VERTEXAI`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `GCS_BUCKET`, `SESSION_SECRET`,
  `ADMIN_CODE`, `JEV_API_KEY`, `JEV_BASE_URL`, `INVITE_ONLY`, `GOOGLE_CLIENT_ID`, `ADMIN_EMAILS`.
  `AUTH_TEST_SECRET` is for local tests only and must never be set in production.
- Give Napoleon the deploy as copy-and-paste blocks for Cloud Shell, the same way Inspire's `README.md` does.

## 6. How to test locally
- `npm install`, then `npm test`, `npx tsc --noEmit`, `npm run build`.
- Run the server with `DATA_STORE=memory NODE_ENV=production PORT=3000 SESSION_SECRET=test ADMIN_CODE=test`
  and point `GOOGLE_GEMINI_BASE_URL` / `JEV_BASE_URL` at a small stand-in server you write for tests, so tests
  never call real services or spend money.
- Use Playwright with a phone screen (e.g. Pixel 7) for every screen you change; check there are no page
  errors; check anything printable fits one page on Letter and A4.

## 7. Progress checklist (update this in every pull request)
- [ ] 1. Strip and rename
- [ ] 2. Locked prayer library (English reviewed)
- [ ] 2b. Filipino prayer texts from an official source, reviewed
- [ ] 3. Pray the Rosary
- [ ] 4. Prayer cards
- [ ] 5. Verified saints + saint of the day
- [ ] Own Google Cloud project set up and first deploy done
- [ ] About page dedication (Napoleon's words)
