import type { Metadata } from "next";
import CourseGroupPage from "@/components/CourseGroupPage";

export const metadata: Metadata = {
  title: "סדנאות לשיקום גופני לפני ואחרי לידה",
  description: "סדנאות וקורסים לשיקום גופני לנשים לפני ואחרי לידה, עם ליווי צוות המומחיות של מבט.",
  alternates: { canonical: "/workshops/" },
};

export default function Page() {
  return (
    <CourseGroupPage
      group="workshops"
      eyebrow="סדנאות שיקום"
      title="סדנאות לשיקום גופני"
      highlight="לפני ואחרי לידה"
      lead="בחרי את הקורס המתאים לך."
    />
  );
}
