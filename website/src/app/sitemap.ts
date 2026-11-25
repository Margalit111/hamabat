import type { MetadataRoute } from "next";
import { getCoursesWithPage } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ["/", "/professionals/", "/workshops/", "/consult/", "/contact/", "/accessibility/", "/privacy/"];
  return [
    ...pages.map((p) => ({
      url: absoluteUrl(p),
      lastModified: now,
      priority: p === "/" ? 1 : 0.8,
    })),
    ...getCoursesWithPage().map((c) => ({
      url: absoluteUrl(`/courses/${c.id}/`),
      lastModified: now,
      priority: 0.7,
    })),
  ];
}
