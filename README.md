# Rosa Maria

An honest Catholic prayer app, made for Filipino families in the US and at home: a calm, guided Rosary and
gentle prayer cards you can send by Messenger, Viber, WhatsApp or text. Free to pray, always. It is named
after Nanay Rosa Maria.

Before working on it, read `CLAUDE.md` (the rules that never bend) and `docs/HANDOFF.md` (the plan and the
progress checklist). The Rosary content is in `docs/rosary-basics.md`.

**How it's built:**
- A small server (`server.ts`) makes every database and checker call, so **no key ever reaches the browser**.
- Data lives in **Firestore**, which only the server can reach.
- Visitors get an **anonymous ID** signed by the server. Nobody needs an account to pray.
- Official prayers are **never written or changed by AI**: they are copied from approved Church sources, checked
  by a person and locked. **JEV** (TypeSafe) only flags possible problems; a person decides.
- The reviewer's desk opens at `/#curate` with a reviewer code.
- It's hosted on **Cloud Run**, in its own Google Cloud project (never Inspire's).

You don't need anything installed on your computer. Everything below runs in your browser with
**Google Cloud Shell** (https://shell.cloud.google.com), signed in with the account that owns Rosa Maria's
Google Cloud project.

---

## Step 1: one-time Google Cloud setup

Create a **new** project for Rosa Maria first (Cloud Console → project picker → New project). Then replace
`YOUR_PROJECT_ID` with its ID, and paste this block:

```bash
PROJECT=YOUR_PROJECT_ID
REGION=us-west1   # closest to most Filipino Americans; asia-southeast1 is closer to the Philippines
gcloud config set project $PROJECT
gcloud services enable firestore.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

# The database (once per project; if it says a database already exists, that's fine)
gcloud firestore databases create --location=$REGION
```

Let the app's Cloud Run identity build the app and use the database:

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
SA="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding $PROJECT --member="$SA" --role="roles/datastore.user" --condition=None
gcloud projects add-iam-policy-binding $PROJECT --member="$SA" --role="roles/run.builder" --condition=None
```

**A session secret.** This signs visitors' anonymous IDs. It's made for you; you never see it:

```bash
openssl rand -hex 32 | tr -d '\n' | gcloud secrets create rosa-session-secret --data-file=-
gcloud secrets add-iam-policy-binding rosa-session-secret --member="$SA" --role="roles/secretmanager.secretAccessor"
```

**Pick a passcode.** While it's being built, the app stays locked. The first line asks for it without showing
it. Type it, then press Enter:

```bash
read -s -p "App passcode: " CODE && printf "%s" "$CODE" | gcloud secrets create rosa-passcode --data-file=- && unset CODE
gcloud secrets add-iam-policy-binding rosa-passcode --member="$SA" --role="roles/secretmanager.secretAccessor"
```

> If the hidden prompt keeps catching an empty Enter, create the secret on the web instead:
> **Security → Secret Manager → Create secret**, name `rosa-passcode`, and type the passcode in the box.

**Your JEV key and a reviewer code.** The JEV key comes from your TypeSafe account. The reviewer code is a
second password, only for you, that opens the review desk. Type or paste each one at the hidden prompt:

```bash
read -s -p "TypeSafe JEV key: " K && printf "%s" "$K" | gcloud secrets create rosa-jev-key --data-file=- && unset K
read -s -p "Reviewer code: " K && printf "%s" "$K" | gcloud secrets create rosa-curator-code --data-file=- && unset K
gcloud secrets add-iam-policy-binding rosa-jev-key --member="$SA" --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding rosa-curator-code --member="$SA" --role="roles/secretmanager.secretAccessor"
```

## Step 2: get the code

```bash
cd ~ && git clone https://github.com/pinoycoach/rosa-maria.git
cd rosa-maria
```

## Step 3: put it online

```bash
gcloud run deploy rosa-maria \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --max-instances 2 \
  --set-secrets APP_PASSCODE=rosa-passcode:latest,SESSION_SECRET=rosa-session-secret:latest,JEV_API_KEY=rosa-jev-key:latest,ADMIN_CODE=rosa-curator-code:latest \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT
```

Say **Y** if it asks to create a repository. It takes a few minutes and ends with a web address like
`https://rosa-maria-xxxxx.us-west1.run.app`. Open it and enter your passcode.

**Publishing changes later:** `cd ~/rosa-maria && git pull`, then run the same deploy command. If you closed
Cloud Shell since Step 1, set `PROJECT=…` and `REGION=…` again first.

## Step 4 (optional): the invite-only beta

With this on, the shared passcode is replaced by **Sign in with Google + an invite code**. Every member gets 3
invites to share. Your own Google email is always let in.

1. **Google sign-in ID** (about 5 minutes, in the Cloud Console):
   - **APIs & Services → OAuth consent screen**: choose *External*, app name `Rosa Maria`, your email as support
     and developer contact. Save.
   - **APIs & Services → Credentials → Create credentials → OAuth client ID**: type *Web application*. Under
     **Authorized JavaScript origins** add your app's address. Copy the **Client ID** (it ends in
     `.apps.googleusercontent.com`; it's public, not a secret).
2. Deploy with three more settings (put your real values in):

```bash
gcloud run deploy rosa-maria --source . --region $REGION --allow-unauthenticated --memory 512Mi --max-instances 2 \
  --set-secrets APP_PASSCODE=rosa-passcode:latest,SESSION_SECRET=rosa-session-secret:latest,JEV_API_KEY=rosa-jev-key:latest,ADMIN_CODE=rosa-curator-code:latest \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT,INVITE_ONLY=true,GOOGLE_CLIENT_ID=YOUR_CLIENT_ID,ADMIN_EMAILS=you@gmail.com
```

3. Open the app and **Sign in with Google** with your own email. Make codes for others in `/#curate` → **Beta**,
   where you also see members and the waitlist.

To switch the beta off later, deploy with `INVITE_ONLY=false` (the passcode applies again).

---

## Costs and protection

- **Firestore** has a free daily allowance that a small app stays inside. `--max-instances 2` keeps the bill
  predictable. Keep a budget alert on the billing account (Billing → Budgets & alerts).
- **Passcode** (`APP_PASSCODE`): every request needs it. To change it, add a new version of the secret in Secret
  Manager and redeploy. Before opening to the public, remove `APP_PASSCODE=rosa-passcode:latest,` from
  `--set-secrets` and redeploy.
- **Rate limit:** 400 requests per visitor per 10 minutes (`GENERAL_RATE_LIMIT_PER_10MIN`).
- **Security headers** (content security policy, no framing, no sniffing) are on in production.
- Visitors can delete everything kept about them from **Privacy & Terms** (footer link).

## Running it on your own computer (optional)

```bash
cp .env.example .env.local
npm install
npm run dev      # http://localhost:3000
npm test         # the rules: sessions, invites, the review desk
npx tsc --noEmit # type check
npm run build
```

`.env.example` sets `DATA_STORE=memory`, so it runs without a database (nothing survives a restart).

## Settings

| Variable | What it does |
|---|---|
| `GOOGLE_CLOUD_PROJECT` | Rosa Maria's own project ID, which holds the database |
| `DATA_STORE` | `memory` keeps everything in memory instead of Firestore (local runs and tests) |
| `SESSION_SECRET` | Signs visitors' anonymous IDs. Must stay the same, or everyone starts fresh |
| `APP_PASSCODE` | Locks the app behind a passcode |
| `GENERAL_RATE_LIMIT_PER_10MIN` | Requests per visitor per 10 minutes. Default 400 |
| `JEV_API_KEY` | TypeSafe key for JEV, the checker. Without it, nothing is flagged |
| `JEV_MODEL`, `JEV_BASE_URL` | Override JEV's model (default `jev-latest`) or address |
| `ADMIN_CODE` | Reviewer code for the review desk (`/#curate`). Without it, the desk is off |
| `INVITE_ONLY` | `true` turns on the invite-only beta (Google sign-in + invite code) instead of the passcode |
| `GOOGLE_CLIENT_ID` | The OAuth Web client ID for "Sign in with Google" (public) |
| `ADMIN_EMAILS` | Comma-separated Google emails that are always members |
| `AUTH_TEST_SECRET` | Local tests only. **Never set this on the live server** |
| `WIKIQUOTE_BASE_URL` | Where credited sayings are looked up on the desk; `off` turns it off |
| `PORT` | Port to listen on. Default 3000, or 8080 in the container |
