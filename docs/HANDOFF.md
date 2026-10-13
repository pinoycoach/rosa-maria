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
  `rosa-jev-key`). Region: **`us-west1` (Oregon)**, Napoleon's choice: in the US, close to California
  where most Filipino Americans live, on the cheaper price tier, and on the Pacific side for families in the
  Philippines and elsewhere. A storage bucket isn't needed until something stores files.
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

**Notes from steps 4 and 5:**
- Cards: `shared/cards.ts` (occasions, designs, note rules), `server/cardChecks.ts` (JEV questions),
  `CardComposer.tsx`, `CardOpenView.tsx`, `CardArt.tsx` (6 drawn designs, no pictures of holy figures). A card is
  stored with an unguessable 16-character id; `/c/<id>` opens it. Card links, `/api/prayers` and `/api/saints`
  are readable without the passcode or an invite, so recipients can open cards during the private beta.
- Card notes: chain letters are refused (kindly); promises, luck and curse wording get a kind suggestion and the
  sender may keep their note. JEV adds a flag only at 0.6 or more. Occasions only offer signed-off prayers; the
  Eternal Rest prayer (for pasiyam) and others should be added through the copy-from-source + sign-off process.
- Saints: `shared/saints.ts` has San Lorenzo Ruiz (28 September, General Roman Calendar) and San Pedro Calungsod
  (2 April, Philippine calendar), entered with Vatican source links. Their details must be checked and signed off
  on the desk's Saints tab before they show. Add more only from the General Roman Calendar, the US or Philippine
  calendars, or the Dicastery. Saint names in card notes that aren't on the list are kept (name only) for review.
- Not built yet: printing a card on one page (optional in the plan).

**Notes from step 3:**
- `shared/rosary.ts` holds the bead order and the day-to-Mysteries table (tested: 5 decades, 53 Hail Marys,
  6 Our Fathers). `RosaryView.tsx` is the praying screen; `BeadRing.tsx` draws the beads.
- A prayer still awaiting review shows its name and "please pray it from memory or your own prayer book", never
  guessed words. The Fatima Prayer can be switched off on the start screen.
- `public/sw.js` keeps the app and `/api/prayers` on the phone (network first), so it works offline once opened.
- For step 4's "Pray a decade with me", add a one-decade option to `rosarySteps`.

**Notes from step 2:**
- The prayers are in `shared/prayers.ts`, copied unchanged from `docs/rosary-basics.md` (a test checks every word).
  Each names its source (USCCB, How to Pray the Rosary) and a link.
- Sign-offs are stored in Firestore (`reviews`), each tied to a fingerprint of the exact words, the reviewer's
  name and the date. Editing a text cancels its sign-off. `GET /api/prayers` sends the words only for signed-off
  prayers. Step 3 should read prayers from there and show "awaiting review" for the rest.
- The quote library, Wikiquote checks and bulk approval from Inspire were removed; the review desk is now prayers
  (plus the Beta tab). `server/jev.ts` stays for the prayer-card notes in step 4.

**Notes from step 1** (for the next session):
- Removed with their routes and tests: posts, personas, captions, Gemini (image, video, captions, embeddings),
  the quote Vault and quotes, "How are you today?" and the journal, manifest series and WOOP, streaks /
  sparks / XP / ranks, Monetize, Auto-Post, the KGL studio. Gemini and Cloud Storage are no longer used, so
  setup needs neither `GOOGLE_GENAI_USE_VERTEXAI` nor `GCS_BUCKET` for now.
- `WoopWorksheet.tsx` (print + QR) and `BraggingCardModal.tsx` (shareable image) were tied to removed features
  and didn't build without them, so they were removed too. For step 4, read them from the first commit
  (`git show 8ae03b5:components/WoopWorksheet.tsx`) and rebuild what's needed; re-add `qrcode` and
  `html-to-image` then.
- Invite codes now start `ROSA-`.
- The two home-page doors open an honest "being prepared" note until steps 3 and 4 are built.

- [x] 1. Strip and rename
- [x] 2. Locked prayer library built (8 English prayers, review desk at `/#curate`)
- [ ] 2a. English prayers checked and signed off by a person on the review desk
- [ ] 2b. Filipino prayer texts from an official source, reviewed
- [x] 3. Pray the Rosary (English; Filipino toggle shows "soon" until 2b)
- [x] 4. Prayer cards (printing a card is not built yet; optional)
- [x] 5. Verified saints + saint of the day (built; the 2 saints still need a person's sign-off)
- [ ] Own Google Cloud project set up and first deploy done
- [ ] About page dedication (Napoleon's words)
