# מערכת הניהול של מבט

ממשק עריכה בעברית לאתר, בכתובת נפרדת מהאתר, עם כניסה בסיסמה. העורכת משנה קורסים, מפגש ייעוץ, צוות ופרטי קשר,
שומרת **כטיוטה**, בודקת **תצוגה מקדימה** אמיתית של האתר, ורק אז **מפרסמת**.

```
דפדפן (React)  →  Worker (/api/*)  →  GitHub:  ענף draft  →  תצוגת בדיקה
                                               ענף main   →  האתר החי   (פרסום = מיזוג draft ל־main)
```

* **אחסון:** התוכן נשאר ב־`website/content/site.json` בריפו. אין מסד נתונים. היסטוריה, גיבוי ושחזור = Git.
* **אותה סכמה כמו האתר:** הטיפוסים נלקחים מ־`website/src/lib/types.ts`, והבדיקות (`shared/validate.ts`) זהות לבדיקות הבנייה של האתר.
* **עלות:** אפס. Cloudflare Workers (תוכנית חינמית) + GitHub חינמי + כתובת `workers.dev`.

## הקמה חד־פעמית

### 1. אסימון GitHub (נוצר מחשבון `Margalit111`)
GitHub ← Settings ← Developer settings ← Personal access tokens ← **Fine-grained tokens** ← Generate new token:
* Repository access: **Only select repositories** ← `hamabat`
* Repository permissions: **Contents: Read and write** (ו־Metadata: Read-only, מתווסף לבד)
* Expiration: עד שנה. כדאי לקבוע תזכורת לחדש אותו.

העתיקי את האסימון (מופיע פעם אחת).

### 2. פרויקט ב־Cloudflare
Workers & Pages ← Create ← Import a repository ← `hamabat`:

| הגדרה | ערך |
|---|---|
| Project name | `hamabat-admin` (חייב להתאים ל־`name` ב־`admin/wrangler.jsonc`) |
| Build command | `cd admin && npm ci && npm run build` |
| Deploy command | `npx wrangler deploy --config admin/wrangler.jsonc` |

אחרי היצירה: **Settings ← Variables and secrets** והוספה של שלושה **Secrets** (סוג Secret, לא Text):

| שם | ערך |
|---|---|
| `ADMIN_PASSWORD` | הסיסמה לממשק (ארוכה: מומלץ 3–4 מילים) |
| `GITHUB_TOKEN` | האסימון מצעד 1 |
| `SESSION_SECRET` | מחרוזת אקראית ארוכה (למשל 40 תווים) |

### 3. שני פרויקטים, שני מסלולי בנייה (חשוב)
Settings ← Build ← **Build watch paths**:
* בפרויקט `hamabat-admin`: Include paths = `admin/*`
* בפרויקט האתר `hamabat`: Exclude paths = `admin/*`

כך שינוי בקוד הניהול לא בונה את האתר, ושמירת טיוטה (שמשנה רק את `website/`) לא בונה את הניהול.

### 4. תצוגה מקדימה
האתר נבנה אוטומטית גם מהענף `draft` (Cloudflare בונה ענפים שאינם הראשי; בדקי ב־Settings ← Build שהאפשרות
"Builds for non-production branches" פעילה). אחרי השמירה הראשונה בממשק, ב־Deployments של פרויקט האתר תופיע גרסת Preview לענף `draft`.
את הכתובת שלה יש להזין ב־`PREVIEW_URL` ב־`admin/wrangler.jsonc` (ברירת המחדל שם היא ניחוש לפי התבנית של Cloudflare, `draft-hamabat.<subdomain>.workers.dev`), ולעשות commit.
גרסאות Preview מסומנות אוטומטית כ־`noindex` ו־`Disallow: /` ולכן לא יופיעו בגוגל.

## שימוש
1. נכנסים בכתובת הניהול ומזינים סיסמה.
2. עורכים בלשוניות (העריכות נשמרות בזיכרון תוך כדי מעבר בין לשוניות).
3. **שמירה כטיוטה** (כפתור בתחתית המסך). האתר החי לא משתנה.
4. **תצוגה מקדימה** (לשונית "בית"), ואחרי כמה דקות רואים את השינוי.
5. **פרסום באתר.** האתר החי מתעדכן תוך דקה או שתיים. "ביטול השינויים" זורק את הטיוטה.
6. לשונית "גרסאות": שחזור של גרסה קודמת (נכנסת כטיוטה, ורק פרסום מעלה אותה).

אם בוצע שינוי ישירות ב־GitHub על `main` בזמן שיש טיוטה פתוחה והוא מתנגש, הפרסום יציג הודעה, ואפשר לבטל את הטיוטה ולבצע את השינוי מחדש.

## אבטחה
* כניסה בסיסמה בלבד, מושוואת בזמן קבוע; אחרי 5 ניסיונות כושלים נחסמת הכתובת ל־15 דקות; השהיה קצרה אחרי כל כשלון.
* ה־cookie של הכניסה הוא `HttpOnly` + `Secure` + `SameSite=Strict` ופג אחרי 12 שעות; כל בקשת כתיבה דורשת גם כותרת מותאמת (נגד CSRF).
* האסימון והסיסמה נשמרים רק כסודות של Cloudflare, לא בקוד ולא בדפדפן; לאסימון גישה לריפו אחד ולתוכן בלבד.
* כל קלט נבדק בשרת מול הסכמה; העלאות תמונה מוגבלות ל־JPG/PNG עד 4MB ונבדקות לפי תוכן הקובץ, ולא רק לפי השם.
* כותרות CSP, `X-Frame-Options: DENY` ו־`noindex` על כל הממשק.
* כל שמירה היא commit על שם "מערכת הניהול של מבט", כך שיש יומן פעולות מלא ב־GitHub.

## פיתוח ובדיקות
```bash
cd admin
npm install
npm run typecheck            # בדיקת טיפוסים (ממשק + שרת)
npm run build                # בנייה (dist/)
node test/api.mjs            # בדיקות API מול Worker מקומי ו־GitHub מדומה (27 בדיקות)
NODE_PATH=$(npm root -g) node test/e2e.mjs    # בדיקות ממשק בדפדפן (דורש Playwright)
```
לריצה ידנית מקומית: קובץ `.dev.vars` עם `ADMIN_PASSWORD`, `GITHUB_TOKEN` ו־`GITHUB_REPO`, ואז `npm run build && npm run dev:worker`.
