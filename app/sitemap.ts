import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ["", "/studio", "/docs", "/privacy", "/terms", "/refunds"];
  return pages.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
