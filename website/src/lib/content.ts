import "server-only";
import fs from "node:fs";
import path from "node:path";
import { isIsoDate, todayInIsrael } from "./dates";
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

export const isVisible = (c: Course) =>
  c.status !== "hidden" && !(c.hideAfter && todayInIsrael() > c.hideAfter);

/**
 * Courses with a `startDate` are ordered by it (soonest first). Courses without a date
 * keep their place in the list (e.g. a link to another site that always stays first).
 */
function orderByStartDate(list: Course[]): Course[] {
  const slots = list.flatMap((c, i) => (isIsoDate(c.startDate) ? [i] : []));
  const dated = slots.map((i) => list[i]).sort((a, b) => a.startDate!.localeCompare(b.startDate!));
  const out = [...list];
  slots.forEach((slot, k) => (out[slot] = dated[k]));
  return out;
}

export function getCourses(group?: CourseGroup): Course[] {
  return orderByStartDate(
    loadContent().courses.filter((c) => isVisible(c) && (!group || c.group === group)),
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
  // hidden from the day AFTER `hideAfter` (or after the meeting date itself); ISO dates compare as strings
  const lastDay = m.hideAfter || (isIsoDate(m.date) ? m.date : undefined);
  if (lastDay && todayInIsrael() > lastDay) return null;
  return m;
}
