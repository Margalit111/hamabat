import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import RevealObserver from "@/components/RevealObserver";
import SiteEffects from "@/components/SiteEffects";
import Toaster from "@/components/Toaster";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getCoursesWithPage } from "@/lib/content";
import { SITE_DESCRIPTION, SITE_FULL_NAME, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_FULL_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: SITE_FULL_NAME,
    title: SITE_FULL_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFCFE",
};

// Runs before first paint: marks the page as JS-enabled (reveal animations
// only hide content when this ran) and keeps --vh stable (never trusts a
// height that grows with the content).
const bootScript = `document.documentElement.classList.add('js');try{if(sessionStorage.getItem('mabat:hero-played')==='1')document.documentElement.classList.add('logo-ready','hero-seen')}catch(e){}(function(){var r=document.documentElement;function s(){var sh=Math.max(screen.height||0,screen.availHeight||0)||900,h=Math.max(440,Math.min(window.innerHeight||sh,sh));r.style.setProperty('--vh',h+'px')}s();addEventListener('resize',function(){requestAnimationFrame(s)})})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const courseGroups = Object.fromEntries(getCoursesWithPage().map((c) => [c.id, c.group]));

  return (
    <html lang="he" dir="rtl" className="v-spark" suppressHydrationWarning>
      <head>
        {/* start downloading the Hebrew fonts right away (they decide when the headline shows) */}
        <link rel="preload" href="/fonts/rubik-hebrew-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/assistant-hebrew-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a className="skip" href="#content">
          דילוג לתוכן
        </a>
        <Header courseGroups={courseGroups} />
        <div id="content">{children}</div>
        <Footer />
        <WhatsAppFloat />
        <Toaster />
        <RevealObserver />
        <SiteEffects />
      </body>
    </html>
  );
}
