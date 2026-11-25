# מבט – אתר המרכז לבריאות גוף נפש לאם ולתינוק

אתר Next.js (TypeScript) שנבנה כ־HTML סטטי מלא: לכל עמוד כתובת משלו, כותרות, תיאורים ונתוני SEO.
התוכן שמשתנה (קורסים, מפגש ייעוץ, צוות, פרטי קשר) יושב בקובץ נתונים אחד: `website/content/site.json`.

```
hamabat/
├── website/        האתר הציבורי (Next.js, ייצוא סטטי)                ← מוכן ומפורסם
├── wrangler.jsonc  הגדרת הפריסה ל-Cloudflare (מגיש את website/out)
├── .github/        בנייה לילית אוטומטית (GitHub Actions)
├── admin/          ממשק ניהול (React)                                 ← עוד לא נבנה, ראו admin/README.md
├── api/            שרת + מסד נתונים לממשק הניהול                      ← עוד לא נבנה, ראו api/README.md
└── docs/           תוכנית המשך ומה שנשאר לעשות
```

## הרצה מקומית

```bash
cd website
npm install
npm run dev          # פיתוח: http://localhost:3000
npm run validate     # בדיקת תקינות של content/site.json (רצה גם אוטומטית לפני כל build)
npm run build        # בנייה: האתר המוכן נוצר בתיקייה website/out
npm run images       # יצירת גרסאות WebP לתמונות (ראו "תמונות וגופנים")
npm run og           # יצירה מחדש של תמונת השיתוף public/og-home.jpg
```

## עריכת תוכן

כל מה שמשתנה נמצא ב־`website/content/site.json`. אפשר לערוך אותו ישר באתר של GitHub
(פותחים את הקובץ ← סמל העיפרון ← **Commit changes**), והאתר מתעדכן אוטומטית תוך כמה דקות.
תמונות ופוסטרים נמצאים ב־`website/public/assets/uploads/`.

**בדיקה אוטומטית:** לפני כל בנייה רצה בדיקת תקינות (`website/scripts/validate-content.mjs`). אם יש טעות (JSON שבור, תאריך לא חוקי, מזהה כפול, תמונה חסרה או שלא הורצה עבורה `npm run images`), הבנייה נעצרת עם הסבר בעברית, והאתר החי נשאר כמו שהיה. בלשונית Deployments ב־Cloudflare רואים את ההסבר ביומן הבנייה.

### קורסים (`courses`)

| שדה | משמעות |
|---|---|
| `status` | `open` (פתוח), `closed` (מוצג עם "ההרשמה סגורה"), `hidden` (לא מוצג) |
| `startDate` | תאריך תחילת הקורס, בפורמט `YYYY-MM-DD`. מוצג בעמוד הקורס בעברית (למשל: יום שלישי, כ״ו בטבת (5.1.2027)), מסדר את הקורסים לפי תאריך (הקרוב ראשון) ונכנס ל־SEO |
| `hideAfter` | תאריך אחרון להצגה, `YYYY-MM-DD`. למחרת הקורס נעלם מהאתר (דורש בנייה, ראו "בנייה לילית") |
| `page.details.start` | טקסט חופשי לתיבת "מועד פתיחה". אם הוא ריק ויש `startDate`, מוצג התאריך. אם שניהם ריקים: "יעודכן בקרוב" |
| `externalUrl` | קורס שנמצא באתר אחר: הכרטיס מקשר החוצה ואין לו עמוד באתר |

* קורס שאין לו `startDate` נשאר במקומו ברשימה (למשל קישור קבוע לאתר המכון).
* להוסיף קורס: להוסיף אובייקט ל־`courses`; נוצר לו אוטומטית עמוד בכתובת `/courses/<id>/`.
* תמונות הקורס: ראו "תמונות וגופנים".

### מפגש הייעוץ הקרוב (`meeting`)

* `show`: `true`/`false`.
* `date`: תאריך `YYYY-MM-DD` (מוצג בעברית). אפשר גם טקסט חופשי, והוא יוצג כמו שהוא.
* `hideAfter` (לא חובה): אחרי התאריך הזה המפגש נעלם. אם לא מוגדר והתאריך הוא תאריך אמיתי, המפגש נעלם יום אחרי `date`.
* `time`, `place`, `topic`, `note`: טקסט חופשי. `note` ריק = לא מוצג.

### פרטי קשר (`contact`) וצוות (`experts`)
טלפון, וואטסאפ, מייל ורשימת אנשי הצוות (שם ותפקיד).

## פריסה (Cloudflare Workers, קבצים סטטיים)

האתר מפורסם דרך Cloudflare, מחובר לריפו: **כל `push` ל־`main` בונה ומפרסם מחדש** (כ־2–3 דקות).

הגדרות הפרויקט ב־Cloudflare (Workers & Pages ← Create ← Import a repository):

| הגדרה | ערך |
|---|---|
| Project name | `hamabat` (חייב להתאים לשם ב־`wrangler.jsonc`) |
| Build command | `cd website && npm ci && npm run build` |
| Deploy command | `npx wrangler deploy` |
| Build variable | `NEXT_PUBLIC_SITE_URL` = הכתובת הסופית, למשל `https://www.example.co.il` (קובע canonical, sitemap ו־Open Graph) |

* `wrangler.jsonc` בשורש הריפו מצביע על `website/out`; `website/public/_headers` קובע מטמון וכותרות אבטחה.
* אחרי שינוי משתנה ב־Cloudflare צריך ללחוץ **Retry build** (Deployments).
* כישלון בנייה לא פוגע באתר החי. אפשר לחזור לגרסה קודמת עם **Rollback**.
* חיבור דומיין: לשונית Domains בפרויקט, ואחריה עדכון `NEXT_PUBLIC_SITE_URL` ובנייה מחדש.

## בנייה לילית

האתר סטטי, ולכן דברים שתלויים בתאריך (מפגש הייעוץ אחרי התאריך שלו, קורס אחרי `hideAfter`) משתנים רק כשהאתר נבנה מחדש.
ה־GitHub Action `.github/workflows/nightly-rebuild.yml` רץ כל לילה אחרי חצות (שעון ישראל), בודק אם משהו פג אתמול,
ואם כן דוחף commit ריק, ו־Cloudflare בונה ומפרסם מחדש. אם לא פג כלום, לא קורה כלום.

* הרצה ידנית: GitHub ← Actions ← "Nightly rebuild" ← Run workflow (אפשר לסמן `force` כדי לבנות בכל מקרה).
* הבדיקה עצמה: `website/scripts/needs-rebuild.mjs` (אפשר לבדוק ידנית עם `TODAY=2026-12-02 node scripts/needs-rebuild.mjs`).
* תאריכים מחושבים לפי שעון ישראל.
* GitHub מכבה פעולות מתוזמנות בריפו שלא היה בו שום פעילות 60 יום; במקרה כזה מפעילים אותה מחדש בלשונית Actions.

## תמונות וגופנים

* **תמונות:** מניחים את התמונה המקורית (JPG/PNG) ב־`website/public/assets/uploads/`, מפנים אליה מ־`site.json`, ואז מריצים `npm run images` (בתוך `website`).
  הסקריפט יוצר לצידה גרסאות WebP קלות (`-600.webp`, `-1000.webp`), והאתר מגיש אותן אוטומטית. המקור נשאר לתצוגות שיתוף ולכפתור "הגדלה".
* **גופנים:** Rubik ו־Assistant מאוחסנים עצמית ב־`website/public/fonts/` (עברית ולטינית, רישיון OFL), עם טעינה מוקדמת, בלי בקשות לשרתי Google.
* **לוגו המכון:** `website/public/logo-mabat.svg` (נשמר במטמון, לא מוטמע בכל עמוד).
* **CSS:** קובץ אחד, `website/src/styles/globals.css`, מנוקה משאריות של גרסאות קודמות של ההדמיה.

## SEO

* HTML מלא לכל עמוד, כתובת אמיתית לכל קורס, `lang="he"` ו־`dir="rtl"`
* `<title>`, description, canonical ו־Open Graph לכל עמוד (`generateMetadata`)
* נתונים מובנים: `Organization` (בית), `Course` + `BreadcrumbList` (עמודי קורס), ו־`CourseInstance` עם תאריך התחלה כשמוגדר `startDate`
* `sitemap.xml` ו־`robots.txt` נוצרים אוטומטית; favicon; תמונת שיתוף כללית (`public/og-home.jpg`) לעמודים שאין להם תמונה משלהם (בעמודי קורס משתמשים בפוסטר)
* h1 אחד בכל עמוד, תמונות עם `alt` ומידות (למניעת קפיצות פריסה)
* Lighthouse (נייד, סימולציה): נגישות, פרקטיקות ו־SEO = 100

## נגישות

נבדק עם axe-core (ללא הפרות), בדיקת ניגודיות בפועל על כל הטקסטים, ניווט מקלדת (קישור "דילוג לתוכן", סדר פוקוס הגיוני, מסגרת פוקוס גלויה), הגדלה ל־200%, תצוגה ברוחב 320px (אין גלילה אופקית), וגודל מטרות מגע (מינימום 24px). כפתורי הפעולה הראשיים וה־tags כהו מעט כדי לעמוד ב־AA. הצהרת הנגישות נמצאת ב־`/accessibility/`.

## קבצים עיקריים

| קובץ | תפקיד |
|---|---|
| `website/content/site.json` | כל התוכן שמשתנה |
| `website/src/lib/content.ts` | נקודת הגישה היחידה לתוכן. כאן יוחלף הקריאה מ־JSON בקריאה ל־API |
| `website/src/lib/types.ts` | סכמת הנתונים (תהיה גם הסכמה של מסד הנתונים) |
| `website/src/lib/dates.ts` | פורמט תאריכים בעברית ושעון ישראל |
| `website/src/app/**` | העמודים: `/`, `/professionals`, `/workshops`, `/consult`, `/contact`, `/courses/[id]`, `/accessibility`, `/privacy` |
| `website/src/components/**` | רכיבי UI. רכיבי `"use client"` הם רק אלה שצריכים דפדפן (תפריט, אנימציית הלוגו, העתקה, אפקטים) |
| `website/src/lib/sparks.ts` | אנימציית הלוגו ב־canvas (רצה פעם אחת בכל ביקור) |
| `website/scripts/` | `validate-content`, `optimize-images`, `needs-rebuild` |

מה נשאר לעשות: ראו `docs/ROADMAP.md`.
