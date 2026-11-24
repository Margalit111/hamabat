"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/site";

export default function Header({
  courseGroups,
}: {
  /** course id -> group, so a course page highlights its parent menu item */
  courseGroups: Record<string, string>;
}) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const clean = pathname.replace(/\/$/, "") || "/";
  let activeHref = clean;
  if (clean.startsWith("/courses/")) {
    const group = courseGroups[clean.split("/")[2]];
    activeHref = group ? `/${group}` : "/";
  }

  return (
    <header className={`top${open ? " open" : ""}`}>
      <div className="wrap">
        <span className="hd-spacer" aria-hidden="true" />
        <nav aria-label="ניווט ראשי">
          {NAV.map((n) => {
            const on = n.href === activeHref;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={on ? "active" : undefined}
                aria-current={on ? "page" : undefined}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="acts2">
          <button
            type="button"
            className="menu-btn"
            aria-label="תפריט"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
