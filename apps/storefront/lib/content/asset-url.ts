import { resolveMedusaMediaUrl } from "@magazyn/core/medusa/media-url";
import { isCmsMediaAssetUrl, isLocalCmsDirectMediaEnabled } from "./cms-media-gate";

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
 * Podgląd w panelu Magazyn — pełny URL (R2/CDN), bez media gate storefrontu.
 * Storefront używa `resolveCmsAssetUrl` / overlay; admin musi widzieć upload od razu.
 */
export function resolveCmsAdminPreviewUrl(url: string | null | undefined): string | undefined {
	if (!url?.trim()) return undefined;
	const trimmed = url.trim();

	if (isStorefrontPublicAssetPath(trimmed)) {
		const pathOnly = trimmed.startsWith("/") ? trimmed : new URL(trimmed).pathname;
		return pathOnly.split("?")[0] || pathOnly;
	}

	return resolveMedusaMediaUrl(trimmed) ?? trimmed;
}

/**
 * Rozwiązuje URL obrazu na storefront: `/images/…` zostaje lokalnie,
 * nieopublikowane uploady CMS (R2, Medusa) → undefined (media gate).
 */
export function resolveCmsAssetUrl(url: string | null | undefined): string | undefined {
	if (!url?.trim()) return undefined;
	const trimmed = url.trim();

	// Opublikowane `/images/cms/…` i assety z repo — zawsze lokalnie.
	if (isStorefrontPublicAssetPath(trimmed)) {
		const pathOnly = trimmed.startsWith("/") ? trimmed : new URL(trimmed).pathname;
		return pathOnly.split("?")[0] || pathOnly;
	}

	// Nieopublikowane uploady CMS (R2, Medusa `/static/` itd.) — prod: gate; dev: bezpośrednio.
	if (isCmsMediaAssetUrl(trimmed)) {
		if (isLocalCmsDirectMediaEnabled()) {
			return resolveMedusaMediaUrl(trimmed) ?? trimmed;
		}
		return undefined;
	}

	const resolved = resolveMedusaMediaUrl(trimmed);

	if (resolved && isCmsMediaAssetUrl(resolved)) {
		if (isLocalCmsDirectMediaEnabled()) return resolved;
		return undefined;
	}

	if (!resolved && trimmed) {
		console.warn("[Asset] Nie udało się zresolvować URL:", trimmed.substring(0, 100));
	}

	return resolved ?? undefined;
}

/**
 * Resolver dla obrazów hero: najpierw lokalna kopia z prebuildu (`/images/cms/…`),
 * a jeśli jej nie ma — bezpośrednio z R2/CDN. Domena R2 jest już w `remotePatterns`
 * i CSP `img-src`, więc fallback jest bezpieczny.
 *
 * Dzięki temu zmiana hero w CMS jest widoczna natychmiast po zapisie + revalidate,
 * bez konieczności czekania na prebuild sync.
 */
export function resolveCmsHeroImageUrl(url: string | null | undefined): string | undefined {
	if (!url?.trim()) return undefined;

	// Lokalna kopia z prebuildu — priorytet.
	const local = resolveCmsAssetUrl(url);
	if (local) return local;

	// Fallback: R2 lub CDN bezpośrednio.
	const trimmed = url.trim();
	if (!isCmsMediaAssetUrl(trimmed)) return undefined;

	// Medusa może wymagać rewrite URL-a (/static/ → pełny adres backendu).
	const resolved = resolveMedusaMediaUrl(trimmed);
	return resolved ?? trimmed;
}

/**
 * Czy mobilne tło hero (`MobileHeroImageBand`) ma iść przez `next/image` (resize + srcset).
 * WebP z CMS dotyczy formatu — wymiary nadal wymagają skalowania (LCP na mobile).
 */
export function optimizeCmsHeroImage(url: string): boolean {
	if (!url) return false;

	const pathname = (url.split("?")[0] ?? "").toLowerCase();
	if (pathname.endsWith(".svg")) return false;

	if (url.startsWith("http")) {
		try {
			const parsed = new URL(url);
			const host = parsed.hostname;
			if (host === "localhost" || host === "127.0.0.1") return false;
			return true;
		} catch {
			return false;
		}
	}

	if (pathname.includes("/images/cms/") || pathname.includes("/cms-uploads/")) {
		return true;
	}

	if (
		pathname.startsWith("/static/") ||
		pathname.startsWith("/uploads/") ||
		pathname.startsWith("/products/")
	) {
		return false;
	}

	return true;
}

/**
 * Czy `next/image` ma pominąć optymalizację (`unoptimized`).
 *
 * Domyślnie OPTYMALIZUJEMY assety z repo (`/images/…` poza `/images/cms/`).
 *
 * `unoptimized` dla hero CMS desktop i miniatur — bez ponownego skalowania Next.js.
 * Mobile hero używa `optimizeCmsHeroImage()` zamiast tej funkcji.
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
			const parsed = new URL(url);
			const host = parsed.hostname;
			const path = parsed.pathname.toLowerCase();
			if (host === "localhost" || host === "127.0.0.1") return true;
			// Zdalne hero CMS (R2) — serwuj oryginał bez ponownej kompresji.
			if (path.includes("/cms-uploads/")) return true;
			// Medusa /static/ — panel ładuje bezpośrednio (next/image optimizer często 404).
			if (
				path.startsWith("/static/") ||
				path.startsWith("/uploads/") ||
				path.startsWith("/products/")
			) {
				return true;
			}
		} catch {
			return true;
		}
		return false;
	}

	// Hero CMS — już zoptymalizowany WebP/JPG z panelu; bez ponownej kompresji Next.js.
	if (pathname.includes("/images/cms/") || pathname.includes("/cms-uploads/")) {
		return true;
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
