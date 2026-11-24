import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/Hero";
import JsonLd from "@/components/JsonLd";
import { Arrow, OptionIcon } from "@/components/icons";
import { getContact } from "@/lib/content";
import { SITE_DESCRIPTION, SITE_FULL_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE_FULL_NAME },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const OPTIONS = [
  { href: "/professionals/", icon: "book", art: "", title: "הכשרות לנשות מקצוע", text: "קורסים והכשרות מקצועיות" },
  { href: "/workshops/", icon: "heart", art: "teal", title: "סדנאות לשיקום גופני לפני ואחרי לידה", text: "סדנאות לנשים לפני ואחרי לידה" },
  { href: "/consult/", icon: "chat", art: "peach", title: "ייעוץ", text: "ייעוץ חינמי עם צוות מומחיות" },
  { href: "/contact/", icon: "phone", art: "teal", title: "יצירת קשר", text: "אנחנו כאן בשבילכן" },
] as const;

export default function HomePage() {
  const contact = getContact();
  return (
    <main id="v-home">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE_FULL_NAME,
          url: SITE_URL,
          description: SITE_DESCRIPTION,
          email: contact.email,
          telephone: contact.phone,
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            telephone: contact.phone,
            email: contact.email,
            availableLanguage: "he",
          },
        }}
      />
      <Hero />
      <section className="sec" id="home-options">
        <div className="page">
          <div className="wrap">
            <div className="head rv">
              <div className="eyebrow">בחרי מסלול</div>
              <h2>
                מה תרצי <span className="hl">למצוא כאן?</span>
              </h2>
            </div>
            <div className="opts">
              {OPTIONS.map((o, i) => (
                <Link
                  key={o.href}
                  className="card opt rv"
                  href={o.href}
                  style={{ "--d": `${(i * 0.08).toFixed(2)}s` } as React.CSSProperties}
                >
                  <div className={`art ${o.art}`}>
                    <OptionIcon name={o.icon} />
                  </div>
                  <div className="body">
                    <h3>{o.title}</h3>
                    <p>{o.text}</p>
                    <span className="go">
                      לכניסה <Arrow />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
