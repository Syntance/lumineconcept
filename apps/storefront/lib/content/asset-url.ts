import { resolveMedusaMediaUrl } from "@magazyn/core/medusa/media-url";

/** Assety statyczne storefrontu w `public/` — nie prefiksuj backendem Medusa. */
const STOREFRONT_PUBLIC_PREFIXES = ["/images/", "/icons/"] as const;

export function isStorefrontPublicAssetPath(url: string): boolean {
	if (url.startsWith("/")) {
		return STOREFRONT_PUBLIC_PREFIXES.some((prefix) => url.startsWith(prefix));
	}
	try {
		const pathname = new URL(url).pathname;
		return STOREFRONT_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
	} catch {
		return false;
	}
}

/**
 * Rozwiązuje URL obrazu z CMS: `/images/…` zostaje lokalnie,
 * `/static/…` i URL-e Medusa/R2 → publiczny CDN lub backend.
 */
export function resolveCmsAssetUrl(url: string | null | undefined): string | undefined {
	if (!url?.trim()) return undefined;
	const trimmed = url.trim();

	if (isStorefrontPublicAssetPath(trimmed)) {
		const pathOnly = trimmed.startsWith("/") ? trimmed : new URL(trimmed).pathname;
		return pathOnly.split("?")[0] || pathOnly;
	}

	return resolveMedusaMediaUrl(trimmed) ?? undefined;
}

/** next/image `unoptimized` — tylko lokalne assety z `public/`. */
export function isCmsImageUnoptimized(url: string): boolean {
	if (isStorefrontPublicAssetPath(url)) return true;
	if (!url.startsWith("http")) return false;
	try {
		const h = new URL(url).hostname;
		return h === "localhost" || h === "127.0.0.1";
	} catch {
		return false;
	}
}
