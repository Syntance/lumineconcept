import type { SocialLinks } from "@/lib/content/types";

const FACEBOOK_PAGE_LABEL = "Lumine Concept";

const FACEBOOK_SLUG_LABELS: Record<string, string> = {
	lumineconcept: FACEBOOK_PAGE_LABEL,
};

const FACEBOOK_PROFILE_ID_LABELS: Record<string, string> = {
	"100063769314849": FACEBOOK_PAGE_LABEL,
};

function capitalizeWords(value: string): string {
	return value
		.split(/\s+/)
		.filter(Boolean)
		.map(
			(word) =>
				word.charAt(0).toLocaleUpperCase("pl-PL") + word.slice(1).toLocaleLowerCase("pl-PL"),
		)
		.join(" ");
}

function isFacebookHost(hostname: string): boolean {
	const host = hostname.toLowerCase();
	return host === "facebook.com" || host === "www.facebook.com" || host === "m.facebook.com";
}

/** Zamienia link wyszukiwania FB na kanoniczny profil (fallback z defaults/CMS). */
export function normalizeFacebookUrl(url: string, fallback?: string): string {
	const trimmed = url.trim();
	const fallbackTrimmed = fallback?.trim() ?? "";
	if (!trimmed) return fallbackTrimmed;

	try {
		const parsed = new URL(trimmed);
		if (!isFacebookHost(parsed.hostname)) return trimmed;

		if (parsed.pathname.startsWith("/search/")) {
			return fallbackTrimmed || trimmed;
		}

		if (parsed.pathname === "/profile.php") {
			const id = parsed.searchParams.get("id");
			if (id) {
				return `https://www.facebook.com/profile.php?id=${id}`;
			}
		}

		return trimmed;
	} catch {
		return fallbackTrimmed || trimmed;
	}
}

function humanizeFacebookSlug(slug: string): string {
	const labeled = FACEBOOK_SLUG_LABELS[slug.toLowerCase()];
	if (labeled) return labeled;

	if (/[._-]/.test(slug)) {
		return capitalizeWords(slug.replace(/[._]/g, " ").replace(/-/g, " "));
	}

	return slug;
}

/** Wyświetlana nazwa profilu Facebook (np. Lumine Concept). */
export function formatFacebookDisplayLabel(url: string): string {
	const trimmed = url.trim();
	if (!trimmed) return "Facebook";

	try {
		const parsed = new URL(trimmed);

		const searchQuery = parsed.searchParams.get("q");
		if (searchQuery?.trim()) {
			return capitalizeWords(searchQuery.trim());
		}

		if (parsed.pathname === "/profile.php") {
			const id = parsed.searchParams.get("id");
			if (id && FACEBOOK_PROFILE_ID_LABELS[id]) {
				return FACEBOOK_PROFILE_ID_LABELS[id];
			}
			return FACEBOOK_PAGE_LABEL;
		}

		const pathname = parsed.pathname.replace(/\/$/, "");
		const segments = pathname.split("/").filter(Boolean);
		const segment = segments.at(-1);

		if (!segment || segment === "search" || segment === "top") {
			return "Facebook";
		}

		return humanizeFacebookSlug(segment);
	} catch {
		return "Facebook";
	}
}

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
