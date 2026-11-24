import type { Metadata } from "next";
import CourseGroupPage from "@/components/CourseGroupPage";

export const metadata: Metadata = {
  title: "הכשרות לנשות מקצוע",
  description: "קורסים והכשרות מקצועיות לנשות מקצוע במרכז מבט. בחרי את ההכשרה שמעניינת אותך.",
  alternates: { canonical: "/professionals/" },
};

export default function Page() {
  return (
    <CourseGroupPage
      group="professionals"
      eyebrow="הכשרות לנשות מקצוע"
      title="קורסים"
      highlight="והכשרות"
      lead="בחרי את ההכשרה שמעניינת אותך."
    />
  );
}
