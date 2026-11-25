import Link from "next/link";
import { INSTITUTE_URL, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { InstituteLogo } from "./icons";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="f-brand">
          <Link href="/" className="fhome">
            <strong>{SITE_NAME}</strong>
          </Link>
          <span>{SITE_TAGLINE}</span>
        </div>
        <div className="f-side">
          <div className="flinks" role="navigation" aria-label="מידע משפטי">
            <Link href="/accessibility/">הצהרת נגישות</Link>
            <Link href="/privacy/">מדיניות פרטיות</Link>
          </div>
          <a className="inst" href={INSTITUTE_URL} target="_blank" rel="noopener">
            <span>לאתר מכון המבט</span>
            <InstituteLogo className="flogo" label="לוגו מכון המבט" />
          </a>
        </div>
      </div>
    </footer>
  );
}
