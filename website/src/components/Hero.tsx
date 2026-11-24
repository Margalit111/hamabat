import { HERO_LOGO_A, HERO_LOGO_B } from "@/lib/logo-paths";
import { SITE_DESCRIPTION } from "@/lib/site";
import HeroSparks from "./HeroSparks";

const SUB = ["המרכז", "לבריאות", "גוף", "נפש", "לאם", "ולתינוק"];
const LETTERS: [string, string][] = [
  ["מ", "100%"],
  ["ב", "50%"],
  ["ט", "0%"],
];

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="bgfx">
        <div className="blob a" />
        <div className="blob b" />
        <div className="blob c" />
        <div className="glow" id="glow" />
      </div>
      <HeroSparks />
      <div className="page">
        <div className="wrap">
          <div className="stage">
            <div className="txt">
              <div className="wordwrap">
                <h1 aria-label="מבט">
                  {/* fallback letters, used only if the canvas animation is unavailable */}
                  {LETTERS.map(([ch, p], k) => (
                    <span
                      key={ch}
                      className="lt"
                      style={{ "--p": p, "--k": k } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      {ch}
                    </span>
                  ))}
                  <svg
                    className="hlogo"
                    viewBox="48 38 632 281"
                    role="img"
                    aria-label="המבט – הסתכלות מעמיקה בבריאות טובה"
                  >
                    <defs>
                      <linearGradient id="hlg" gradientUnits="userSpaceOnUse" x1="48" y1="38" x2="680" y2="319">
                        <stop offset="0" stopColor="#5E2F85" />
                        <stop offset=".42" stopColor="#8A58BE" />
                        <stop offset=".78" stopColor="#3AA9B0" />
                        <stop offset="1" stopColor="#45C1C0" />
                      </linearGradient>
                    </defs>
                    <path id="hl-a" fill="url(#hlg)" stroke="url(#hlg)" strokeWidth="5" strokeLinejoin="round" fillRule="evenodd" d={HERO_LOGO_A} />
                    <path id="hl-b" fill="url(#hlg)" stroke="url(#hlg)" strokeWidth="1.2" strokeLinejoin="round" fillRule="evenodd" d={HERO_LOGO_B} />
                  </svg>
                </h1>
              </div>
              <p className="sub">
                {SUB.map((w, i) => (
                  <span key={w}>
                    <span className="mask">
                      <span style={{ "--d": `${(0.4 + i * 0.08).toFixed(2)}s` } as React.CSSProperties}>{w}</span>
                    </span>{" "}
                  </span>
                ))}
              </p>
            </div>
          </div>
          <p className="lead fade" style={{ "--d": ".95s" } as React.CSSProperties}>
            {SITE_DESCRIPTION}
          </p>
        </div>
      </div>
      <a className="scrollcue" href="#home-options" aria-label="לאפשרויות באתר">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
