import type { MetadataRoute } from "next";
import { IS_PREVIEW, absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", ...(IS_PREVIEW ? { disallow: "/" } : { allow: "/" }) },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
