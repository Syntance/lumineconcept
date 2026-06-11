import { mediaCdnOrigin, resolveMedusaMediaUrl } from "@magazyn/core/medusa/media-url";

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

	const resolved = resolveMedusaMediaUrl(trimmed);
	
	// Debug: jeśli URL jest, ale nie udało się zresolvować
	if (!resolved && trimmed) {
		console.warn("[Asset] Nie udało się zresolvować URL:", trimmed.substring(0, 100));
	}
	
	return resolved ?? undefined;
}

function isMediaCdnOrigin(origin: string): boolean {
	const cdn = mediaCdnOrigin();
	if (!cdn) return false;
	try {
		return new URL(origin).origin === new URL(cdn).origin;
	} catch {
		return false;
	}
}

/** next/image `unoptimized` — lokalne assety, R2/CDN CMS i Medusa (bez remotePatterns przy buildzie). */
export function isCmsImageUnoptimized(url: string): boolean {
	if (isStorefrontPublicAssetPath(url)) return true;
	if (url.startsWith("/static/") || url.startsWith("/uploads/")) return true;
	if (url.includes("/cms-uploads/")) return true;
	if (!url.startsWith("http")) return false;
	try {
		const parsed = new URL(url);
		const host = parsed.hostname;
		if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".r2.dev")) {
			return true;
		}
		return isMediaCdnOrigin(parsed.origin);
	} catch {
		return false;
	}
}
