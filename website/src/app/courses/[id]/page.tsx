import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseView from "@/components/CourseView";
import JsonLd from "@/components/JsonLd";
import { getCourse, getCoursesWithPage } from "@/lib/content";
import { SITE_FULL_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ id: string }> };

// Every course gets its own static page at build time: /courses/<id>/
export function generateStaticParams() {
  return getCoursesWithPage().map((c) => ({ id: c.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = getCourse((await params).id);
  if (!course?.page) return {};
  const title = course.page.heroTitle || course.title;
  const description = course.page.lead || course.summary;
  const url = `/courses/${course.id}/`;
  const image = course.page.ad?.image;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      locale: "he_IL",
      ...(image ? { images: [{ url: `/${image}`, width: course.page.ad?.width, height: course.page.ad?.height }] } : {}),
    },
  };
}

export default async function CoursePage({ params }: Props) {
  const course = getCourse((await params).id);
  if (!course?.page) notFound();

  const url = absoluteUrl(`/courses/${course.id}/`);
  const listUrl = absoluteUrl(`/${course.group}/`);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.page.heroTitle || course.title,
          description: course.page.lead || course.summary,
          url,
          inLanguage: "he",
          provider: { "@type": "Organization", name: SITE_FULL_NAME, url: SITE_URL },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "דף הבית", item: absoluteUrl("/") },
            {
              "@type": "ListItem",
              position: 2,
              name: course.group === "professionals" ? "הכשרות לנשות מקצוע" : "סדנאות",
              item: listUrl,
            },
            { "@type": "ListItem", position: 3, name: course.title, item: url },
          ],
        }}
      />
      <CourseView course={course} />
    </>
  );
}
