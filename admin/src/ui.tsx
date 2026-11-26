import type { ReactNode } from "react";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="f">
      <label>
        <span>{label}</span>
        {children}
      </label>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function Text({ label, value, onChange, hint, type = "text", ltr, area }: {
  label: string; value?: string; onChange: (v: string) => void; hint?: string; type?: string; ltr?: boolean; area?: boolean;
}) {
  const common = { value: value ?? "", onChange: (e: { target: { value: string } }) => onChange(e.target.value), dir: ltr ? "ltr" : undefined };
  return <Field label={label} hint={hint}>{area ? <textarea {...common} /> : <input type={type} {...common} />}</Field>;
}

export function Choice<T extends string>({ label, value, onChange, options, hint }: {
  label: string; value: T; onChange: (v: T) => void; options: [T, string][]; hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </Field>
  );
}

export function Banner({ kind, children }: { kind: "err" | "ok" | "warn" | "info"; children: ReactNode }) {
  return <div className={`banner ${kind}`} role={kind === "err" ? "alert" : "status"}>{children}</div>;
}

export const ISO = /^\d{4}-\d{2}-\d{2}$/;
