"use client";

import { useEffect, useRef } from "react";
import { initSparks } from "@/lib/sparks";

/** Canvas for the hero logo animation + the soft glow that follows the pointer. */
export default function HeroSparks() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const hero = cv?.closest<HTMLElement>(".hero");
    if (!cv || !hero) return;

    const stop = initSparks(cv, hero);

    const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const glow = hero.querySelector<HTMLElement>(".glow");
    const onMove = (e: PointerEvent) => {
      if (!glow) return;
      const hr = hero.getBoundingClientRect();
      glow.style.setProperty("--gx", `${e.clientX - hr.left}px`);
      glow.style.setProperty("--gy", `${e.clientY - hr.top}px`);
    };
    if (!calm) hero.addEventListener("pointermove", onMove);

    return () => {
      stop();
      hero.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} className="sparks" aria-hidden="true" />;
}
