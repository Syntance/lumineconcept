import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils";

/** Bez trim() env z końcowym newline psuje linię Sitemap: w robots.txt. */
function siteOrigin(): string {
  return SITE_URL.trim().replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/checkout", "/checkout/potwierdzenie", "/koszyk", "/api/"],
      },
    ],
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
