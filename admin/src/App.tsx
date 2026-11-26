import { useCallback, useEffect, useState } from "react";
import type { Course, CourseStatus, SiteContent } from "../shared/types";
import { api, ApiError, type Links } from "./api";
import CourseEditor from "./CourseEditor";
import Courses from "./Courses";
import History from "./History";
import Login from "./Login";
import { ContactEditor, MeetingEditor, TeamEditor } from "./Sections";
import { Banner } from "./ui";

type TabName = "home" | "courses" | "meeting" | "team" | "contact" | "history";
type View = { name: TabName } | { name: "course"; index: number };

const TABS: [TabName, string][] = [["home", "בית"], ["courses", "קורסים"], ["meeting", "מפגש ייעוץ"], ["team", "צוות"], ["contact", "פרטי קשר"], ["history", "גרסאות"]];

const newCourse = (n: number): Course => ({
  id: `new-course-${n}`, group: "workshops", status: "open", tag: "קורס", title: "", summary: "", art: "rise",
  page: { eyebrow: "סדנאות שיקום", features: [], details: { start: "", place: "", duration: "", price: "" } },
});

export default function App() {
  const [auth, setAuth] = useState<"loading" | "in" | "out">("loading");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [sha, setSha] = useState("");
  const [dirty, setDirty] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [links, setLinks] = useState<Links>({ siteUrl: "", previewUrl: "" });
  const [view, setView] = useState<View>({ name: "home" });
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "warn"; text: string; list?: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.content();
      setContent(r.content); setSha(r.sha); setHasDraft(r.hasChanges); setLinks({ siteUrl: r.siteUrl, previewUrl: r.previewUrl }); setDirty(false);
      setAuth("in");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setAuth("out");
      else { setAuth("in"); setMsg({ kind: "err", text: e instanceof Error ? e.message : "לא הצלחנו לטעון את התוכן" }); }
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // warn before leaving the page with unsaved edits
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const update = (fn: (c: SiteContent) => void) => {
    setContent((prev) => { const next = structuredClone(prev!); fn(next); return next; });
    setDirty(true); setMsg(null);
  };

  async function run<T>(fn: () => Promise<T>, okText?: string): Promise<T | undefined> {
    setBusy(true); setMsg(null);
    try {
      const r = await fn();
      if (okText) setMsg({ kind: "ok", text: okText });
      return r;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { setAuth("out"); return; }
      if (e instanceof ApiError) setMsg({ kind: "err", text: e.message, list: e.errors });
      else setMsg({ kind: "err", text: "אירעה שגיאה. אפשר לנסות שוב" });
    } finally { setBusy(false); }
  }

  const save = () => run(async () => {
    const r = await api.save(content!, sha);
    setSha(r.sha); setDirty(false); setHasDraft(true);
    if (r.warnings.length) setMsg({ kind: "warn", text: "נשמר כטיוטה, אבל שימי לב:", list: r.warnings });
  }, "נשמר כטיוטה. עכשיו אפשר לצפות בתצוגה מקדימה ולפרסם מהלשונית \"בית\".");

  const publish = () => {
    if (!window.confirm("לפרסם את השינויים באתר החי?")) return;
    return run(async () => { await api.publish(); await load(); }, "השינויים פורסמו. האתר יתעדכן בעוד כדקה או שתיים.");
  };
  const discard = () => {
    if (!window.confirm("לבטל את כל השינויים שעוד לא פורסמו? אי אפשר לשחזר אותם.")) return;
    return run(async () => { await api.discard(); await load(); }, "השינויים בוטלו.");
  };

  if (auth === "loading") return <div className="wrap"><p>טוענת...</p></div>;
  if (auth === "out") return <Login onDone={() => { setAuth("loading"); void load(); }} />;
  if (!content) return <div className="wrap"><main><Banner kind="err">{msg?.text ?? "לא הצלחנו לטעון"}</Banner><button className="btn" onClick={() => void load()}>ניסיון חוזר</button></main></div>;

  // edits stay in memory while moving between tabs; they are written only by "שמירה כטיוטה"
  const go = (v: View) => { setView(v); setMsg(null); };
  const courseTab: TabName = view.name === "course" ? "courses" : view.name;

  return (
    <>
      <header className="top">
        <div className="wrap">
          <strong>מבט · ניהול</strong>
          <nav aria-label="ניווט ראשי">
            {TABS.map(([n, t]) => <button key={n} className={courseTab === n ? "on" : ""} aria-current={courseTab === n ? "page" : undefined} onClick={() => go({ name: n })}>{t}</button>)}
          </nav>
          <button className="btn ghost sm" onClick={async () => { await api.logout(); setView({ name: "home" }); setAuth("out"); }}>יציאה</button>
        </div>
      </header>

      <div className="wrap">
        <main>
          {msg && (
            <Banner kind={msg.kind}>
              {msg.text}
              {msg.list && <ul>{msg.list.map((x) => <li key={x}>{x}</li>)}</ul>}
              {msg.text.includes("שונה בינתיים") && <div><button className="btn sm" onClick={() => void load()}>טעינה מחדש</button></div>}
            </Banner>
          )}

          {view.name === "home" && (
            <>
              <h1>שלום 👋</h1>
              {dirty && <Banner kind="warn">יש שינויים שעוד לא נשמרו. כדי להמשיך, צריך ללחוץ על "שמירה כטיוטה" בתחתית המסך.</Banner>}
              {hasDraft ? (
                <div className="card">
                  <h2>יש שינויים שמחכים לפרסום</h2>
                  <p>השינויים נשמרו כטיוטה, ועדיין לא עלו לאתר. אפשר לבדוק אותם בתצוגה מקדימה, ואז לפרסם.</p>
                  <div className="row">
                    {links.previewUrl && <a className="btn ghost" href={links.previewUrl} target="_blank" rel="noopener">תצוגה מקדימה</a>}
                    <button className="btn" disabled={busy || dirty} onClick={publish}>פרסום באתר</button>
                    <button className="btn ghost" disabled={busy} onClick={discard}>ביטול השינויים</button>
                  </div>
                  {links.previewUrl && <p className="muted">התצוגה המקדימה נבנית אחרי כל שמירה, וייתכן שייקח עד שתי דקות עד שהשינוי יופיע בה.</p>}
                </div>
              ) : (
                <div className="card">
                  <h2>האתר מעודכן</h2>
                  <p>אין שינויים שמחכים לפרסום.</p>
                  {links.siteUrl && <a className="btn ghost" href={links.siteUrl} target="_blank" rel="noopener">פתיחת האתר</a>}
                </div>
              )}
              <div className="card">
                <h2>איך מעדכנים את האתר</h2>
                <ol className="steps">
                  <li><div><strong>עורכים</strong> בלשוניות למעלה: קורסים, מפגש ייעוץ, צוות או פרטי קשר.</div></li>
                  <li><div><strong>שומרים כטיוטה</strong> בכפתור שמופיע בתחתית המסך. האתר עדיין לא משתנה.</div></li>
                  <li><div><strong>בודקים</strong> בתצוגה מקדימה, גם בטלפון.</div></li>
                  <li><div><strong>מפרסמים.</strong> האתר מתעדכן תוך דקה או שתיים.</div></li>
                </ol>
              </div>
            </>
          )}

          {view.name === "courses" && (
            <Courses courses={content.courses}
              onEdit={(i) => go({ name: "course", index: i })}
              onNew={() => { update((c) => { c.courses.push(newCourse(c.courses.length + 1)); }); setView({ name: "course", index: content.courses.length }); }}
              onDuplicate={(i) => update((c) => { const copy = structuredClone(c.courses[i]); copy.id = `${copy.id}-copy`; copy.title = `${copy.title} (עותק)`; c.courses.splice(i + 1, 0, copy); })}
              onStatus={(i, s: CourseStatus) => update((c) => { c.courses[i].status = s; })} />
          )}
          {view.name === "course" && content.courses[view.index] && (
            <CourseEditor course={content.courses[view.index]} siteUrl={links.siteUrl}
              onChange={(co) => update((c) => { c.courses[view.index] = co; })} onBack={() => setView({ name: "courses" })} />
          )}
          {view.name === "meeting" && <MeetingEditor value={content.meeting} onChange={(v) => update((c) => { c.meeting = v; })} />}
          {view.name === "team" && <TeamEditor value={content.experts} onChange={(v) => update((c) => { c.experts = v; })} />}
          {view.name === "contact" && <ContactEditor value={content.contact} onChange={(v) => update((c) => { c.contact = v; })} />}
          {view.name === "history" && <History blocked={dirty} onRestored={() => { void load(); setMsg({ kind: "ok", text: "הגרסה שוחזרה כטיוטה. אפשר לבדוק אותה ולפרסם מהלשונית \"בית\"." }); setView({ name: "home" }); }} />}
        </main>
      </div>

      {dirty && (
        <div className="savebar">
          <div className="wrap row between">
            <span>יש שינויים שלא נשמרו</span>
            <span className="row">
              <button className="btn ghost" disabled={busy} onClick={() => { void load(); setView(view.name === "course" ? { name: "courses" } : view); }}>ביטול</button>
              <button className="btn" disabled={busy} onClick={save}>{busy ? "שומרת..." : "שמירה כטיוטה"}</button>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
