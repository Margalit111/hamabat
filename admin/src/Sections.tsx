import type { Contact, Expert, Meeting } from "../shared/types";
import { Choice, ISO, Text } from "./ui";

export function ContactEditor({ value, onChange }: { value: Contact; onChange: (v: Contact) => void }) {
  const set = (p: Partial<Contact>) => onChange({ ...value, ...p });
  return (
    <div className="card">
      <h2>פרטי קשר</h2>
      <p className="muted">הפרטים האלה מופיעים בדף "יצירת קשר", בכפתור הוואטסאפ הצף ובקישורי ההרשמה.</p>
      <div className="grid2">
        <Text label="טלפון" type="tel" ltr value={value.phone} onChange={(v) => set({ phone: v })} />
        <Text label="וואטסאפ" type="tel" ltr value={value.whatsapp} onChange={(v) => set({ whatsapp: v })} />
      </div>
      <Text label="כתובת מייל" type="email" ltr value={value.email} onChange={(v) => set({ email: v })} hint="כאן מגיעות שאלות לצוות המומחיות" />
    </div>
  );
}

export function MeetingEditor({ value, onChange }: { value: Meeting; onChange: (v: Meeting) => void }) {
  const set = (p: Partial<Meeting>) => onChange({ ...value, ...p });
  const freeText = !!value.date && !ISO.test(value.date);
  return (
    <div className="card">
      <h2>מפגש הייעוץ הקרוב</h2>
      <p className="muted">מוצג בעמוד "ייעוץ", במסלול ב'. הוא נעלם אוטומטית יום אחרי התאריך שלו.</p>
      <Choice label="להציג באתר?" value={value.show ? "yes" : "no"} onChange={(v) => set({ show: v === "yes" })}
        options={[["yes", "כן, להציג את המפגש"], ["no", "לא, להסתיר (הפרטים נשמרים)"]]} />
      <div className="grid2">
        {freeText ? (
          <Text label="תאריך (טקסט חופשי)" value={value.date} onChange={(v) => set({ date: v })} hint="כדי לבחור תאריך מהלוח, מחקי את הטקסט" />
        ) : (
          <Text label="תאריך" type="date" value={value.date} onChange={(v) => set({ date: v })} />
        )}
        <Text label="שעה" value={value.time} onChange={(v) => set({ time: v })} hint="למשל 20:30" ltr />
      </div>
      <Text label="מיקום" value={value.place} onChange={(v) => set({ place: v })} hint="עיר, ואפשר לכתוב 'פרטים בהרשמה'" />
      <Text label="נושא המפגש" value={value.topic} onChange={(v) => set({ topic: v })} />
      <Text label="הערה קטנה (לא חובה)" value={value.note} onChange={(v) => set({ note: v })} hint="תופיע בראש הכרטיס. אם אין צורך, להשאיר ריק" />
    </div>
  );
}

export function TeamEditor({ value, onChange }: { value: Expert[]; onChange: (v: Expert[]) => void }) {
  const set = (i: number, p: Partial<Expert>) => onChange(value.map((x, k) => (k === i ? { ...x, ...p } : x)));
  const move = (i: number, d: number) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="card">
      <h2>צוות המומחיות</h2>
      <p className="muted">מופיעים בעמוד "ייעוץ". אפשר לשנות את הסדר בחצים.</p>
      {value.map((x, i) => (
        <div key={i} className="row" style={{ alignItems: "flex-end" }}>
          <div className="grow"><Text label={i === 0 ? "שם" : ""} value={x.name} onChange={(v) => set(i, { name: v })} /></div>
          <div className="grow" style={{ flexBasis: 320 }}><Text label={i === 0 ? "תפקיד" : ""} value={x.role} onChange={(v) => set(i, { role: v })} /></div>
          <div className="row" style={{ marginBottom: 14 }}>
            <button className="btn ghost sm" aria-label="הזזה למעלה" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button className="btn ghost sm" aria-label="הזזה למטה" onClick={() => move(i, 1)} disabled={i === value.length - 1}>↓</button>
            <button className="btn ghost sm" onClick={() => window.confirm(`למחוק את ${x.name || "האיש הזה"}?`) && onChange(value.filter((_, k) => k !== i))}>מחיקה</button>
          </div>
        </div>
      ))}
      <button className="btn" onClick={() => onChange([...value, { name: "", role: "" }])}>הוספת איש צוות</button>
    </div>
  );
}
