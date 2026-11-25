// Creates the default share image (public/og-home.jpg, 1200x630) used by WhatsApp / Facebook / Google
// previews for pages that have no picture of their own. Run: npm run og
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const src = fs.readFileSync(path.join(root, "src/lib/logo-paths.ts"), "utf8");
const grab = (name) => src.match(new RegExp(`${name} = "([^"]+)"`))[1];
const A = grab("HERO_LOGO_A");
const B = grab("HERO_LOGO_B");

const W = 1200, H = 630;
const logoW = 800;
const scale = logoW / 632; // hero logo viewBox is 632 x 281
const logoH = 281 * scale;
const x = (W - logoW) / 2;
const y = (H - logoH) / 2 - 8;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="p" cx="0" cy="0.55" r="0.75"><stop offset="0" stop-color="#C79BE3" stop-opacity=".75"/><stop offset="1" stop-color="#C79BE3" stop-opacity="0"/></radialGradient>
    <radialGradient id="t" cx="1" cy="0.55" r="0.75"><stop offset="0" stop-color="#5BCFC9" stop-opacity=".7"/><stop offset="1" stop-color="#5BCFC9" stop-opacity="0"/></radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFCFE"/><stop offset=".6" stop-color="#FBF0FA"/><stop offset="1" stop-color="#E9F8F8"/></linearGradient>
    <linearGradient id="hlg" gradientUnits="userSpaceOnUse" x1="48" y1="38" x2="680" y2="319">
      <stop offset="0" stop-color="#5E2F85"/><stop offset=".42" stop-color="#8A58BE"/><stop offset=".78" stop-color="#3AA9B0"/><stop offset="1" stop-color="#45C1C0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#p)"/>
  <rect width="${W}" height="${H}" fill="url(#t)"/>
  <g transform="translate(${x} ${y}) scale(${scale}) translate(-48 -38)">
    <path d="${A}" fill="url(#hlg)" stroke="url(#hlg)" stroke-width="5" stroke-linejoin="round" fill-rule="evenodd"/>
    <path d="${B}" fill="url(#hlg)" stroke="url(#hlg)" stroke-width="1.2" stroke-linejoin="round" fill-rule="evenodd"/>
  </g>
</svg>`;

const out = path.join(root, "public/og-home.jpg");
await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
console.log(`${path.relative(root, out)}  ${(fs.statSync(out).size / 1024).toFixed(0)}KB`);
