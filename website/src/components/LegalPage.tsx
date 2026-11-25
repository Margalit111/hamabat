import Link from "next/link";
import { Arrow } from "./icons";

/** Shared layout of the accessibility statement and the privacy policy. */
export default function LegalPage({
  id,
  title,
  highlight,
  children,
}: {
  id: string;
  title: string;
  highlight: string;
  children: React.ReactNode;
}) {
  return (
    <main id={id}>
      <section className="sec">
        <div className="page legal-page">
          <div className="wrap">
            <Link className="crumb" href="/">
              <Arrow /> לדף הבית
            </Link>
            <div className="head rv in">
              <div className="eyebrow">מידע לגולשים</div>
              <h1>
                {title} <span className="hl">{highlight}</span>
              </h1>
            </div>
            <article className="legal rv in">{children}</article>
          </div>
        </div>
      </section>
    </main>
  );
}
