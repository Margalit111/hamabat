// Generates optimized WebP variants for every image referenced in content/site.json.
//   poster/ad images  -> <name>-600.webp, <name>-1000.webp
//   brand logos       -> <name>-300.webp, <name>-600.webp
// The original file stays next to them (used for Open Graph previews and the "enlarge" link).
// Runs automatically before every build (see "prebuild"), so adding or replacing an image
// only needs the original file + its path in content/site.json. Manual run: npm run images
import fs from "node:fs";
import path from "node:path";

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("sharp is not installed: skipping image optimization (existing .webp files are used as they are).");
  process.exit(0);
}

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
    if (!process.argv.includes("--quiet")) console.log(`${path.relative(root, out)}  ${(size / 1024).toFixed(0)}KB`);
  }
}
console.log(`תמונות: ${jobs.length} קבצים עובדו (${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB ב-WebP)`);
