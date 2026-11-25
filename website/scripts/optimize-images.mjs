// Generates optimized WebP variants for every image referenced in content/site.json.
//   poster/ad images  -> <name>-600.webp, <name>-1000.webp
//   brand logos       -> <name>-300.webp, <name>-600.webp
// The original file stays next to them (used for Open Graph previews and the "enlarge" link).
// Run: npm run images        (re-run whenever you add or replace an image)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "content/site.json"), "utf8"));

const jobs = [];
for (const c of data.courses ?? []) {
  if (c.page?.ad?.image) jobs.push({ src: c.page.ad.image, widths: [600, 1000] });
  if (c.page?.brand?.logo) jobs.push({ src: c.page.brand.logo, widths: [300, 600] });
}

let before = 0;
let after = 0;
for (const { src, widths } of jobs) {
  const file = path.join(root, "public", src);
  const base = file.replace(/\.[^.]+$/, "");
  const meta = await sharp(file).metadata();
  before += fs.statSync(file).size;
  for (const w of widths) {
    const width = Math.min(w, meta.width ?? w);
    const out = `${base}-${w}.webp`;
    await sharp(file).resize({ width }).webp({ quality: 80, effort: 5 }).toFile(out);
    const size = fs.statSync(out).size;
    after += size;
    console.log(`${path.relative(root, out)}  ${(size / 1024).toFixed(0)}KB`);
  }
}
console.log(`original ${(before / 1024).toFixed(0)}KB -> webp variants ${(after / 1024).toFixed(0)}KB total`);
