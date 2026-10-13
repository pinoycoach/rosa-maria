# Rosa Maria — read this first

Rosa Maria is an honest Catholic prayer app: a guided Rosary and Blue Mountain-style prayer cards, made for
Filipino families in the US and at home. It is named after Napoleon's Nanay, Rosa Maria. The full instruction
sheet is `docs/HANDOFF.md`; the Rosary content is in `docs/rosary-basics.md`. Read both before any work.

This code started as a copy of Napoleon's other app, Inspire. Rosa Maria is a separate product: never send
anything to Inspire's repository, Google Cloud project or database, and don't add Inspire features back.

## Who you're working with
- Napoleon is the owner. He is not a programmer. Talk in plain sentences, the way you would to a friend:
  no file paths, flags or jargon unless he asks. When something is done, one or two lines on what changed.
- When he needs to do something himself (Google Cloud, GitHub settings), give exact copy-and-paste steps.
- Never ask him to paste an API key, password, passcode or curator code into the chat. Secrets go into
  Google Secret Manager with the `read -s` pattern shown in `README.md`.

## How work is delivered
- One step of the plan = one branch + one pull request. Run the tests, the type check and the build, and
  try it in a real browser on a phone-sized screen (Playwright) before opening the PR.
- Never merge a pull request until Napoleon says "merge".
- Never put an AI model's name or ID in commits, PR text or code comments.

## The rules that make Rosa Maria trustworthy (never bend these)
1. **Official prayers are never written or changed by AI.** They come from approved sources (Vatican
   Compendium Appendix A, USCCB for US English, CBCP / Philippine parish texts for Filipino), are entered
   once with their source, checked by a person, and locked. If a text isn't verified yet, it's shown as
   "awaiting review", not guessed.
2. **Saints and feast days come only from the Church's own lists** (General Roman Calendar, Roman
   Martyrology, Dicastery for the Causes of Saints). A name not on the verified list is never shown as a saint.
3. **JEV is a checker, not an authority.** It can flag problems in personal prayers and card notes; it can
   never certify that something is Church-approved. People decide.
4. **Honest by design.** No chain letters ("send to 10 people"), no "pray this and you will get X", no luck,
   curses or fear. No paywall on praying. Personal prayers are labelled "Your own prayer".
5. **English first, Filipino next**, then both side by side. Filipino texts are copied from an official
   source, never translated by AI and passed off as the Church's text.
