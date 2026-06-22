import { resolveMedusaMediaUrl } from "@magazyn/core/medusa/media-url";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|svg)$/i;

const MEDUSA_MEDIA_PREFIXES = ["/static/", "/uploads/", "/products/"] as const;

/** Zdalny upload CMS (R2/CDN/Medusa) — nie lokalny asset z repo ani `/images/cms/`. */
export function isCmsMediaAssetUrl(value: unknown): boolean {
	if (typeof value !== "string" || !value.trim()) return false;
	const trimmed = value.trim();
	if (trimmed.startsWith("/images/cms/")) return false;
	if (trimmed.startsWith("/images/") || trimmed.startsWith("/icons/")) return false;
	if (trimmed.startsWith("data:")) return false;

	const pathOnly = trimmed.split("?")[0] ?? trimmed;
	if (!IMAGE_EXT.test(pathOnly)) return false;

	if (MEDUSA_MEDIA_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) return true;
	return /^https?:\/\//i.test(trimmed);
}

/**
 * Dev = prod: obrazy CMS tylko z mapy prebuild (`/images/cms/…`).
 * Bez sync mediów (`scripts/sync-cms-to-static.ts`) nowe uploady nie widać lokalnie.
 */
export function isLocalCmsDirectMediaEnabled(): boolean {
	return false;
}

/** Gate wyłączony tylko na localhost dev; prod i preview bez zmian. */
export function isRuntimeCmsMediaGateEnabled(_urlMap?: Readonly<Record<string, string>>): boolean {
	return !isLocalCmsDirectMediaEnabled();
}

export function lookupPublishedMediaUrl(
	url: string,
	urlMap: Readonly<Record<string, string>>,
): string | undefined {
	const trimmed = url.trim();
	if (trimmed.startsWith("/images/cms/")) return trimmed;
	if (urlMap[trimmed]) return urlMap[trimmed];

	// Try without query params (e.g. R2 URLs sometimes have cache-busting params).
	const withoutQuery = trimmed.split("?")[0] ?? trimmed;
	if (withoutQuery !== trimmed && urlMap[withoutQuery]) return urlMap[withoutQuery];

	const resolved = resolveMedusaMediaUrl(trimmed);
	if (resolved) {
		if (urlMap[resolved]) return urlMap[resolved];
		// Medusa backend uses /static/ path; R2 bucket may expose the same file under
		// /cms-uploads/. Try swapping the path segment so the map key matches.
		const altResolved = resolved.replace(/\/static\//, "/cms-uploads/");
		if (altResolved !== resolved && urlMap[altResolved]) return urlMap[altResolved];
	}

	return undefined;
}

export function shouldStripUnpublishedCmsMedia(
	url: string,
	urlMap: Readonly<Record<string, string>>,
): boolean {
	if (!isCmsMediaAssetUrl(url)) return false;
	return !lookupPublishedMediaUrl(url, urlMap);
}
