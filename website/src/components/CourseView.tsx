import Link from "next/link";
import { getContact } from "@/lib/content";
import { telHref, waHref } from "@/lib/format";
import type { Course } from "@/lib/types";
import { Arrow, FeatureGlyph } from "./icons";

const GROUP_BACK = {
  professionals: { href: "/professionals/", label: "חזרה להכשרות" },
  workshops: { href: "/workshops/", label: "חזרה לסדנאות" },
} as const;

const SOON = "יעודכן בקרוב";
const vars = (o: Record<string, string>) => o as React.CSSProperties;

function Poster({ ad, className }: { ad: NonNullable<NonNullable<Course["page"]>["ad"]>; className?: string }) {
  return (
    <>
      <a className="adlink" href={`/${ad.image}`} target="_blank" rel="noopener" aria-label="הגדלת הפרסומת">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={`adimg${className ? ` ${className}` : ""}`}
          src={`/${ad.image}`}
          alt={ad.alt ?? ""}
          width={ad.width}
          height={ad.height}
          loading="lazy"
        />
      </a>
      <small className="adcap">לחצי על הפרסומת להגדלה</small>
    </>
  );
}

export default function CourseView({ course: c }: { course: Course }) {
  const p = c.page!;
  const ct = getContact();
  const back = GROUP_BACK[c.group];
  const d = p.details ?? {};
  const hasAd = !!p.ad?.image;

  return (
    <main id="v-course">
      <section className="c-hero">
        <div className="bgfx">
          <div className="blob a" />
          <div className="blob b" />
        </div>
        <div className="page">
          <div className={`wrap c-grid${hasAd ? " has-ad" : ""}`}>
            <div className="c-text">
              <div className="c-head">
                <Link className="crumb" href={back.href}>
                  <Arrow /> {back.label}
                </Link>
                {p.brand &&
                  (p.brand.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="brandimg"
                      src={`/${p.brand.logo}`}
                      alt={`לוגו ${p.brand.name}`}
                      width={p.brand.width}
                      height={p.brand.height}
                    />
                  ) : (
                    <div className="brandslot" role="img" aria-label={`לוגו ${p.brand.name}`}>
                      <b>{p.brand.name}</b>
                    </div>
                  ))}
                <div className="eyebrow">{p.eyebrow}</div>
                <h1 className="c-title">{p.heroTitle || c.title}</h1>
              </div>
              <div className="c-rest">
                <p className="c-lead">{p.lead || c.summary}</p>
                <div className="cta">
                  {p.registerPhone ? (
                    <a className="btn" data-mag href={telHref(p.registerPhone)}>
                      להרשמה: {p.registerPhone}
                    </a>
                  ) : (
                    <a className="btn" data-mag href={waHref(ct.whatsapp)} target="_blank" rel="noopener">
                      להרשמה בוואטסאפ
                    </a>
                  )}
                  <a className="btn teal" data-mag href="#course-details">
                    לפרטי הקורס
                  </a>
                </div>
              </div>
            </div>
            {hasAd ? (
              <div className="c-poster rv">
                <Poster ad={p.ad!} />
              </div>
            ) : (
              <div className="c-art" aria-hidden="true">
                <div className="orb">
                  <i /><i /><i /><i /><b />
                </div>
                <span className="dot d1" />
                <span className="dot d2" />
                <span className="dot d3" />
              </div>
            )}
          </div>
        </div>
      </section>

      {p.features && p.features.length > 0 && (
        <section className="sec">
          <div className="page">
            <div className="wrap">
              <div className="head rv">
                <div className="eyebrow">מה מחכה לך</div>
                <h2>
                  {p.featuresTitle || "מה מחכה לך"} <span className="hl">{p.featuresHighlight}</span>
                </h2>
              </div>
              <div className="feats">
                {p.features.map((f, i) => (
                  <article className="feat rv" key={f.title} style={vars({ "--d": `${(i * 0.08).toFixed(2)}s` })}>
                    <div className="fi">
                      <FeatureGlyph name={f.icon} />
                    </div>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="sec band cband" id="course-details" style={vars({ "--prev": "var(--bg)" })}>
        <div className="page">
          <div className="wrap c-reg">
            <div className="rv">
              <div className="eyebrow">פרטים והרשמה</div>
              <h2>
                {p.detailsTitle || "מוכנה להתחיל?"} <span className="free">{p.detailsHighlight || "נשמח לראות אותך"}</span>
              </h2>
              <p className="c-lead" style={{ marginTop: 14 }}>
                {p.detailsLead || "פרטי הקורס המלאים יתעדכנו כאן. עד אז אפשר לפנות אלינו ולקבל את כל הפרטים."}
              </p>
            </div>
            <div className="route rv" style={vars({ "--d": ".1s" })}>
              <div className="kv">
                <div><small>מועד פתיחה</small><b>{d.start || SOON}</b></div>
                <div><small>מקום</small><b>{d.place || SOON}</b></div>
                <div><small>משך הקורס</small><b>{d.duration || SOON}</b></div>
                <div><small>עלות</small><b>{d.price || SOON}</b></div>
              </div>
              <div className="acts">
                {p.registerPhone && (
                  <a className="btn" href={telHref(p.registerPhone)}>
                    התקשרי: {p.registerPhone}
                  </a>
                )}
                <a className="btn" href={waHref(ct.whatsapp)} target="_blank" rel="noopener">
                  וואטסאפ {ct.whatsapp}
                </a>
                {!p.registerPhone && (
                  <a className="btn ghost" href={telHref(ct.phone)}>
                    טלפון {ct.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
