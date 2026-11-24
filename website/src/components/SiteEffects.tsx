"use client";

import { useEffect } from "react";

/**
 * Global, purely visual effects from the mock-up:
 *  - --sy (scroll position) for the parallax blobs
 *  - card spotlight that follows the pointer
 *  - "magnetic" buttons ([data-mag])
 */
export default function SiteEffects() {
  useEffect(() => {
    const root = document.documentElement;
    let ticking = false;
    const onScroll = () => {
      root.style.setProperty("--sy", String(Math.min(scrollY, 900)));
      ticking = false;
    };
    const onScrollRaf = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    };
    addEventListener("scroll", onScrollRaf, { passive: true });
    onScroll();

    const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const onMove = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const c = t?.closest?.<HTMLElement>(".card");
      if (c) {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--mx", `${e.clientX - r.left}px`);
        c.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
      const b = t?.closest?.<HTMLElement>("[data-mag]");
      if (b) {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--tx", `${(e.clientX - r.left - r.width / 2) * 0.18}px`);
        b.style.setProperty("--ty", `${(e.clientY - r.top - r.height / 2) * 0.28}px`);
      }
    };
    const onOut = (e: PointerEvent) => {
      const b = (e.target as Element | null)?.closest?.<HTMLElement>("[data-mag]");
      if (b) {
        b.style.setProperty("--tx", "0px");
        b.style.setProperty("--ty", "0px");
      }
    };
    if (!calm) {
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerout", onOut);
    }
    return () => {
      removeEventListener("scroll", onScrollRaf);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
    };
  }, []);

  return null;
}
