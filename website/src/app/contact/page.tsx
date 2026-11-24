import type { Metadata } from "next";
import CopyButton from "@/components/CopyButton";
import { getContact } from "@/lib/content";
import { mailHref, telHref, waHref } from "@/lib/format";

export const metadata: Metadata = {
  title: "יצירת קשר",
  description:
    "צוות מבט כאן בשבילך: דוא\"ל, וואטסאפ וטלפון. ניתן לשלוח שאלות ולקבל מענה בכל הפלטפורמות.",
  alternates: { canonical: "/contact/" },
};

const icon = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export default function ContactPage() {
  const c = getContact();
  const d = (s: number) => ({ "--d": `${s}s` }) as React.CSSProperties;

  return (
    <main id="v-contact">
      <section className="sec" id="contact-sec">
        <div className="page contact-page">
          <div className="wrap">
            <div className="head rv">
              <div className="eyebrow">אנחנו כאן בשבילכן</div>
              <h1>
                רוצה ללמוד, להתמקצע <span className="hl">או לקבל ייעוץ?</span>
              </h1>
              <p>
                צוות מבט כאן בשבילך, עם ידע מקצועי, ניסיון, הקשבה וליווי אישי. ניתן לשלוח שאלות ולקבל מענה בכל
                הפלטפורמות.
              </p>
            </div>
            <div className="tiles">
              <div className="tile rv">
                <div className="ic">
                  <svg viewBox="0 0 24 24" {...icon}>
                    <rect x="3" y="5" width="18" height="14" rx="3" />
                    <path d="m4 8 8 6 8-6" />
                  </svg>
                </div>
                <small>דוא&quot;ל</small>
                <div className="val">
                  <bdi className="n" style={{ fontSize: 21 }}>{c.email}</bdi>
                </div>
                <div className="acts">
                  <a className="btn sm" href={mailHref(c.email)}>שליחת מייל</a>
                  <CopyButton text={c.email} />
                </div>
              </div>
              <div className="tile rv" style={d(0.08)}>
                <div className="ic">
                  <svg viewBox="0 0 24 24" {...icon}>
                    <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
                  </svg>
                </div>
                <small>וואטסאפ</small>
                <div className="val"><bdi className="n">{c.whatsapp}</bdi></div>
                <div className="acts">
                  <a className="btn sm" href={waHref(c.whatsapp)} target="_blank" rel="noopener">פתיחת שיחה</a>
                  <CopyButton text={c.whatsapp} />
                </div>
              </div>
              <div className="tile rv" style={d(0.16)}>
                <div className="ic">
                  <svg viewBox="0 0 24 24" {...icon}>
                    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
                  </svg>
                </div>
                <small>טלפון</small>
                <div className="val"><bdi className="n">{c.phone}</bdi></div>
                <div className="acts">
                  <a className="btn sm" href={telHref(c.phone)}>חיוג</a>
                  <CopyButton text={c.phone} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
