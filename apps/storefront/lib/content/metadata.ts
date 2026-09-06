import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";
import type { SeoMeta, SiteSettings } from "./types";

const DEFAULT_SITE_NAME = "Lumine Concept";

/**
 * Root layout dokleja do każdego tytułu szablon `%s | <nazwa sklepu>`.
 * Meta title z panelu (produkt, podstrona CMS) często zawiera już nazwę
 * sklepu — bez tej reguły `<title>` kończył się na
 * „… | Lumine Concept | Lumine Concept" (tak wyglądały PDP na produkcji).
 * Tytuł, który już zawiera nazwę sklepu, idzie jako `absolute` (bez szablonu).
 */
function resolveTitle(title: string, siteName: string): Metadata["title"] {
	const normalized = title.toLowerCase();
	return normalized.includes(siteName.toLowerCase()) ? { absolute: title } : title;
}

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
	const siteName = siteSettings?.title?.trim() || DEFAULT_SITE_NAME;
	const description =
		seo?.metaDescription ||
		fallbackDescription ||
		siteSettings?.description ||
		"";

	const ogTitle = seo?.ogTitle || seo?.metaTitle || fallbackTitle;
	const ogDescription =
		seo?.ogDescription || seo?.metaDescription || fallbackDescription || "";
	const ogImageUrl =
		seo?.ogImageUrl || fallbackImage || siteSettings?.defaultOgImageUrl;

	const canonical = seo?.canonicalUrl || (path ? `${SITE_URL}${path}` : undefined);

	const robots: Metadata["robots"] = {
		index: !seo?.noIndex,
		follow: !seo?.noFollow,
	};

	return {
		title: resolveTitle(title, siteName),
		description,
		// hreflang: na razie jednojęzyczny PL (przygotowanie pod i18n — przy
		// dodaniu locale rozszerzamy mapę `languages`).
		alternates: canonical
			? { canonical, languages: { "pl-PL": canonical } }
			: undefined,
		robots,
		openGraph: {
			title: ogTitle,
			description: ogDescription,
			type,
			siteName,
			locale: "pl_PL",
			...(canonical ? { url: canonical } : {}),
			...(publishedTime && type === "article" ? { publishedTime } : {}),
			...(ogImageUrl ? { images: [{ url: ogImageUrl, width: 1200, height: 630 }] } : {}),
		},
		twitter: {
			card: "summary_large_image",
			title: ogTitle,
			description: ogDescription,
			...(ogImageUrl ? { images: [ogImageUrl] } : {}),
		},
	};
}
