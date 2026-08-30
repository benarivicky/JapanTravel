# מדריך פריסה — JapanTravel

**עודכן:** 23.07.2026 · **גרסה:** v0.1.0 · **ענף חי:** `prod`

---

## תקציר מנהלים

- לאפליקציה יש **שני backends נפרדים** ב‑Firebase App Hosting, באותו פרויקט GCP.
- פריסה מקומית מוגבלת **בכוונה** ל‑backend הדמו בלבד — הפרודקשן לא נמצא ב‑`firebase.json` ולכן לא ניתן לפגוע בו בטעות.
- הפריסה נעשית בפקודה אחת: `firebase deploy --only apphosting`.
- עלות בפועל: **~0–5 $ לחודש** בתעבורה נמוכה. דורש תוכנית Blaze (כרטיס אשראי) — **זו לא שכבת חינם אמיתית**.

---

## 1. מפת הסביבות

| סביבה | Backend ID | כתובת | מקור הפריסה |
|---|---|---|---|
| **דמו** | `japantravel-demo` | https://japantravel-demo--japantravelplanners-d2992.asia-east1.hosted.app | קוד מקומי (`firebase deploy`) |
| **פרודקשן** | `japantravelbe` | https://japantravelbe--japantravelplanners-d2992.asia-east1.hosted.app | ריפו GitHub (rollout ידני בקונסולה) |

- **פרויקט GCP:** `japantravelplanners-d2992` (מספר: 74401408081)
- **אזור:** `asia-east1` בשתי הסביבות
- **ABIU (בנייה אוטומטית בכל push):** מושבת בשתיהן — **push לבדו לא פורס כלום**

> ⚠️ `firebase.json` מצביע על `japantravel-demo` בלבד. זו הגנה מכוונת. כדי לפרוס לפרודקשן צריך לשנות את `backendId` ידנית — אל תעשו זאת בלי כוונה מפורשת.

---

## 2. דרישות קדם (חד־פעמי)

| דרישה | בדיקה |
|---|---|
| Node 20+ | `node --version` (מותקן: v24.18.0) |
| Firebase CLI | `firebase --version` (מותקן: 15.22.0) |
| התחברות | `firebase login:list` → amitkuzi@gmail.com |
| תוכנית Blaze | נדרשת ל‑App Hosting. Spark (חינם) **לא תומכת** |
| `.env.local` | חייב להתקיים בשורש הפרויקט — סקריפט הבדיקה נכשל בלעדיו |

**gcloud CLI אינו מותקן** ואינו נדרש לתהליך הזה. כל הפעולות מתבצעות דרך Firebase CLI.

---

## 3. תהליך הפריסה — שלב אחר שלב

### שלב 1 — בדיקה מקומית (חובה)

```bash
bash scripts/ci-dryrun.sh
```

מריץ: `npm ci` → typecheck → lint → בדיקות יחידה → build ייצור.

> **מלכודת חשובה:** אל תריצו `bash scripts/ci-dryrun.sh | tail -30`.
> ה‑pipe מחליף את קוד היציאה בזה של `tail`, וכישלון ייראה כהצלחה (`exit 0`).
> להרצה עם קוד יציאה אמיתי:
> ```bash
> bash scripts/ci-dryrun.sh > /tmp/dryrun.log 2>&1; echo "EXIT=$?"
> ```

### שלב 2 — commit ו‑push

```bash
git checkout prod
git add -A
git commit -m "task: <תיאור> (v0.1.0)"
git push origin prod
```

ה‑push בטוח: `.github/workflows/deploy.yml` מופעל רק על `master`/`gcpV3`, לא על `prod`.

### שלב 3 — פריסה

```bash
firebase deploy --only apphosting --project japantravelplanners-d2992
```

ודאו בפלט את השורה:
```
i apphosting: Found backend(s) japantravel-demo
```
אם מופיע שם backend אחר — **עצרו מיד**.

### שלב 4 — בדיקות עשן

```bash
DEMO="https://japantravel-demo--japantravelplanners-d2992.asia-east1.hosted.app"
for P in "/" "/trip" "/admin"; do
  printf "%-12s " "$P"
  curl -s -o /dev/null -w "HTTP %{http_code}\n" --max-time 30 "$DEMO$P"
done
```

**תוצאות תקינות:** `/`, `/trip`, `/admin` → 200 · נתיב לא קיים → 404 · `/api/image-proxy` בלי פרמטר → 400.

---

## 4. משתני סביבה

מוגדרים ב‑`apphosting.yaml` כ‑**ערכים גלויים** (`value:`) ולא כסודות:

| משתנה | הערה |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (6 משתנים) | ציבוריים מעצם טבעם — נארזים ב‑bundle של הדפדפן |

**למה לא Secret Manager?** מפתחות `NEXT_PUBLIC_*` נשלחים ממילא לכל דפדפן. הסתרתם ב‑Secret Manager אינה מוסיפה אבטחה, רק עלות (~0.06 $ לסוד־גרסה מעבר ל‑6 החינמיים). ההגנה האמיתית היא **חוקי Firestore/Storage**.

**`GOOGLE_MAPS_API_KEY` אינו מוגדר בפריסה.** תצוגות מקדימות של קישורי Maps נופלות חזרה ל‑favicon + שם דומיין — התנהגות מתועדת ב‑`.env.example`. להפעלת תצוגות תמונה יש להוסיף את המשתנה ל‑`apphosting.yaml`.

**`GOOGLE_AI_API_KEY` הוסר לחלוטין** (23.07.2026) — פיצ'ר ה‑AI/Genkit הוסר מהאפליקציה והמפתח לא היה בשימוש בשום מקום בקוד.

---

## 5. נסיגה (Rollback)

App Hosting שומר את כל ה‑rollouts הקודמים.

1. קונסולת Firebase → App Hosting → `japantravel-demo` → **Rollouts**
2. בוחרים rollout קודם תקין → **Rollback**

לחלופין, נסיגה בקוד: `git revert <commit>` ואז פריסה מחדש.

**במקרה חירום:** ניתן להקפיא את ה‑backend או לנתק דומיין מותאם מהקונסולה.

---

## 6. עלויות

| רכיב | עלות |
|---|---|
| Cloud Run (מאחורי App Hosting) | בתוך שכבת החינם ברוב החודשים; `minInstances: 0` |
| Cloud Build | ~0.003 $ לדקת build מעבר למכסת החינם |
| אחסון images | ~0.10 $ ל‑GB לחודש |
| תעבורה יוצאת | 10GB חינם, אחר כך ~0.15 $ ל‑GB |
| **סה"כ צפוי** | **~0–5 $ לחודש** |

> ⚠️ הגדרת `minInstances: 1` (ביטול cold start) מקפיצה ל‑**~15–25 $ לחודש**.

**מומלץ בחום:** להגדיר **Budget Alert** של 5–10 $ בקונסולת GCP (חינם). בעקבות אירוע ה‑cryptominer מ‑07.07.2026, חשבון חיוב ללא תקרה הוא בדיוק וקטור הסיכון — התראה תזהה שימוש חריג מוקדם.

---

## 7. פתרון תקלות

| תסמין | סיבה | פתרון |
|---|---|---|
| `npm ci` נכשל: `Missing: ... from lock file` | סחיפת תלויות אופציונליות — ה‑lock נוצר בגרסת npm ישנה יותר | `npm install` ואז commit ל‑`package-lock.json` |
| Build נכשל: `Secret ... not found` (404) | `apphosting.yaml` מפנה לסוד שלא קיים ב‑Secret Manager | להעביר ל‑`value:` אם הערך ציבורי, או ליצור את הסוד |
| הדמו לא מתעדכן אחרי push | ABIU מושבת — push לא פורס | להריץ `firebase deploy --only apphosting` ידנית |
| `ci-dryrun.sh` מחזיר 0 אך יש שגיאות | קוד היציאה נבלע ב‑pipe | ראו האזהרה בשלב 1 |
| `Found backend(s)` מציג backend לא נכון | `backendId` ב‑`firebase.json` | לתקן את `firebase.json` |

---

## 8. מצב אבטחה — נכון ל‑23.07.2026

בעקבות אירוע ה‑cryptominer מ‑07.07.2026 (פירוט מלא: `docs/SECURITY-INCIDENT-2026-07-07.md`):

| פריט | סטטוס |
|---|---|
| Next.js משודרג ל‑15.5.20 | ✅ הושלם |
| הגנת SSRF ב‑link-preview | ✅ קיימת בקוד |
| `GOOGLE_AI_API_KEY` | ✅ הוסר לחלוטין מהקוד ומהקונפיגורציה |
| **רוטציית `GOOGLE_MAPS_API_KEY`** | 🔴 **טרם בוצע** — המפתח דלף באירוע |
| **מפתחות בהיסטוריית git** | 🔴 `GUIDE.md` הכיל מפתחות בטקסט גלוי; מחיקת השורה אינה מוחקת מההיסטוריה |
| **Budget Alert ב‑GCP** | 🔴 טרם הוגדר |
| **npm audit** | 🔴 16 פגיעויות (2 קריטיות, 10 גבוהות) — ניתנות לתיקון ללא שינויים שוברים |
| בדיקת חוקי Firestore/Storage | 🔴 טרם בוצע |

### פעולות מומלצות לבעלים

1. **להגביל את `GOOGLE_MAPS_API_KEY`** בקונסולת GCP ל‑Places API (New) בלבד + תקרת מכסה יומית. המפתח משמש בצד השרת, ולכן הגבלת referrer אינה רלוונטית — הגבלת API ומכסה כן מצמצמות את הנזק האפשרי.
2. **לבטל את המפתחות שהופיעו ב‑`GUIDE.md`** — הם קיימים בהיסטוריית git הציבורית.
3. **להגדיר Budget Alert** (5–10 $).
4. **להריץ `npm audit fix`** (ללא `--force`) ואז `ci-dryrun.sh` לאימות.

---

## 9. פקודות שימושיות

```bash
# רשימת כל ה‑backends וכתובותיהם
firebase apphosting:backends:list --project japantravelplanners-d2992

# בדיקת התחברות
firebase login:list

# יצירת backend חדש (למשל סביבת staging נוספת)
firebase apphosting:backends:create --project japantravelplanners-d2992 \
  --backend <שם> --primary-region asia-east1 --non-interactive

# מחיקת backend
firebase apphosting:backends:delete <שם> --project japantravelplanners-d2992
```

---

## נספח — מה נעשה בפריסה זו (23.07.2026)

1. הוסרו כל ההפניות ל‑`GOOGLE_AI_API_KEY` מ‑7 קבצים.
2. נמחקה תיקיית `.idx/` (Project IDX / Firebase Studio — נסגר ב‑22.03.2027).
3. סונכרן `package-lock.json` (`npm ci` היה שבור).
4. תוקן `apphosting.yaml` — הפנה ל‑6 סודות שאינם קיימים; הועבר לערכים גלויים.
5. תוקן `firebase.json` — הצביע על backend בשם `japantravel` שאינו קיים.
6. נוצר backend חדש `japantravel-demo` ובוצעה פריסה ראשונה.
7. בדיקות עשן עברו; הפרודקשן נותר ללא שינוי (תאריך עדכון 09.09.2025).
