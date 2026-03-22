import type { Metadata } from "next";
import type { SeoMeta, SiteSettings } from "./types";

interface BuildMetadataOptions {
  seo?: SeoMeta;
  fallbackTitle: string;
  fallbackDescription?: string;
  fallbackImage?: string;
  siteSettings?: SiteSettings | null;
  path?: string;
  type?: "website" | "article";
  publishedTime?: string;
}

export function buildMetadata({
  seo,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
  siteSettings,
  path,
  type = "website",
  publishedTime,
}: BuildMetadataOptions): Metadata {
  const title = seo?.metaTitle || fallbackTitle;
  const description =
    seo?.metaDescription ||
    fallbackDescription ||
    siteSettings?.description ||
    "";

  const ogTitle = seo?.ogTitle || seo?.metaTitle || fallbackTitle;
  const ogDescription =
    seo?.ogDescription || seo?.metaDescription || fallbackDescription || "";
  const ogImageUrl =
    seo?.ogImage?.asset?.url ||
    fallbackImage ||
    siteSettings?.defaultOgImage?.asset?.url;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://lumine.syntance.dev";
  const canonical = seo?.canonicalUrl || (path ? `${siteUrl}${path}` : undefined);

  const robots: Metadata["robots"] = {
    index: !seo?.noIndex,
    follow: !seo?.noFollow,
  };

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type,
      ...(publishedTime && type === "article" ? { publishedTime } : {}),
      ...(ogImageUrl ? { images: [{ url: ogImageUrl }] } : {}),
    },
  };
}
