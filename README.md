# Inspire Engine

A free inspiration studio. Tell it how you feel and get a short, kind reply built only from a
hand-picked library of real, credited words. Or describe or upload an image, pick a persona, and get 5 ready-to-post
captions (inspirational, question, informative, humorous, call to action) for Instagram, Facebook,
X, LinkedIn, TikTok or Threads. It also has a quote vault, daily streaks with sparks and XP,
unlockable series, and the KGL brand and merch studio.

**How it's built:**
- A small server (`server.ts`) makes every AI and database call, so **no key ever reaches the browser**.
- AI runs on **Vertex AI**, which bills your Google Cloud project (free credit first), or on a Gemini API key.
- Progress, posts, personas and quotes live in **Firestore**; post pictures live in **Cloud Storage**.
  Only the server can reach them.
- Visitors get an **anonymous ID** signed by the server. There's no sign-up, and nobody can read or
  change someone else's progress.
- Streaks, sparks and XP are worked out **on the server**, so they can't be faked from the browser.
- **"How are you today?"** replies come from a **curated library**. Gemini embeddings find the pieces closest in
  meaning; **JEV** (TypeSafe) picks the best fit and checks the reply for predictions, promises, selling and made-up
  quotes; Gemini writes 3–5 sentences from those pieces only. A safety gate shows real crisis lines instead.
- It's hosted on **Cloud Run**.

You don't need anything installed on your computer. Everything below runs in your browser with
**Google Cloud Shell** (https://shell.cloud.google.com), signed in with the account that owns the
Google Cloud project.

---

## Step 1: one-time Google Cloud setup

Replace `YOUR_PROJECT_ID` with your project ID, then paste this block:

```bash
PROJECT=YOUR_PROJECT_ID
BUCKET=${PROJECT}-inspire
gcloud config set project $PROJECT
gcloud services enable aiplatform.googleapis.com storage.googleapis.com firestore.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

# The database (once per project; if it says a database already exists, that's fine)
gcloud firestore databases create --location=asia-southeast1

# A private bucket for post pictures. Anything under inspire/ (temporary video files) is deleted after 1 day.
gcloud storage buckets create gs://$BUCKET --location=asia-southeast1 --uniform-bucket-level-access
printf '{"rule":[{"action":{"type":"Delete"},"condition":{"age":1,"matchesPrefix":["inspire/"]}}]}' > /tmp/lifecycle.json
gcloud storage buckets update gs://$BUCKET --lifecycle-file=/tmp/lifecycle.json
```

Let the app's Cloud Run identity build the app, use Vertex AI, the database and the bucket:

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
SA="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding $PROJECT --member="$SA" --role="roles/aiplatform.user" --condition=None
gcloud projects add-iam-policy-binding $PROJECT --member="$SA" --role="roles/datastore.user" --condition=None
gcloud projects add-iam-policy-binding $PROJECT --member="$SA" --role="roles/run.builder" --condition=None
gcloud storage buckets add-iam-policy-binding gs://$BUCKET --member="$SA" --role="roles/storage.objectAdmin"
```

**A session secret.** This signs visitors' anonymous IDs. It's made for you; you never see it:

```bash
openssl rand -hex 32 | tr -d '\n' | gcloud secrets create inspire-session-secret --data-file=-
gcloud secrets add-iam-policy-binding inspire-session-secret --member="$SA" --role="roles/secretmanager.secretAccessor"
```

**Pick a passcode.** While you're building, the app stays locked so nobody else can spend your
credit. The first line asks for it without showing it. Type it, then press Enter:

```bash
read -s -p "App passcode: " CODE && printf "%s" "$CODE" | gcloud secrets create inspire-passcode --data-file=- && unset CODE
gcloud secrets add-iam-policy-binding inspire-passcode --member="$SA" --role="roles/secretmanager.secretAccessor"
```

> If the hidden prompt keeps catching an empty Enter, create the secret on the web instead:
> **Security → Secret Manager → Create secret**, name `inspire-passcode`, and type the passcode in the box.

**Your JEV key and a curator code.** The JEV key comes from your TypeSafe account. The curator code is a
second password, only for you, that opens the library page. Paste or type each one at the hidden prompt:

```bash
read -s -p "TypeSafe JEV key: " K && printf "%s" "$K" | gcloud secrets create inspire-jev-key --data-file=- && unset K
read -s -p "Curator code: " K && printf "%s" "$K" | gcloud secrets create inspire-curator-code --data-file=- && unset K
gcloud secrets add-iam-policy-binding inspire-jev-key --member="$SA" --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding inspire-curator-code --member="$SA" --role="roles/secretmanager.secretAccessor"
```

## Step 2: get the code

```bash
cd ~ && git clone https://github.com/pinoycoach/inspire-build-ship-release.git
cd inspire-build-ship-release
```

## Step 3: put it online

```bash
gcloud run deploy inspire-engine \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --timeout 600 \
  --max-instances 2 \
  --set-secrets APP_PASSCODE=inspire-passcode:latest,SESSION_SECRET=inspire-session-secret:latest,JEV_API_KEY=inspire-jev-key:latest,ADMIN_CODE=inspire-curator-code:latest \
  --set-env-vars GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_PROJECT=$PROJECT,GCS_BUCKET=$BUCKET,VIDEO_ENABLED=false
```

Say **Y** if it asks to create a repository. It takes a few minutes and ends with a web address like
`https://inspire-engine-xxxxx.asia-southeast1.run.app`. Open it, enter your passcode, check in, and
make a post. Refresh the page: your streak and your post are still there.

The 12 starter quotes are copied into the database the first time the server starts. To add more,
add them to `data/quotesDatabase.ts` and redeploy; only new ones are added.

## Step 4: curate the library

Nothing is used in replies until you approve it.

1. Open your app's address with `/#curate` on the end, and enter your curator code.
2. Press **Label & index now**. JEV labels each piece (theme, the feeling it helps) and flags anything that sounds
   like a prediction, sounds preachy, or may be misattributed.
3. Read the flagged ones yourself. **Approve** or **Reject** each, or use **Approve all with no flags**.
4. **Add pieces** takes one per line: `words | who said them | source | translation` (the last two are optional).

The library starts with the 12 Vault quotes and 12 Filipino proverbs (salawikain), all waiting for review.

## Step 5 (optional): the invite-only beta

With this on, the shared passcode is replaced by **Sign in with Google + an invite code**. Every member gets 3
invites, plus more at a 7-day streak (+1) and a 30-day streak (+2). Your own Google email is always let in.

1. **Google sign-in ID** (about 5 minutes, in the Cloud Console):
   - **APIs & Services → OAuth consent screen**: choose *External*, app name `Inspire`, your email as support
     and developer contact. Save. (Publish the app when you open it beyond test users.)
   - **APIs & Services → Credentials → Create credentials → OAuth client ID**: type *Web application*. Under
     **Authorized JavaScript origins** add your app's address, e.g. `https://inspire-engine-xxxxx.asia-southeast1.run.app`.
     Copy the **Client ID** (it ends in `.apps.googleusercontent.com`; it's public, not a secret).
2. Deploy with three more settings (put your real values in):

```bash
gcloud run deploy inspire-engine --source . --region asia-southeast1 --allow-unauthenticated --memory 1Gi --timeout 600 --max-instances 2 \
  --set-secrets APP_PASSCODE=inspire-passcode:latest,SESSION_SECRET=inspire-session-secret:latest,JEV_API_KEY=inspire-jev-key:latest,ADMIN_CODE=inspire-curator-code:latest \
  --set-env-vars GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_PROJECT=$PROJECT,GCS_BUCKET=$BUCKET,VIDEO_ENABLED=false,INVITE_ONLY=true,GOOGLE_CLIENT_ID=YOUR_CLIENT_ID,ADMIN_EMAILS=you@gmail.com
```

3. Open the app, **Sign in with Google** with your own email: you're in, with your progress kept. Make codes
   for others in `/#curate` → **Beta**, where you also see members and the waitlist.

To switch the beta off later, deploy with `INVITE_ONLY=false` (the passcode applies again).

**Publishing changes later:** `cd ~/inspire-build-ship-release && git pull`, then run the same
deploy command.

If you closed Cloud Shell since Step 1, set `PROJECT=…` and `BUCKET=${PROJECT}-inspire` again
before deploying.

---

## Costs and protection

- **Who pays:** in Vertex mode everything bills the Google Cloud project, and free credit is used first.
  - **Images and captions** cost cents.
  - **Firestore** has a free daily allowance that a small app stays inside.
  - **Video is off.** It costs dollars per clip. `VIDEO_ENABLED=true` turns it back on, with
    `VIDEO_DAILY_LIMIT` clips per day (default 5).
- **Passcode** (`APP_PASSCODE`): every request needs it. To change it, add a new version of the
  secret in Secret Manager and redeploy.
- **Rate limits per visitor:** 40 AI requests (`RATE_LIMIT_PER_10MIN`) and 400 requests in total
  (`GENERAL_RATE_LIMIT_PER_10MIN`) per 10 minutes.
- **Daily limits per visitor:** 20 AI images (`IMAGE_DAILY_LIMIT`) and 60 caption sets (`CAPTION_DAILY_LIMIT`).
- **Reflections:** 10 per visitor per day (`REFLECT_DAILY_LIMIT`). Each costs one embedding, a few JEV questions
  and one short Gemini reply.
- **Daily limit for everyone together:** 500 AI images (`GLOBAL_IMAGE_DAILY_LIMIT`), so a busy day can't run up the bill.
- **`--max-instances 2`** keeps the bill predictable.
- **Security headers** (content security policy, no framing, no sniffing) are on in production.
- **Keep a budget alert** on the billing account (Billing → Budgets & alerts).

### Before opening it to the public
1. Remove `APP_PASSCODE=inspire-passcode:latest,` from `--set-secrets` and redeploy. Keep the
   `SESSION_SECRET` part.
2. Keep the limits. Lower `GLOBAL_IMAGE_DAILY_LIMIT` if you want a tighter cost ceiling.
3. Read the **Privacy & Terms** page (footer link) and adjust the wording if needed. Visitors can
   delete all their data from there.

### Good to know
- Progress is kept **per browser** for now. A phone and a laptop each have their own streak until
  sign-in is added.
- Clearing the browser's site data starts a fresh profile; the old one can no longer be reached.

## Running it on your own computer (optional)

```bash
cp .env.example .env.local   # fill in Vertex settings, or GEMINI_API_KEY
npm install
npm run dev                  # http://localhost:3000
npm test                     # the streak, session and data rules
```

`.env.example` sets `DATA_STORE=memory`, so it runs without a database (nothing survives a restart).
Remove that line to use Firestore. In Cloud Shell, run `gcloud auth application-default login` once
so Vertex mode and Firestore can sign in as you.

## Settings

| Variable | What it does |
|---|---|
| `GOOGLE_GENAI_USE_VERTEXAI` | `true` to use Vertex AI and the project's billing (and credit) |
| `GOOGLE_CLOUD_PROJECT` | Project ID that pays (Vertex mode) and holds the database |
| `GCS_BUCKET` | Bucket for post pictures (and video clips, if on) |
| `GOOGLE_CLOUD_LOCATION` | Vertex location for text and images. Default `global` |
| `GOOGLE_CLOUD_VIDEO_LOCATION` | Vertex location for Veo. Default `us-central1` |
| `GEMINI_API_KEY` | Use a Gemini API key instead of Vertex |
| `DATA_STORE` | `memory` keeps everything in memory instead of Firestore (local runs and tests) |
| `SESSION_SECRET` | Signs visitors' anonymous IDs. Must stay the same, or everyone starts fresh |
| `APP_PASSCODE` | Locks the app behind a passcode |
| `RATE_LIMIT_PER_10MIN` | AI requests per visitor per 10 minutes. Default 40 |
| `GENERAL_RATE_LIMIT_PER_10MIN` | All requests per visitor per 10 minutes. Default 400 |
| `IMAGE_DAILY_LIMIT` | AI images per visitor per day. Default 20 |
| `CAPTION_DAILY_LIMIT` | Caption sets per visitor per day. Default 60 |
| `GLOBAL_IMAGE_DAILY_LIMIT` | AI images per day for everyone. Default 500 |
| `VIDEO_ENABLED` | `true` turns video on. Off by default |
| `VIDEO_DAILY_LIMIT` | Video clips per day when on. Default 5 |
| `JEV_API_KEY` | TypeSafe key for JEV, the judge. Without it, replies still work but aren't labeled or checked by JEV |
| `ADMIN_CODE` | Curator code for the library page (`/#curate`). Without it, curating is off |
| `INVITE_ONLY` | `true` turns on the invite-only beta (Google sign-in + invite code) instead of the passcode |
| `GOOGLE_CLIENT_ID` | The OAuth Web client ID for "Sign in with Google" (public) |
| `ADMIN_EMAILS` | Comma-separated Google emails that are always members (you) |
| `REFLECT_DAILY_LIMIT` | Reflections per visitor per day. Default 10 |
| `JEV_MODEL`, `JEV_BASE_URL` | Override JEV's model (default `jev-latest`) or address |
| `MODEL_TEXT`, `MODEL_TEXT_FALLBACK`, `MODEL_IMAGE`, `MODEL_EMBED`, `MODEL_VIDEO` | Override model names (`MODEL_EMBED` default `gemini-embedding-001`) |
| `PORT` | Port to listen on. Default 3000, or 8080 in the container |
