import { useEffect, useState } from "react";
import { api, ApiError, type Commit } from "./api";
import { Banner } from "./ui";

export default function History({ onRestored, blocked }: { onRestored: () => void; blocked: boolean }) {
  const [commits, setCommits] = useState<Commit[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.history().then((r) => setCommits(r.commits)).catch((e) => setError(e instanceof ApiError ? e.message : "לא הצלחנו לטעון"));
  }, []);

  async function restore(c: Commit) {
    if (!window.confirm("לשחזר את הגרסה הזו? היא תיכנס כטיוטה, ותוכלי לבדוק אותה לפני שמפרסמים.")) return;
    try {
      await api.restore(c.sha);
      onRestored();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "השחזור נכשל");
    }
  }

  return (
    <div className="card">
      <h2>גרסאות קודמות</h2>
      <p className="muted">כל פרסום נשמר. שחזור מכניס את הגרסה כטיוטה, ורק אחרי פרסום הוא עולה לאתר.</p>
      {error && <Banner kind="err">{error}</Banner>}
      {blocked && <Banner kind="warn">יש שינויים שלא נשמרו. כדאי לשמור או לבטל אותם לפני שחזור.</Banner>}
      {!commits && !error && <p>טוענת...</p>}
      {commits?.map((c, i) => (
        <div key={c.sha} className="row between" style={{ borderTop: i ? "1px solid var(--line)" : 0, padding: "10px 0" }}>
          <div>
            <strong>{new Date(c.date).toLocaleString("he-IL", { dateStyle: "medium", timeStyle: "short" })}</strong>
            <div className="muted">{c.message}</div>
          </div>
          {i > 0 && <button className="btn ghost sm" disabled={blocked} onClick={() => restore(c)}>שחזור</button>}
          {i === 0 && <span className="tag open">הגרסה הנוכחית</span>}
        </div>
      ))}
    </div>
  );
}
