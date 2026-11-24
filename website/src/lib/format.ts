export const digits = (s?: string) => String(s ?? "").replace(/\D/g, "");

export const telHref = (phone?: string) => `tel:${digits(phone)}`;

export const waHref = (phone?: string, text?: string) =>
  `https://wa.me/972${digits(phone).replace(/^0/, "")}${
    text ? `?text=${encodeURIComponent(text)}` : ""
  }`;

export const mailHref = (email?: string, subject?: string) =>
  `mailto:${email ?? ""}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
