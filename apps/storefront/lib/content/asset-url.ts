import { resolveMedusaMediaUrl } from "@magazyn/core/medusa/media-url";
import { isCmsMediaAssetUrl } from "./cms-media-gate";

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

	// Opublikowane `/images/cms/…` i assety z repo — zawsze lokalnie.
	if (isStorefrontPublicAssetPath(trimmed)) {
		const pathOnly = trimmed.startsWith("/") ? trimmed : new URL(trimmed).pathname;
		return pathOnly.split("?")[0] || pathOnly;
	}

	// Nieopublikowane uploady CMS (R2, Medusa `/static/` itd.).
	if (isCmsMediaAssetUrl(trimmed)) {
		return undefined;
	}

	const resolved = resolveMedusaMediaUrl(trimmed);

	if (resolved && isCmsMediaAssetUrl(resolved)) {
		return undefined;
	}

	if (!resolved && trimmed) {
		console.warn("[Asset] Nie udało się zresolvować URL:", trimmed.substring(0, 100));
	}

	return resolved ?? undefined;
}

/**
 * Czy `next/image` ma pominąć optymalizację (`unoptimized`).
 *
 * Domyślnie OPTYMALIZUJEMY (downscale do realnego rozmiaru + AVIF/WebP + cache 1 rok),
 * bo to eliminuje wolne, wielomegabajtowe oryginały z R2 i daje natychmiastowe ładowanie.
 *
 * `unoptimized` zostaje tylko gdy optymalizator i tak by nie zadziałał:
 * - SVG (Next pomija, wymaga `dangerouslyAllowSVG`),
 * - hosty lokalne (optymalizator Vercela ich nie dosięgnie),
 * - względne ścieżki backendu Medusa bez pliku w `public/` (optymalizator je 404-uje).
 */
export function isCmsImageUnoptimized(url: string): boolean {
	if (!url) return false;

	const pathname = (url.split("?")[0] ?? "").toLowerCase();

	// SVG — serwuj surowo (brak optymalizacji bez dangerouslyAllowSVG).
	if (pathname.endsWith(".svg")) return true;

	if (url.startsWith("http")) {
		try {
			const host = new URL(url).hostname;
			if (host === "localhost" || host === "127.0.0.1") return true;
		} catch {
			return true;
		}
		// R2 / CDN / Medusa prod → przepuszczamy przez Next/Vercel Image Optimization.
		return false;
	}

	// Ścieżki serwowane przez backend (brak pliku w `public/`) — nie da się zoptymalizować.
	if (
		pathname.startsWith("/static/") ||
		pathname.startsWith("/uploads/") ||
		pathname.startsWith("/products/") ||
		pathname.includes("/cms-uploads/")
	) {
		return true;
	}

	// `/images/**`, `/icons/**` są w `public/` → optymalizuj (poza SVG obsłużonym wyżej).
	return false;
}
