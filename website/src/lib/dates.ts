/**
 * Date helpers. Dates in content/site.json are ISO strings (YYYY-MM-DD) so the site can
 * sort, hide and format them. They are shown in Hebrew: weekday, Hebrew date and the
 * regular date, e.g. "יום שלישי, כ״א בכסלו (1.12.2026)".
 */
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export const isIsoDate = (s?: string): s is string => !!s && ISO.test(s);

/** Today's date in Israel (YYYY-MM-DD). The build runs in UTC, so never use the server's local day. */
export function todayInIsrael(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
}

const UNITS = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const TENS = ["", "י", "כ", "ל"];

/** 1-30 as Hebrew letters: 5 -> ה׳, 15 -> ט״ו, 21 -> כ״א. */
export function hebrewNumeral(n: number): string {
  let s: string;
  if (n === 15) s = "טו";
  else if (n === 16) s = "טז";
  else s = TENS[Math.floor(n / 10)] + UNITS[n % 10];
  return s.length === 1 ? `${s}׳` : `${s.slice(0, -1)}״${s.slice(-1)}`;
}

/** "2026-12-01" -> "יום שלישי, כ״א בכסלו (1.12.2026)". Anything that is not an ISO date is returned as is. */
export function formatDateHe(value?: string): string {
  if (!isIsoDate(value)) return value ?? "";
  const d = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  const heb = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(d);
  const part = (t: string) => heb.find((p) => p.type === t)?.value ?? "";
  const regular = new Intl.DateTimeFormat("he-IL", {
    timeZone: "UTC",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(d);
  return `${part("weekday")}, ${hebrewNumeral(Number(part("day")))} ב${part("month")} (${regular})`;
}
