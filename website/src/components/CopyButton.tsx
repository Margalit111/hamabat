"use client";

import { say } from "@/lib/toast";

export default function CopyButton({
  text,
  children = "העתקה",
  className = "btn ghost sm",
}: {
  text: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          say("הועתק");
        } catch {
          say(text);
        }
      }}
    >
      {children}
    </button>
  );
}
