"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { initSparks } from "@/lib/sparks";

/**
 * The intro animation plays once per visit. After it finished (or on any
 * later return to the home page) the logo is shown in its final, stable
 * state. "Once per visit" = once per browser tab session (sessionStorage);
 * the module flag covers client-side navigation and blocked storage.
 */
const STORAGE_KEY = "mabat:hero-played";
let played = false;

function hasPlayed() {
  if (played) return true;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markPlayed() {
  played = true;
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* storage unavailable: the module flag is enough for this page load */
  }
}

/** Canvas for the hero logo animation + the soft glow that follows the pointer. */
export default function HeroSparks() {
  const ref = useRef<HTMLCanvasElement>(null);

  // Before paint: on a repeat visit show the finished logo right away.
  useLayoutEffect(() => {
    if (hasPlayed()) {
      document.documentElement.classList.add("logo-ready", "hero-seen");
      if (ref.current) ref.current.style.display = "none";
    }
  }, []);

  useEffect(() => {
    const cv = ref.current;
    const hero = cv?.closest<HTMLElement>(".hero");
    if (!cv || !hero) return;

    const replay = hasPlayed();
    const stop = replay ? () => {} : initSparks(cv, hero, markPlayed);

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
