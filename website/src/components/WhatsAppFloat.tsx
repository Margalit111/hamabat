import { getContact } from "@/lib/content";
import { waHref } from "@/lib/format";

export default function WhatsAppFloat() {
  return (
    <aside aria-label="שיחה בוואטסאפ">
    <a
      className="wa"
      href={waHref(getContact().whatsapp)}
      target="_blank"
      rel="noopener"
      aria-label="שיחה בוואטסאפ"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
        <path
          d="M9.2 8.8c0 3 3 6 6 6l.9-1.5-2-1-.9.7c-.8-.4-1.5-1.1-1.900-1.900l.7-.9-1-2z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    </a>
    </aside>
  );
}
