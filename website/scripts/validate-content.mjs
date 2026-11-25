// Validates content/site.json. Runs automatically before every build (`prebuild`),
// so a mistake stops the build with a clear message and the live site is not touched.
// Manual run: npm run validate
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const file = path.join(root, "content/site.json");
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const done = () => {
  if (warnings.length) console.warn("\nאזהרות (לא עוצרות את הבנייה):\n - " + warnings.join("\n - "));
  if (errors.length) {
    console.error("\nנמצאו שגיאות ב-content/site.json, הבנייה נעצרה (האתר החי לא הושפע):\n - " + errors.join("\n - ") + "\n");
    process.exit(1);
  }
};

let data;
try {
  data = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (e) {
  err(`הקובץ אינו JSON תקין: ${e.message}. בדקי מרכאות חסרות, פסיק חסר בין שורות או פסיק מיותר אחרי השורה האחרונה בקבוצה`);
  done();
}

const phone = /^[\d\-+ ]{7,}$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (v) =>
  ISO.test(v) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());

// --- contact
for (const k of ["phone", "whatsapp", "email"]) if (!data.contact?.[k]) err(`contact.${k} חסר`);
if (data.contact?.email && !/^\S+@\S+\.\S+$/.test(data.contact.email)) err("contact.email אינו כתובת מייל תקינה");
for (const k of ["phone", "whatsapp"]) {
  if (data.contact?.[k] && !phone.test(data.contact[k])) err(`contact.${k} נראה לא תקין (ספרות, מקפים ורווחים בלבד)`);
}

// --- meeting
const m = data.meeting;
if (m) {
  if (typeof m.show !== "boolean") err("meeting.show חייב להיות true או false (בלי מרכאות)");
  if (m.hideAfter && !validDate(m.hideAfter)) err("meeting.hideAfter חייב להיות תאריך אמיתי בפורמט YYYY-MM-DD");
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(m.date ?? "") && !validDate(m.date))
    err("meeting.date נראה כמו תאריך אבל אינו תקין. הפורמט הנכון: YYYY-MM-DD (למשל 2026-12-01)");
  if (m.show && validDate(m.hideAfter || m.date || "") && (m.hideAfter || m.date) < today)
    warn("מפגש הייעוץ מוגדר להצגה אבל התאריך שלו כבר עבר, ולכן הוא לא יוצג באתר");
  if (m.show && m.note) warn(`למפגש יש הערה ("${m.note}") שתוצג באתר. אם זה נתוני הדגמה, זכרי להסיר`);
}

// --- experts
(data.experts ?? []).forEach((x, i) => {
  if (!x.name || !x.role) err(`experts[${i}]: שם ותפקיד חובה`);
});

// --- courses
const ids = new Set();
const widthsFor = (kind) => (kind === "logo" ? [300, 600] : [600, 1000]);
const checkImage = (id, src, kind) => {
  const abs = path.join(root, "public", src);
  if (!fs.existsSync(abs)) return err(`קורס ${id}: התמונה לא נמצאה: public/${src}`);
  const base = abs.replace(/\.[^.]+$/, "");
  const missing = widthsFor(kind).filter((w) => !fs.existsSync(`${base}-${w}.webp`));
  if (missing.length) err(`קורס ${id}: חסרות גרסאות WebP של ${src}. יש להריץ בתיקיית website: npm run images`);
};
for (const c of data.courses ?? []) {
  if (!/^[a-z0-9-]+$/.test(c.id ?? "")) err(`מזהה קורס "${c.id}" חייב להיות באותיות אנגליות קטנות, ספרות ומקפים בלבד`);
  if (ids.has(c.id)) err(`מזהה קורס כפול: "${c.id}"`);
  ids.add(c.id);
  if (!["professionals", "workshops"].includes(c.group)) err(`קורס ${c.id}: group חייב להיות professionals או workshops (נמצא "${c.group}")`);
  if (!["open", "closed", "hidden"].includes(c.status)) err(`קורס ${c.id}: status חייב להיות open, closed או hidden (נמצא "${c.status}")`);
  if (!c.title || !c.summary) err(`קורס ${c.id}: כותרת ותקציר חובה`);
  if (!c.externalUrl && !c.page) err(`קורס ${c.id}: צריך page או externalUrl`);
  if (c.externalUrl && !/^https?:\/\//.test(c.externalUrl)) err(`קורס ${c.id}: externalUrl חייב להתחיל ב-https://`);
  for (const k of ["startDate", "hideAfter"]) {
    if (c[k] && !validDate(c[k])) err(`קורס ${c.id}: ${k} חייב להיות תאריך אמיתי בפורמט YYYY-MM-DD`);
  }
  if (validDate(c.startDate ?? "") && validDate(c.hideAfter ?? "") && c.hideAfter < c.startDate)
    warn(`קורס ${c.id}: hideAfter מוקדם מ-startDate, הקורס ייעלם לפני שיתחיל`);
  if (c.status !== "hidden" && validDate(c.hideAfter ?? "") && c.hideAfter < today)
    warn(`קורס ${c.id}: hideAfter כבר עבר, ולכן הקורס לא יוצג באתר`);
  if (c.page?.registerPhone && !phone.test(c.page.registerPhone)) err(`קורס ${c.id}: registerPhone נראה לא תקין`);
  if (c.page?.ad?.image) {
    checkImage(c.id, c.page.ad.image, "poster");
    if (!c.page.ad.alt) warn(`קורס ${c.id}: חסר טקסט חלופי (alt) לפוסטר, חשוב לנגישות`);
    if (!c.page.ad.width || !c.page.ad.height) warn(`קורס ${c.id}: חסרים width ו-height לפוסטר (מונעים קפיצות בטעינה)`);
  }
  if (c.page?.brand?.logo) checkImage(c.id, c.page.brand.logo, "logo");
  for (const f of c.page?.features ?? []) {
    if (!f.title || !f.text) err(`קורס ${c.id}: לכל פריט ב-features חייבים title ו-text`);
  }
}

done();
console.log(`content/site.json תקין (${ids.size} קורסים)`);
