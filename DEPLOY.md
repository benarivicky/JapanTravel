# Deployment Guide — JapanTravel

This app deploys to **Firebase App Hosting** (GCP Cloud Run under the hood) on every push to `master` or `gcpV3`.

Two CI/CD tracks are configured — both point at the same Firebase project (`japantravelplanners-d2992`).

---

## Track A — GitHub Actions (primary, recommended)

File: `.github/workflows/deploy.yml`

### Pipeline steps
1. Typecheck (`npm run typecheck`)
2. Lint (`npm run lint`)
3. Unit tests (`npm run test -- --ci`)
4. Production build (`npm run build`)
5. Deploy via `FirebaseExtended/action-hosting-deploy`

### One-time setup

#### 1. Add GitHub Secrets
Go to **GitHub → Settings → Secrets and variables → Actions → New repository secret** for each:

| Secret name | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `japantravelplanners-d2992.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `japantravelplanners-d2992` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `japantravelplanners-d2992.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `74401408081` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:74401408081:web:b800d86167f5962ac3c470` |
| `GOOGLE_MAPS_API_KEY` | Places API (New) key for Maps-link photo previews — optional; omit to disable |
| `FIREBASE_SERVICE_ACCOUNT` | JSON of a GCP service account (see step 2) |

#### 2. Create a Firebase service account
```bash
# Install Firebase CLI if needed
npm install -g firebase-tools
firebase login

# Create a service account key for GitHub Actions
gcloud iam service-accounts create github-actions-deploy \
  --project japantravelplanners-d2992 \
  --display-name "GitHub Actions Deploy"

gcloud projects add-iam-policy-binding japantravelplanners-d2992 \
  --member "serviceAccount:github-actions-deploy@japantravelplanners-d2992.iam.gserviceaccount.com" \
  --role "roles/firebaseapphosting.admin"

gcloud iam service-accounts keys create /tmp/sa-key.json \
  --iam-account "github-actions-deploy@japantravelplanners-d2992.iam.gserviceaccount.com"
```
Copy the contents of `/tmp/sa-key.json` into the `FIREBASE_SERVICE_ACCOUNT` secret.

#### 3. Deploy
Push to `master` or `gcpV3` — the Actions tab will show the pipeline run.

---

## Track B — GCP Cloud Build (alternative / audit trail)

File: `cloudbuild.yaml`

### One-time setup

#### 1. Enable APIs
```bash
gcloud services enable cloudbuild.googleapis.com secretmanager.googleapis.com \
  --project japantravelplanners-d2992
```

#### 2. Store secrets in Secret Manager
```bash
for SECRET in \
  NEXT_PUBLIC_FIREBASE_API_KEY \
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
  NEXT_PUBLIC_FIREBASE_PROJECT_ID \
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
  NEXT_PUBLIC_FIREBASE_APP_ID \
  GOOGLE_MAPS_API_KEY; do
    echo -n "VALUE" | gcloud secrets create "$SECRET" \
      --data-file=- \
      --project japantravelplanners-d2992
done
```
Replace `VALUE` with the actual value for each secret.

#### 3. Grant Cloud Build access to secrets
```bash
PROJECT_NUMBER=$(gcloud projects describe japantravelplanners-d2992 --format='value(projectNumber)')
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding japantravelplanners-d2992 \
  --member "serviceAccount:${CB_SA}" \
  --role "roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding japantravelplanners-d2992 \
  --member "serviceAccount:${CB_SA}" \
  --role "roles/firebaseapphosting.admin"
```

#### 4. Create a Cloud Build trigger
```bash
gcloud builds triggers create github \
  --project japantravelplanners-d2992 \
  --repo-name JapanTravel \
  --repo-owner benarivicky \
  --branch-pattern "^(master|gcpV3)$" \
  --build-config cloudbuild.yaml \
  --substitutions \
    _FIREBASE_API_KEY='$(NEXT_PUBLIC_FIREBASE_API_KEY)',\
    _FIREBASE_AUTH_DOMAIN='$(NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)',\
    _FIREBASE_PROJECT_ID='$(NEXT_PUBLIC_FIREBASE_PROJECT_ID)',\
    _FIREBASE_STORAGE_BUCKET='$(NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)',\
    _FIREBASE_MESSAGING_SENDER_ID='$(NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)',\
    _FIREBASE_APP_ID='$(NEXT_PUBLIC_FIREBASE_APP_ID)'
```

---

## Track C — Firebase App Hosting native GitHub integration (zero-config)

The `apphosting.yaml` in the repo root is all Firebase App Hosting needs.

1. Go to [Firebase Console → App Hosting](https://console.firebase.google.com/project/japantravelplanners-d2992/apphosting)
2. Click **Add backend**
3. Connect the GitHub repo (`benarivicky/JapanTravel`)
4. Set the live branch to `master`
5. Add the environment variables listed in `.env.example` under **Secrets**
6. Firebase handles build + deploy automatically on every push — no extra config files needed

---

## Local dry-run

Simulates the full pipeline locally before pushing:

```bash
bash scripts/ci-dryrun.sh
```

Requires `.env.local` to be present (copy from `.env.example` and fill in values).
