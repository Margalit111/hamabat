import Link from "next/link";

export const metadata = { title: "העמוד לא נמצא", robots: { index: false } };

export default function NotFound() {
  return (
    <main>
      <section className="sec">
        <div className="page">
          <div className="wrap" style={{ textAlign: "center" }}>
            <div className="head rv in" style={{ marginInline: "auto" }}>
              <div className="eyebrow">404</div>
              <h1>העמוד שחיפשת <span className="hl">לא נמצא</span></h1>
              <p>ייתכן שהקורס הסתיים או שהכתובת השתנתה.</p>
            </div>
            <Link className="btn" href="/">לדף הבית</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
