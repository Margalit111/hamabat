# מבט – אתר המרכז לבריאות גוף נפש לאם ולתינוק

מימוש ב־Next.js של ההדמיה. האתר נבנה כ־HTML סטטי מלא (לכל עמוד כתובת משלו, כותרות, תיאורים ונתוני SEO),
והתוכן שמשתנה (קורסים, מפגשים, צוות, פרטי קשר) יושב בקובץ נתונים אחד.

```
mabat/
├── website/   האתר הציבורי (Next.js + TypeScript, ייצוא סטטי)   ← מוכן
├── admin/     ממשק ניהול (React)                                 ← עוד לא נבנה, ראו admin/README.md
├── api/       שרת + מסד נתונים לממשק הניהול                      ← עוד לא נבנה, ראו api/README.md
└── docs/      החלטות ארכיטקטורה ותוכנית המשך
```

## הרצה

```bash
cd website
npm install
npm run dev          # פיתוח: http://localhost:3000
npm run validate     # בדיקת תקינות של content/site.json
npm run build        # בנייה: האתר המוכן נוצר בתיקייה website/out
```

## עריכת תוכן (כרגע)

כל מה שמשתנה נמצא ב־`website/content/site.json`: קורסים, מועד פתיחה, מקום, מחיר, מפגש ייעוץ קרוב, צוות ופרטי קשר.
תמונות ופוסטרים נמצאים ב־`website/public/assets/uploads/`.

* להסתיר קורס: `"status": "hidden"`. לסגור הרשמה: `"status": "closed"`.
* להוסיף קורס: להוסיף אובייקט ל־`courses`; נוצר לו אוטומטית עמוד בכתובת `/courses/<id>/`.
* קורס שנמצא באתר אחר: להוסיף `externalUrl` במקום `page`.
* מפגש הייעוץ נעלם אחרי התאריך שב־`meeting.hideAfter` (פורמט `YYYY-MM-DD`). זה מחושב בזמן הבנייה, לכן יש להגדיר בנייה לילית (ראו למטה).

## פריסה (Cloudflare Pages / Netlify / Vercel)

* Root directory: `website`
* Build command: `npm run build`
* Output directory: `out`
* משתנה סביבה: `NEXT_PUBLIC_SITE_URL=https://הדומיין-האמיתי` (קובע כתובות canonical, sitemap ו־Open Graph)
* בנייה לילית: Deploy Hook של הפלטפורמה + cron (או GitHub Actions עם `schedule`), כדי שקורסים/מפגשים שפג תוקפם יוסתרו.

## תמונות וגופנים (ביצועים)

* **תמונות:** מניחים את התמונה המקורית (JPG/PNG) ב־`website/public/assets/uploads/`, מפנים אליה מ־`site.json`, ואז מריצים `npm run images` (בתוך `website`).
  הסקריפט יוצר לצידה גרסאות WebP קלות (`-600.webp`, `-1000.webp`), והאתר מגיש אותן אוטומטית. המקור נשאר לתצוגות שיתוף ולכפתור "הגדלה".
* **גופנים:** Rubik ו־Assistant מאוחסנים עצמית (חבילות `@fontsource-variable`), בלי בקשות לשרתי Google.
* **לוגו המכון:** קובץ `public/logo-mabat.svg` (נשמר במטמון, לא מוטמע בכל עמוד).

## מה כבר מכוסה ב־SEO

* HTML מלא לכל עמוד, כתובת אמיתית לכל קורס, `lang="he"` ו־`dir="rtl"`
* `<title>`, description, canonical ו־Open Graph לכל עמוד (`generateMetadata`)
* נתונים מובנים: `Organization` (בית), `Course` + `BreadcrumbList` (עמודי קורס)
* `sitemap.xml` ו־`robots.txt` נוצרים אוטומטית
* h1 אחד בכל עמוד, תמונות עם `alt` ומידות (למניעת קפיצות פריסה)

## קבצים עיקריים

| קובץ | תפקיד |
|---|---|
| `website/src/lib/content.ts` | נקודת הגישה היחידה לתוכן. כאן יוחלף הקריאה מ־JSON בקריאה ל־API |
| `website/src/lib/types.ts` | סכמת הנתונים (תהיה גם הסכמה של מסד הנתונים) |
| `website/src/app/**` | העמודים: `/`, `/professionals`, `/workshops`, `/consult`, `/contact`, `/courses/[id]` |
| `website/src/components/**` | רכיבי UI. רכיבי `"use client"` הם רק אלה שצריכים דפדפן (תפריט, אנימציית הלוגו, העתקה, אפקטים) |
| `website/src/lib/sparks.ts` | אנימציית הלוגו ב־canvas, מועתקת מההדמיה |
| `website/src/styles/globals.css` | ה־CSS של ההדמיה כמעט ללא שינוי |

המשך: ראו `docs/ROADMAP.md`.
