import type { SocialLinks } from "@/lib/content/types";

/** Wyświetlana nazwa profilu IG z URL CMS (np. @lumine.concept). */
export function formatInstagramDisplayLabel(url: string): string {
	const trimmed = url.trim();
	if (!trimmed) return "Instagram";

	try {
		const pathname = new URL(trimmed).pathname.replace(/\/$/, "");
		const segment = pathname.split("/").filter(Boolean).pop();
		if (!segment) return "Instagram";
		return segment.startsWith("@") ? segment : `@${segment}`;
	} catch {
		return trimmed;
	}
}

/** sameAs dla JSON-LD — tylko ustawione linki z CMS. */
export function resolveSocialSameAs(social: SocialLinks): string[] {
	const urls = [social.instagram, social.facebook, social.tiktok]
		.map((url) => url?.trim())
		.filter((url): url is string => Boolean(url));
	return [...new Set(urls)];
}
