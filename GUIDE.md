# JapanTravel — Operations Guide

**Project:** Vicky's Japan trip planner  
**Stack:** Next.js 15 · Firebase Auth + Firestore · GCP Cloud Run (via Firebase App Hosting)  
**Repo:** `github.com/benarivicky/JapanTravel` · branch `gcpV3`  
**Firebase project:** `japantravelplanners-d2992`

---

## Part 1 — Deploy to GCP (Free Tier)

### Cost reality
Firebase App Hosting runs on Cloud Run. The **Blaze (pay-as-you-go)** plan is required, but Cloud Run's free tier covers a personal travel app at zero cost:

| Resource | Free quota | This app's typical usage |
|---|---|---|
| Cloud Run requests | 2 M / month | < 5,000 / month |
| Cloud Run compute | 360,000 GB-s / month | < 1,000 GB-s / month |
| Firestore reads | 50,000 / day | < 500 / day |
| Firestore writes | 20,000 / day | < 50 / day |
| Bandwidth | 1 GB / month | < 100 MB / month |

**Expected monthly bill: $0.** A credit card must be on file to activate Blaze, but no charges occur within these quotas.

---

### Fastest deployment path — Firebase Console (no CLI required)

**Prerequisites**
- Google account with access to project `japantravelplanners-d2992`
- GitHub account `benarivicky` with repo `JapanTravel`
- The secret values below (already in your `.env.local`)

**Steps**

1. Open [Firebase Console → App Hosting](https://console.firebase.google.com/project/japantravelplanners-d2992/apphosting)

2. Click **Get started** → **Add backend**

3. Connect GitHub → select repo `benarivicky/JapanTravel` → set live branch to `master`

4. Under **Environment variables / Secrets**, add each of these:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyCT81UBSC9sz3F8awSN14xyLWGs_VreOrc` |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `japantravelplanners-d2992.firebaseapp.com` |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `japantravelplanners-d2992` |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `japantravelplanners-d2992.firebasestorage.app` |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `74401408081` |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:74401408081:web:b800d86167f5962ac3c470` |
   | `GOOGLE_AI_API_KEY` | `AIzaSyC-9xdKvXH29GN4k9fMnh_jlu4CDUIRtCc` |

5. Click **Deploy** — Firebase builds and publishes the app automatically.

6. Every subsequent `git push` to `master` triggers a new deploy automatically. No further action needed.

**Live URL** after first deploy: shown in the Firebase Console under App Hosting → your backend → **Domains**.

---

### Manual deploy from terminal (alternative)

```bash
npm install -g firebase-tools   # once only
firebase login
firebase use japantravelplanners-d2992
npm run build
firebase deploy --only apphosting
```

Requires `.env.local` to be present locally.

---

### GitHub Actions auto-deploy (CI/CD — already configured)

The file `.github/workflows/deploy.yml` runs typecheck → lint → tests → build → deploy on every push to `master` or `gcpV3`.

**One-time secret setup in GitHub:**  
Go to `github.com/benarivicky/JapanTravel` → **Settings → Secrets and variables → Actions** → add the same 7 env vars from the table above, plus:

| Secret | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | JSON content of a GCP service account key with `roles/firebaseapphosting.admin` |

See `DEPLOY.md` → Track A for the `gcloud` commands to create the service account.

---

## Part 2 — Edit the App with AI (Firebase Studio)

Firebase Studio is a browser-based VS Code connected to Gemini. No local install. Opens the GitHub repo directly.

### Open the project

1. Go to **[studio.firebase.google.com](https://studio.firebase.google.com)**
2. Sign in with the Google account that has access to `japantravelplanners-d2992`
3. Click **Import repo** → paste: `https://github.com/benarivicky/JapanTravel`
4. Select branch **`gcpV3`**
5. Click **Open in Studio** — the IDE opens in the browser (takes ~60 seconds to provision)

### Make AI-assisted edits

- Click the **Gemini** icon in the left sidebar (sparkle / stars icon)
- Type your request in plain English or Hebrew, for example:
  - `"Change the app title from 'טיול ליפן' to 'הטיול של ויקי'"`
  - `"Make the day card headers use a green gradient instead of navy"`
  - `"Add a phone number field to the user profile page"`
- Gemini proposes a code diff — review it, then click **Accept**
- Use the built-in **Preview** button (▶) to see the change in a live browser window

### Save and publish

```
Ctrl+Shift+G  →  Git panel
```
1. Stage changed files → write a commit message → **Commit**
2. Click **Sync** (push icon) → pushes to GitHub
3. GitHub Actions automatically builds and deploys to Firebase App Hosting (if set up above)
   **— or —**  
   In the Studio terminal: `firebase deploy --only apphosting`

### Project context for AI (what Gemini knows about this project)

If Gemini gives generic suggestions, paste this context at the start of your prompt:

```
Project: Next.js 15 App Router, Hebrew RTL (dir="rtl"), Tailwind CSS,
shadcn/ui components, Firebase Auth + Firestore (project: japantravelplanners-d2992),
Fredoka font, warm cream + deep navy color scheme.
Main pages: /trip (day cards grid), /trip/[date]/[segment] (detail).
Target users: seniors 65+, large touch targets, high contrast.
```

---

## Quick reference

| Task | How |
|---|---|
| Run locally | `npm run dev` → [localhost:3000](http://localhost:3000) |
| Run tests | `npm test` |
| Type check | `npm run typecheck` |
| Deploy manually | `firebase deploy --only apphosting` |
| View live app | Firebase Console → App Hosting → Domains |
| View database | [Firebase Console → Firestore](https://console.firebase.google.com/project/japantravelplanners-d2992/firestore) |
| View auth users | [Firebase Console → Authentication](https://console.firebase.google.com/project/japantravelplanners-d2992/authentication) |
| Edit with AI | [studio.firebase.google.com](https://studio.firebase.google.com) |
