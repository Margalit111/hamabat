export const SITE_NAME = "מבט";
export const SITE_FULL_NAME = "מבט – המרכז לבריאות גוף נפש לאם ולתינוק";
export const SITE_TAGLINE = "המרכז לבריאות גוף נפש לאם ולתינוק | לפני ואחרי לידה";
export const SITE_DESCRIPTION =
  "מרכז מקצועי המעניק ידע, הכוונה, הכשרה וליווי בתחום בריאות האישה במעגלי החיים, בדגש על תקופת ההיריון, הלידה והתקופה שלאחר הלידה.";
export const INSTITUTE_URL = "https://machon-hamabat.org.il/";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.co.il"
).replace(/\/$/, "");

export const NAV = [
  { href: "/", label: "דף הבית" },
  { href: "/professionals", label: "הכשרות לנשות מקצוע" },
  { href: "/workshops", label: "סדנאות לשיקום גופני לפני ואחרי לידה" },
  { href: "/consult", label: "ייעוץ" },
  { href: "/contact", label: "יצירת קשר" },
] as const;

export const absoluteUrl = (p: string) =>
  `${SITE_URL}${p.startsWith("/") ? p : `/${p}`}`;
