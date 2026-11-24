import Link from "next/link";
import type { Course } from "@/lib/types";
import { Arrow, Breath, InstituteLogo, Rise } from "./icons";

export default function CourseCard({ course: c, index }: { course: Course; index: number }) {
  const delay = index ? ({ "--d": `${(index * 0.1).toFixed(1)}s` } as React.CSSProperties) : undefined;

  if (c.externalUrl) {
    return (
      <a className="card inst rv" href={c.externalUrl} target="_blank" rel="noopener" style={delay}>
        <div className="art">
          <InstituteLogo label="לוגו מכון המבט – הסתכלות מעמיקה בבריאות טובה" />
        </div>
        <div className="body">
          <span className="tag">{c.tag}</span>
          <h3>{c.title}</h3>
          <p>{c.summary}</p>
          <span className="go">
            לאתר <Arrow />
          </span>
        </div>
      </a>
    );
  }

  const breath = c.art === "breath";
  return (
    <Link className="card rv" href={`/courses/${c.id}/`} style={delay}>
      <div className={`art ${breath ? "peach" : "teal"}`}>{breath ? <Breath /> : <Rise />}</div>
      <div className="body">
        {c.status === "closed" && (
          <>
            <span className="tag" style={{ background: "#FFE9E4", color: "#8a3b2b" }}>
              ההרשמה סגורה
            </span>{" "}
          </>
        )}
        <span className={`tag ${breath ? "t2" : "t1"}`}>{c.tag || "קורס"}</span>
        <h3>{c.title}</h3>
        <p>{c.summary}</p>
        <span className="go">
          לדף הקורס <Arrow />
        </span>
      </div>
    </Link>
  );
}
