import type { SiteContent } from "./types";

/** Same checks as website/scripts/validate-content.mjs (minus the file-system ones), with Hebrew messages. */
export interface Validation {
  errors: string[];
  warnings: string[];
}

const PHONE = /^[\d\-+ ]{7,}$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export const isRealDate = (v?: string): boolean =>
  !!v && ISO.test(v) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;

export function todayInIsrael(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
}

export function validateContent(data: SiteContent): Validation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const today = todayInIsrael();

  const c = data.contact;
  for (const k of ["phone", "whatsapp", "email"] as const) if (!c?.[k]) errors.push(`פרטי קשר: חסר ${k === "phone" ? "טלפון" : k === "whatsapp" ? "וואטסאפ" : "מייל"}`);
  if (c?.email && !/^\S+@\S+\.\S+$/.test(c.email)) errors.push("פרטי קשר: כתובת המייל אינה תקינה");
  for (const k of ["phone", "whatsapp"] as const) if (c?.[k] && !PHONE.test(c[k])) errors.push(`פרטי קשר: ${k === "phone" ? "הטלפון" : "הוואטסאפ"} נראה לא תקין`);

  const m = data.meeting;
  if (m) {
    if (m.hideAfter && !isRealDate(m.hideAfter)) errors.push("מפגש ייעוץ: תאריך ההסתרה אינו תאריך תקין");
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(m.date ?? "") && !isRealDate(m.date)) errors.push("מפגש ייעוץ: התאריך אינו תקין");
    const last = m.hideAfter || (isRealDate(m.date) ? m.date : "");
    if (m.show && last && last < today) warnings.push("מפגש הייעוץ מוגדר להצגה אבל התאריך שלו עבר, ולכן הוא לא יוצג באתר");
  }

  (data.experts ?? []).forEach((x, i) => {
    if (!x.name?.trim() || !x.role?.trim()) errors.push(`צוות: לאיש הצוות מספר ${i + 1} חסר שם או תפקיד`);
  });

  const ids = new Set<string>();
  for (const course of data.courses ?? []) {
    const name = course.title || course.id || "קורס ללא שם";
    if (!/^[a-z0-9-]+$/.test(course.id ?? "")) errors.push(`${name}: המזהה חייב להיות באותיות אנגליות קטנות, ספרות ומקפים`);
    if (ids.has(course.id)) errors.push(`${name}: המזהה "${course.id}" כבר קיים בקורס אחר`);
    ids.add(course.id);
    if (!course.title?.trim() || !course.summary?.trim()) errors.push(`${name}: כותרת ותקציר הם שדות חובה`);
    if (!course.externalUrl && !course.page) errors.push(`${name}: צריך עמוד קורס או כתובת לאתר חיצוני`);
    if (course.externalUrl && !/^https?:\/\//.test(course.externalUrl)) errors.push(`${name}: הכתובת החיצונית חייבת להתחיל ב־https://`);
    for (const k of ["startDate", "hideAfter"] as const) {
      if (course[k] && !isRealDate(course[k])) errors.push(`${name}: ${k === "startDate" ? "תאריך ההתחלה" : "תאריך ההסתרה"} אינו תקין`);
    }
    if (course.page?.registerPhone && !PHONE.test(course.page.registerPhone)) errors.push(`${name}: טלפון ההרשמה נראה לא תקין`);
    if (course.status !== "hidden" && course.hideAfter && isRealDate(course.hideAfter) && course.hideAfter < today)
      warnings.push(`${name}: תאריך ההסתרה עבר, ולכן הקורס לא יוצג באתר`);
    const ad = course.page?.ad;
    if (ad?.image) {
      if (!ad.alt?.trim()) errors.push(`${name}: חסר תיאור קצר לפוסטר (חשוב לנגישות)`);
      if (!/^assets\/uploads\/[\w.\-]+$/.test(ad.image)) errors.push(`${name}: נתיב התמונה אינו תקין`);
    }
    for (const f of course.page?.features ?? []) {
      if (!f.title?.trim() || !f.text?.trim()) errors.push(`${name}: לכל יתרון חייבים כותרת ותיאור`);
    }
  }
  return { errors, warnings };
}
