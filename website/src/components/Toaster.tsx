"use client";

import { useEffect, useRef, useState } from "react";
import { TOAST_EVENT } from "@/lib/toast";

export default function Toaster() {
  const [text, setText] = useState("");
  const [on, setOn] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    const handler = (e: Event) => {
      setText((e as CustomEvent<string>).detail);
      setOn(true);
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setOn(false), 2400);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  return (
    <div className={`toast${on ? " on" : ""}`} role="status" aria-live="polite">
      {text}
    </div>
  );
}
