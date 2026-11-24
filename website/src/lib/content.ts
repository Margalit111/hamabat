import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Course, CourseGroup, SiteContent } from "./types";

/**
 * Single place that reads the site content.
 *
 * Today: content/site.json (committed to git).
 * Later: replace the body of `loadContent()` with a fetch to the admin API /
 * CMS export. Every page reads content ONLY through the functions below, so
 * nothing else in the project needs to change.
 */
let cache: SiteContent | null = null;

function loadContent(): SiteContent {
  if (cache) return cache;
  const file = path.join(process.cwd(), "content", "site.json");
  cache = JSON.parse(fs.readFileSync(file, "utf8")) as SiteContent;
  return cache;
}

export const getContact = () => loadContent().contact;
export const getExperts = () => loadContent().experts ?? [];

export const isVisible = (c: Course) => c.status !== "hidden";

export function getCourses(group?: CourseGroup): Course[] {
  return loadContent().courses.filter(
    (c) => isVisible(c) && (!group || c.group === group),
  );
}

/** Courses that have their own page on this site. */
export function getCoursesWithPage(): Course[] {
  return getCourses().filter((c) => c.page && !c.externalUrl);
}

export function getCourse(id: string): Course | undefined {
  return getCoursesWithPage().find((c) => c.id === id);
}

/** The upcoming meeting, or null when it is switched off / already past. */
export function getMeeting() {
  const m = loadContent().meeting;
  if (!m?.show) return null;
  if (m.hideAfter && new Date(`${m.hideAfter}T23:59:59`) < new Date()) {
    return null;
  }
  return m;
}
