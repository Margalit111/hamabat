import type { Course, CourseStatus } from "../shared/types";
import { ISO } from "./ui";

const STATUS: Record<CourseStatus, string> = { open: "פתוח להרשמה", closed: "ההרשמה סגורה", hidden: "מוסתר מהאתר" };
const GROUP = { professionals: "הכשרות לנשות מקצוע", workshops: "סדנאות" } as const;

export default function Courses({ courses, onEdit, onNew, onDuplicate, onStatus }: {
  courses: Course[]; onEdit: (i: number) => void; onNew: () => void; onDuplicate: (i: number) => void; onStatus: (i: number, s: CourseStatus) => void;
}) {
  return (
    <>
      <div className="row between" style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>קורסים</h1>
        <button className="btn" onClick={onNew}>קורס חדש</button>
      </div>
      {courses.map((c, i) => (
        <div className="card" key={`${c.id}-${i}`}>
          <div className="row between">
            <div className="grow">
              <h3 style={{ margin: 0 }}>{c.title || "(ללא שם)"}</h3>
              <div className="muted">
                {GROUP[c.group]}
                {c.startDate && ISO.test(c.startDate) && <> · מתחיל ב־{new Date(`${c.startDate}T12:00:00`).toLocaleDateString("he-IL")}</>}
                {c.externalUrl && <> · קישור לאתר אחר</>}
              </div>
            </div>
            <span className={`tag ${c.status}`}>{STATUS[c.status]}</span>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn sm" onClick={() => onEdit(i)}>עריכה</button>
            <button className="btn ghost sm" onClick={() => onDuplicate(i)}>שכפול</button>
            {c.status === "hidden" ? (
              <button className="btn ghost sm" onClick={() => onStatus(i, "open")}>הצגה באתר</button>
            ) : (
              <>
                <button className="btn ghost sm" onClick={() => onStatus(i, c.status === "open" ? "closed" : "open")}>
                  {c.status === "open" ? "סגירת הרשמה" : "פתיחת הרשמה"}
                </button>
                <button className="btn ghost sm" onClick={() => onStatus(i, "hidden")}>הסתרה מהאתר</button>
              </>
            )}
          </div>
        </div>
      ))}
      {!courses.length && <p className="muted">אין עדיין קורסים.</p>}
    </>
  );
}
