import { HERO_LOGO_A, HERO_LOGO_B } from "./logo-paths";

/**
 * Hero animation: lights fly in from every direction and, where they land,
 * the real vector logo crystallises (so it never looks pixelated).
 * Ported 1:1 from the design mock-up. Returns a cleanup function.
 */
type Spark = {
  x0: number;
  y0: number;
  tx: number;
  ty: number;
  d: number;
  du: number;
  b: number;
  s: number;
};

const VB = { x: 48, y: 38, width: 632, height: 281 }; // viewBox of the hero logo
const SWA = 5;
const SWB = 1.2;
const TAU = 6.2832;
const NB = 40;
const STOPS: [number, [number, number, number]][] = [
  [0, [94, 47, 133]],
  [0.42, [138, 88, 190]],
  [0.78, [58, 169, 176]],
  [1, [69, 193, 192]],
];

function colorAt(t: number) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < STOPS.length; i++) {
    if (t <= STOPS[i][0]) {
      const a = STOPS[i - 1];
      const b = STOPS[i];
      const u = (t - a[0]) / (b[0] - a[0]);
      return a[1].map((v, k) => Math.round(v + (b[1][k] - v) * u));
    }
  }
  return STOPS[STOPS.length - 1][1];
}

export function initSparks(cv: HTMLCanvasElement, hero: HTMLElement): () => void {
  const root = document.documentElement;
  const lgEl = hero.querySelector<SVGSVGElement>("svg.hlogo");
  if (!lgEl) return () => {};
  const ctx = cv.getContext("2d");
  root.classList.remove("logo-ready", "nocvs");
  if (!ctx) {
    root.classList.add("nocvs");
    return () => {};
  }

  const PA = new Path2D(HERO_LOGO_A);
  const PB = new Path2D(HERO_LOGO_B);
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const COL = Array.from(
    { length: NB },
    (_, i) => `rgb(${colorAt(i / (NB - 1)).join(",")})`,
  );

  let lx = 0, ly = 0, lw = 1, lh = 1, K = 1, W = 0, H = 0, dpr = 1;
  let cx = 0, cy = 0, T0 = 0, raf = 0, w0 = 0;
  let P: Spark[] = [];
  let logoC: HTMLCanvasElement;
  let revC: HTMLCanvasElement;
  let rc: CanvasRenderingContext2D;
  let done = false;
  let started = false;
  let cancelled = false;

  function gradOn(c: CanvasRenderingContext2D) {
    const g = c.createLinearGradient(VB.x, VB.y, VB.x + VB.width, VB.y + VB.height);
    STOPS.forEach((s) => g.addColorStop(s[0], `rgb(${s[1].join(",")})`));
    return g;
  }

  function paintLogo(c: CanvasRenderingContext2D, fill?: string) {
    c.save();
    c.translate(lx, ly);
    c.scale(K, K);
    c.translate(-VB.x, -VB.y);
    const f = fill || gradOn(c);
    c.fillStyle = f;
    c.strokeStyle = f;
    c.lineJoin = "round";
    c.fill(PA, "evenodd");
    c.fill(PB, "evenodd");
    c.lineWidth = SWA;
    c.stroke(PA);
    c.lineWidth = SWB;
    c.stroke(PB);
    c.restore();
  }

  function layer(): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const c = document.createElement("canvas");
    c.width = W * dpr;
    c.height = H * dpr;
    const x = c.getContext("2d")!;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [c, x];
  }

  function build() {
    const hr = hero.getBoundingClientRect();
    W = Math.max(1, Math.floor(hr.width));
    H = Math.max(1, Math.floor(hr.height));
    dpr = Math.max(
      1,
      Math.min(2, window.devicePixelRatio || 1, Math.sqrt(3.6e6 / (W * H))),
    );
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const lr = lgEl!.getBoundingClientRect();
    lx = lr.left - hr.left;
    ly = lr.top - hr.top;
    lw = lr.width;
    lh = lr.height;
    K = lw / VB.width;
    cx = lx + lw / 2;
    cy = ly + lh / 2;

    const o = document.createElement("canvas");
    o.width = W;
    o.height = H;
    const c = o.getContext("2d")!;
    paintLogo(c, "#000");
    const x0 = Math.max(0, Math.floor(lx - 3));
    const x1 = Math.min(W, Math.ceil(lx + lw + 3));
    const y0 = Math.max(0, Math.floor(ly - 3));
    const y1 = Math.min(H, Math.ceil(ly + lh + 3));
    const d = c.getImageData(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
    const iw = d.width;
    const step = Math.max(2, Math.round(lh / 130));
    const pts: [number, number][] = [];
    for (let y = 0; y < d.height; y += step)
      for (let x = 0; x < iw; x += step)
        if (d.data[(y * iw + x) * 4 + 3] > 40) pts.push([x0 + x, y0 + y]);

    const gx = VB.width * K;
    const gy = VB.height * K;
    const gg = gx * gx + gy * gy;
    P = pts.map((q) => {
      const a = Math.random() * TAU;
      const k = 1.05 + Math.random() * 0.9;
      const tt = ((q[0] - lx) * gx + (q[1] - ly) * gy) / gg;
      return {
        x0: cx + Math.cos(a) * lw * 0.62 * k,
        y0: cy + Math.sin(a) * lh * 0.62 * k,
        tx: q[0],
        ty: q[1],
        d: Math.random() * 0.5,
        du: 1.6 + Math.random() * 0.4,
        b: Math.min(NB - 1, Math.max(0, Math.round(tt * (NB - 1)))),
        s: step,
      };
    });
    let lcx: CanvasRenderingContext2D;
    [logoC, lcx] = layer();
    paintLogo(lcx); // the finished logo, drawn once
    [revC, rc] = layer(); // where the sparks have landed
  }

  function finish() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    root.classList.add("logo-ready");
    cv.style.display = "none";
  }

  function tick() {
    const T = (performance.now() - T0) / 1000;
    ctx!.clearRect(0, 0, W, H);
    const rev = new Path2D();
    const dots = COL.map(() => new Path2D());
    let landed = false;
    let moving = false;
    for (const p of P) {
      const u = Math.min(1, Math.max(0, (T - p.d) / p.du));
      const e = 1 - Math.pow(1 - u, 3);
      const x = p.x0 + (p.tx - p.x0) * e;
      const y = p.y0 + (p.ty - p.y0) * e;
      if (u < 1) moving = true;
      if (e < 0.82) {
        const r = p.s * 0.5;
        const pa = dots[p.b];
        pa.moveTo(x + r, y);
        pa.arc(x, y, r, 0, TAU);
      } else {
        const k = Math.min(1, (e - 0.82) / 0.18);
        const r = p.s * (0.5 + 0.32 * k * k * (3 - 2 * k));
        rev.moveTo(x + r, y);
        rev.arc(x, y, r, 0, TAU);
        landed = true;
      }
    }
    if (landed) {
      // fill the landed area with the real, smooth logo (true edges, true gradient)
      rc.save();
      rc.setTransform(1, 0, 0, 1, 0, 0);
      rc.globalCompositeOperation = "source-over";
      rc.clearRect(0, 0, revC.width, revC.height);
      rc.restore();
      rc.fillStyle = "#000";
      rc.fill(rev);
      rc.save();
      rc.setTransform(1, 0, 0, 1, 0, 0);
      rc.globalCompositeOperation = "source-in";
      rc.drawImage(logoC, 0, 0);
      rc.restore();
      ctx!.drawImage(revC, 0, 0, W, H);
    }
    ctx!.globalAlpha = Math.min(1, T / 0.15);
    for (let i = 0; i < NB; i++) {
      ctx!.fillStyle = COL[i];
      ctx!.fill(dots[i]);
    }
    ctx!.globalAlpha = 1;
    if (!moving && T > 0.4) {
      finish();
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  const onResize = () => {
    if (done || !w0) return;
    if (Math.abs(hero.getBoundingClientRect().width - w0) > 2) finish();
  };
  addEventListener("resize", onResize);

  function init() {
    if (cancelled || started || root.classList.contains("nocvs") || !hero.offsetWidth) return;
    started = true;
    if (calm) {
      finish();
      return;
    }
    build();
    w0 = hero.getBoundingClientRect().width;
    T0 = performance.now();
    raf = requestAnimationFrame(tick);
  }

  let timer = 0;
  const fontsReady: Promise<unknown> = document.fonts?.ready ?? Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))])
    .then(() => requestAnimationFrame(init))
    .catch(() => {});
  timer = window.setTimeout(() => {
    if (!started && hero.offsetWidth) root.classList.add("nocvs");
  }, 3500);

  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    removeEventListener("resize", onResize);
  };
}
