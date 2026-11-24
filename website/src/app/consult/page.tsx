import type { Metadata } from "next";
import CopyButton from "@/components/CopyButton";
import { getContact, getExperts, getMeeting } from "@/lib/content";
import { mailHref } from "@/lib/format";

export const metadata: Metadata = {
  title: "ייעוץ ללא עלות עם צוות המומחיות",
  description:
    "ייעוץ מקצועי ללא עלות מצוות המומחיות של מבט: ייעוץ דיגיטלי במייל, ומפגשי ייעוץ פרונטליים לחברות בקורסים.",
  alternates: { canonical: "/consult/" },
};

const PETALS = [
  ["8%", "0s", undefined],
  ["24%", "-6s", ".7"],
  ["46%", "-11s", "1.2"],
  ["63%", "-3s", ".8"],
  ["80%", "-14s", undefined],
  ["93%", "-8s", ".6"],
] as const;

export default function ConsultPage() {
  const contact = getContact();
  const experts = getExperts();
  const meeting = getMeeting();

  return (
    <main id="v-consult">
      <section className="sec band" id="consult-band" style={{ "--prev": "var(--bg)" } as React.CSSProperties}>
        <div className="blob" style={{ background: "#E2C9F5", width: 440, height: 440, inset: "auto auto -140px -90px" }} />
        <div className="blob" style={{ background: "#B7EBEA", width: 400, height: 400, inset: "-110px -90px auto auto", animationDelay: "-8s" }} />
        <div className="petals" aria-hidden="true">
          {PETALS.map(([x, d, s]) => (
            <i key={x} style={{ "--x": x, "--d": d, ...(s ? { "--s": s } : {}) } as React.CSSProperties} />
          ))}
        </div>

        <div className="page" id="consult-a">
          <div className="wrap">
            <div className="head rv">
              <div className="eyebrow">ייעוץ עם צוות מומחיות</div>
              <h1>
                יש לך שאלה או התלבטות? ייעוץ <span className="free">ללא עלות</span>
              </h1>
              <p>
                אנחנו כאן בשבילך. ניתן לפנות אלינו לייעוץ מקצועי ולקבל מענה מצוות המומחיות שלנו בתחומי בריאות האם.
              </p>
            </div>
            <h2 className="route-label">מסלול א׳</h2>
            <div className="route rv">
              <div className="route-top">
                <div>
                  <h3>ייעוץ דיגיטלי ללא עלות</h3>
                  <p>שלחי את שאלתך במייל וקבלי מענה מהיר ומקצועי מצוות המומחיות שלנו.</p>
                </div>
                <div className="route-acts">
                  <a className="btn" data-mag href={mailHref(contact.email, "שאלה לצוות המומחיות של מבט")}>
                    שליחת שאלה במייל
                  </a>
                  <CopyButton text={contact.email}>העתקת הכתובת</CopyButton>
                </div>
              </div>
              <div className="experts" aria-label="צוות המומחיות שלנו">
                {experts.map((x) => (
                  <article className="exp" key={x.name}>
                    <div className="mono">{[...x.name.trim()][0]}</div>
                    <div>
                      <h4>{x.name}</h4>
                      <p>{x.role}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="page" id="consult-b">
          <div className="wrap">
            <h2 className="route-label">מסלול ב׳</h2>
            <div className="route rv">
              <div className="route-top">
                <div>
                  <h3>ייעוץ פרונטלי ללא עלות לחברות בקורסים</h3>
                  <p>
                    מפגשים מעצימים, אישיים ומפנקים פנים אל פנים עם צוות המומחיות. הזדמנות לקבל מענה מקצועי, לשאול,
                    להתייעץ וליהנות ממפגש אישי באווירה נעימה ומכילה.
                  </p>
                </div>
              </div>
              {meeting ? (
                <div className="ticket" aria-label="המפגש הקרוב">
                  <div className="t-head">
                    <span className="live">
                      <i />
                      המפגש הקרוב
                    </span>
                    <span className="demo">{meeting.note}</span>
                  </div>
                  <div className="t-cells">
                    <div>
                      <small>תאריך</small>
                      <b>{meeting.date}</b>
                    </div>
                    <div>
                      <small>שעה</small>
                      <b>{meeting.time}</b>
                    </div>
                    <div>
                      <small>מיקום</small>
                      <b>{meeting.place}</b>
                    </div>
                    <div>
                      <small>נושא המפגש</small>
                      <b>{meeting.topic}</b>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="demo" style={{ fontSize: 18 }}>
                  פרטי המפגש הקרוב יתעדכנו באתר.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
