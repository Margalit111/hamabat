export type CourseGroup = "professionals" | "workshops";
export type CourseStatus = "open" | "closed" | "hidden";
export type CourseArt = "institute" | "rise" | "breath";
export type FeatureIcon = "book" | "compass" | "heart" | "people";

export interface Contact {
  phone: string;
  whatsapp: string;
  email: string;
}

export interface Meeting {
  show: boolean;
  /** ISO date (YYYY-MM-DD), shown in Hebrew. Free text is still accepted and shown as is. */
  date?: string;
  time?: string;
  place?: string;
  topic?: string;
  /** ISO date (YYYY-MM-DD). Hidden from the day after. Defaults to `date` when that is an ISO date. */
  hideAfter?: string;
  note?: string;
}

export interface Expert {
  name: string;
  role: string;
}

export interface CourseFeature {
  icon: FeatureIcon;
  title: string;
  text: string;
}

export interface CourseDetails {
  /** Free text for the "opening date" box. When empty, `startDate` is shown instead. */
  start?: string;
  place?: string;
  duration?: string;
  price?: string;
}

export interface ImageRef {
  image: string;
  alt?: string;
  label?: string;
  width?: number;
  height?: number;
}

export interface CoursePage {
  eyebrow?: string;
  heroTitle?: string;
  lead?: string;
  registerPhone?: string;
  brand?: { name: string; logo?: string; width?: number; height?: number };
  ad?: ImageRef;
  featuresTitle?: string;
  featuresHighlight?: string;
  features?: CourseFeature[];
  details?: CourseDetails;
  detailsTitle?: string;
  detailsHighlight?: string;
  detailsLead?: string;
}

export interface Course {
  id: string;
  group: CourseGroup;
  status: CourseStatus;
  tag?: string;
  title: string;
  summary: string;
  art?: CourseArt;
  /** Course that lives on another website: the card links out, no local page. */
  externalUrl?: string;
  /** ISO date (YYYY-MM-DD) of the first lesson: shown on the course page, used for ordering and SEO. */
  startDate?: string;
  /** ISO date (YYYY-MM-DD). The course disappears from the site the day after. */
  hideAfter?: string;
  page?: CoursePage;
}

export interface SiteContent {
  contact: Contact;
  meeting: Meeting;
  experts: Expert[];
  courses: Course[];
}
