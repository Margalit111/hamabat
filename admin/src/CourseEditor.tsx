import { useState } from "react";
import type { Course, CourseFeature, CoursePage, FeatureIcon } from "../shared/types";
import { api, ApiError, fileToBase64, imageSize } from "./api";
import { Banner, Choice, Field, Text } from "./ui";

const ICONS: [FeatureIcon, string][] = [["book", "ספר"], ["compass", "מצפן"], ["heart", "לב"], ["people", "אנשים"]];

export default function CourseEditor({ course, onChange, onBack, siteUrl }: {
  course: Course; onChange: (c: Course) => void; onBack: () => void; siteUrl: string;
}) {
  const page: CoursePage = course.page ?? {};
  const set = (p: Partial<Course>) => onChange({ ...course, ...p });
  const setPage = (p: Partial<CoursePage>) => onChange({ ...course, page: { ...page, ...p } });
  const setDetails = (p: Partial<NonNullable<CoursePage["details"]>>) => setPage({ details: { ...page.details, ...p } });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [localPreview, setLocalPreview] = useState("");
  const features = page.features ?? [];
  const setFeature = (i: number, p: Partial<CourseFeature>) => setPage({ features: features.map((f, k) => (k === i ? { ...f, ...p } : f)) });
  const external = !!course.externalUrl;

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploadError("");
    if (!/\.(jpe?g|png)$/i.test(file.name)) return setUploadError("אפשר להעלות רק קבצי JPG או PNG");
    if (file.size > 4 * 1024 * 1024) return setUploadError("התמונה גדולה מדי. עד 4MB");
    setUploading(true);
    try {
      const [data, size] = await Promise.all([fileToBase64(file), imageSize(file)]);
      const { path } = await api.uploadImage(file.name, data);
      setLocalPreview(URL.createObjectURL(file));
      setPage({ ad: { label: `פרסומת: ${course.title}`, alt: "", image: path, width: size.width, height: size.height } });
    } catch (e) {
      setUploadError(e instanceof ApiError || e instanceof Error ? e.message : "ההעלאה נכשלה");
    } finally {
      setUploading(false);
    }
  }

  const posterSrc = localPreview || (page.ad?.image && siteUrl ? `${siteUrl}/${page.ad.image}` : "");

  return (
    <>
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 12 }}>→ חזרה לרשימת הקורסים</button>
      <div className="card">
        <h2>פרטי הקורס</h2>
        <Text label="שם הקורס" value={course.title} onChange={(v) => set({ title: v })} />
        <Text label="תקציר (משפט אחד)" value={course.summary} onChange={(v) => set({ summary: v })} hint="מופיע בכרטיס הקורס ברשימה" area />
        <div className="grid2">
          <Choice label="איפה מופיע" value={course.group} onChange={(v) => set({ group: v })} options={[["workshops", "סדנאות"], ["professionals", "הכשרות לנשות מקצוע"]]} />
          <Choice label="סטטוס" value={course.status} onChange={(v) => set({ status: v })} options={[["open", "פתוח להרשמה"], ["closed", "ההרשמה סגורה"], ["hidden", "מוסתר מהאתר"]]} />
        </div>
        <div className="grid2">
          <Text label="תאריך התחלה" type="date" value={course.startDate} onChange={(v) => set({ startDate: v || undefined })} hint="מוצג בעמוד הקורס, והקורסים מסודרים לפיו" />
          <Text label="להסתיר מהאתר אחרי" type="date" value={course.hideAfter} onChange={(v) => set({ hideAfter: v || undefined })} hint="לא חובה. אחרי התאריך הקורס נעלם לבד" />
        </div>
        <Text label="תווית קטנה בכרטיס" value={course.tag} onChange={(v) => set({ tag: v })} hint='למשל "קורס"' />
        {external && <Text label="כתובת האתר החיצוני" type="url" ltr value={course.externalUrl} onChange={(v) => set({ externalUrl: v })} hint="הכרטיס מקשר לשם, ואין עמוד נפרד באתר" />}
      </div>

      {!external && (
        <>
          <div className="card">
            <h2>עמוד הקורס</h2>
            <Text label="כותרת בראש העמוד" value={page.heroTitle} onChange={(v) => setPage({ heroTitle: v })} />
            <Text label="תיאור" value={page.lead} onChange={(v) => setPage({ lead: v })} area hint="שלושה עד ארבעה משפטים" />
            <Text label="שורה קטנה מעל הכותרת" value={page.eyebrow} onChange={(v) => setPage({ eyebrow: v })} hint='למשל "סדנאות שיקום"' />
            <Text label="טלפון להרשמה" type="tel" ltr value={page.registerPhone} onChange={(v) => setPage({ registerPhone: v || undefined })} hint="אם ריק, ההרשמה בוואטסאפ של המרכז" />
            <h3>פרטי ההרשמה</h3>
            <p className="muted">שדה שנשאר ריק יוצג באתר כ"יעודכן בקרוב".</p>
            <div className="grid2">
              <Text label="מקום" value={page.details?.place} onChange={(v) => setDetails({ place: v })} />
              <Text label="משך הקורס" value={page.details?.duration} onChange={(v) => setDetails({ duration: v })} hint='למשל "8 מפגשים"' />
              <Text label="עלות" value={page.details?.price} onChange={(v) => setDetails({ price: v })} hint='למשל "800 ש״ח"' />
              <Text label="מועד פתיחה (טקסט חופשי)" value={page.details?.start} onChange={(v) => setDetails({ start: v })} hint="לא חובה. אם ריק, יוצג תאריך ההתחלה מלמעלה" />
            </div>
          </div>

          <div className="card">
            <h2>פוסטר</h2>
            {posterSrc && <img className="poster" src={posterSrc} alt="" />}
            {page.ad?.image && (
              <Text label="תיאור הפוסטר (חובה)" value={page.ad.alt} onChange={(v) => setPage({ ad: { ...page.ad!, alt: v } })} hint="משפט אחד שמתאר מה רואים ומה כתוב בפוסטר. חשוב לנגישות" />
            )}
            <Field label={page.ad?.image ? "החלפת פוסטר" : "העלאת פוסטר"} hint="קובץ JPG או PNG, עד 4MB. התמונה נשמרת כטיוטה ועולה לאתר רק אחרי פרסום">
              <input type="file" accept="image/png,image/jpeg" disabled={uploading} onChange={(e) => upload(e.target.files?.[0])} />
            </Field>
            {uploading && <p>מעלה...</p>}
            {uploadError && <Banner kind="err">{uploadError}</Banner>}
            {page.ad?.image && <button className="btn ghost sm" onClick={() => { setLocalPreview(""); setPage({ ad: undefined }); }}>הסרת הפוסטר</button>}
          </div>

          <div className="card">
            <h2>יתרונות הקורס</h2>
            <p className="muted">עד ארבעה כרטיסים קטנים בעמוד הקורס. אפשר להשאיר ריק.</p>
            {features.length > 0 && (
              <div className="grid2">
                <Text label="כותרת האזור" value={page.featuresTitle} onChange={(v) => setPage({ featuresTitle: v })} hint='למשל "ארבעה דברים שמלווים אותך"' />
                <Text label="המילה המודגשת בסוף" value={page.featuresHighlight} onChange={(v) => setPage({ featuresHighlight: v })} hint='למשל "בקורס"' />
              </div>
            )}
            {features.map((f, i) => (
              <div key={i}>
                <hr />
                <div className="grid2">
                  <Text label="כותרת" value={f.title} onChange={(v) => setFeature(i, { title: v })} />
                  <Choice label="אייקון" value={f.icon} onChange={(v) => setFeature(i, { icon: v })} options={ICONS} />
                </div>
                <Text label="תיאור" value={f.text} onChange={(v) => setFeature(i, { text: v })} area />
                <button className="btn ghost sm" onClick={() => setPage({ features: features.filter((_, k) => k !== i) })}>הסרת היתרון</button>
              </div>
            ))}
            {features.length < 4 && (
              <div style={{ marginTop: 12 }}>
                <button className="btn ghost" onClick={() => setPage({ features: [...features, { icon: "heart", title: "", text: "" }] })}>הוספת יתרון</button>
              </div>
            )}
          </div>
        </>
      )}

      <div className="card">
        <h3>מתקדם</h3>
        <Text label="מזהה הקורס (באנגלית, בכתובת העמוד)" ltr value={course.id} onChange={(v) => set({ id: v.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
          hint="אותיות אנגליות קטנות, ספרות ומקפים. שינוי המזהה משנה את כתובת העמוד" />
      </div>
    </>
  );
}
