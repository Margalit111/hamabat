import Link from "next/link";
import { getCourses } from "@/lib/content";
import type { CourseGroup } from "@/lib/types";
import CourseCard from "./CourseCard";
import { Arrow } from "./icons";

/** Shared layout of the two course listing pages. */
export default function CourseGroupPage({
  group,
  eyebrow,
  title,
  highlight,
  lead,
}: {
  group: CourseGroup;
  eyebrow: string;
  title: string;
  highlight: string;
  lead: string;
}) {
  const courses = getCourses(group);
  return (
    <main id={`v-${group}`}>
      <section className="sec">
        <div className="page">
          <div className="wrap">
            <Link className="crumb" href="/">
              <Arrow /> לדף הבית
            </Link>
            <div className="head rv">
              <div className="eyebrow">{eyebrow}</div>
              <h1>
                {title} <span className="hl">{highlight}</span>
              </h1>
              <p>{lead}</p>
            </div>
            <div className={`cards two${courses.length === 2 ? " wide" : ""}`}>
              {courses.map((c, i) => (
                <CourseCard key={c.id} course={c} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
