// Validates content/site.json. Run: npm run validate
// Later this same schema check can run inside the admin API before "publish".
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "content/site.json"), "utf8"));
const errors = [];
const err = (m) => errors.push(m);

const phone = /^[\d\-+ ]{7,}$/;
for (const k of ["phone", "whatsapp", "email"]) if (!data.contact?.[k]) err(`contact.${k} is missing`);
if (data.contact?.email && !/^\S+@\S+\.\S+$/.test(data.contact.email)) err("contact.email is not a valid email");
for (const k of ["phone", "whatsapp"]) if (data.contact?.[k] && !phone.test(data.contact[k])) err(`contact.${k} looks wrong`);

if (data.meeting?.hideAfter && !/^\d{4}-\d{2}-\d{2}$/.test(data.meeting.hideAfter))
  err("meeting.hideAfter must be YYYY-MM-DD");

const ids = new Set();
for (const c of data.courses ?? []) {
  if (!/^[a-z0-9-]+$/.test(c.id ?? "")) err(`course id "${c.id}" must be lowercase letters, digits or dashes`);
  if (ids.has(c.id)) err(`duplicate course id "${c.id}"`);
  ids.add(c.id);
  if (!["professionals", "workshops"].includes(c.group)) err(`course ${c.id}: bad group "${c.group}"`);
  if (!["open", "closed", "hidden"].includes(c.status)) err(`course ${c.id}: bad status "${c.status}"`);
  if (!c.title || !c.summary) err(`course ${c.id}: title and summary are required`);
  if (!c.externalUrl && !c.page) err(`course ${c.id}: needs either externalUrl or page`);
  if (c.page?.registerPhone && !phone.test(c.page.registerPhone)) err(`course ${c.id}: registerPhone looks wrong`);
  for (const img of [c.page?.ad?.image, c.page?.brand?.logo].filter(Boolean)) {
    if (!fs.existsSync(path.join(root, "public", img))) err(`course ${c.id}: image not found: public/${img}`);
  }
}

if (errors.length) {
  console.error("Content errors:\n - " + errors.join("\n - "));
  process.exit(1);
}
console.log(`content/site.json OK (${ids.size} courses)`);
