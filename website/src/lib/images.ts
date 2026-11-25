/**
 * Optimized image variants (created by `npm run images`, see scripts/optimize-images.mjs).
 * For an original like "assets/uploads/poster.jpg" the script writes
 * "poster-<width>.webp" next to it. The original stays for Open Graph + "enlarge".
 */
export function webpSet(src: string, widths: number[]) {
  const base = `/${src.replace(/\.[^.]+$/, "")}`;
  const sorted = [...widths].sort((a, b) => a - b);
  return {
    src: `${base}-${sorted[sorted.length - 1]}.webp`,
    srcSet: sorted.map((w) => `${base}-${w}.webp ${w}w`).join(", "),
  };
}

export const POSTER_WIDTHS = [600, 1000];
export const LOGO_WIDTHS = [300, 600];
