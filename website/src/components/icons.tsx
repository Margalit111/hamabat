import type { FeatureIcon } from "@/lib/types";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Arrow used on "go" links and the breadcrumb (RTL: points left). */
export function Arrow() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth="2.2">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function FeatureGlyph({ name }: { name?: FeatureIcon }) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth="1.8">
      {name === "book" && <path d="M4 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4zM20 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z" />}
      {name === "compass" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m15.5 8.5-2 5-5 2 2-5z" />
        </>
      )}
      {name === "people" && (
        <>
          <circle cx="9" cy="8" r="3.2" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 14.6c2.7.1 5 1.8 5 4.9" />
        </>
      )}
      {(name === "heart" || !name) && (
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
      )}
    </svg>
  );
}

/** Big icon for the four home-page option cards. */
export function OptionIcon({ name }: { name: "book" | "heart" | "chat" | "phone" }) {
  return (
    <svg className="optic" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6" aria-hidden="true">
      {name === "book" && <path d="M4 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4zM20 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z" />}
      {name === "heart" && <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />}
      {name === "chat" && <path d="M4 5h16v11H9l-5 4z" />}
      {name === "phone" && (
        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
      )}
    </svg>
  );
}

export function Rise() {
  return (
    <div className="rise" aria-hidden="true">
      {[
        [44, "0s"],
        [66, "-.6s"],
        [88, "-1.2s"],
        [100, "-1.8s"],
        [76, "-2.4s"],
      ].map(([h, d]) => (
        <i key={d} style={{ "--h": `${h}px`, "--d": d } as React.CSSProperties} />
      ))}
    </div>
  );
}

export function Breath() {
  return (
    <div className="breath" aria-hidden="true" style={{ display: "grid", placeItems: "center" }}>
      <i />
      <i />
      <i />
      <b />
    </div>
  );
}

export function InstituteLogo({ className, label }: { className?: string; label: string }) {
  return (
    <svg className={className} viewBox="0 0 675 320" role="img" aria-label={label}>
      <use href="/logo-mabat.svg#mabat-logo" width="675" height="320" />
    </svg>
  );
}
