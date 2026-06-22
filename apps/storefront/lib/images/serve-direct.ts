import { BRAND_BLUR_DATA_URL } from "@/lib/images/blur";

/**
 * Obrazy już zoptymalizowane (CMS prebuild, R2, Cloudinary) — serwuj bezpośrednio,
 * bez round-tripu przez `/_next/image`. Na odświeżeniu Vercel Image Optimization
 * na zimno dodaje ~1–3 s; CDN trafia od razu w cache przeglądarki.
 */
export function shouldServeImageDirect(src: string): boolean {
	if (!src) return false;

	const pathOnly = (src.split("?")[0] ?? "").toLowerCase();
	if (pathOnly.startsWith("/images/cms/") || pathOnly.startsWith("/images/categories/")) {
		return true;
	}

	if (!src.startsWith("http")) return false;

	try {
		const { hostname } = new URL(src);
		if (hostname === "localhost" || hostname === "127.0.0.1") return true;
		if (hostname.endsWith(".r2.dev")) return true;
		if (hostname === "res.cloudinary.com") return true;
		return false;
	} catch {
		return true;
	}
}

/** Blur-up tylko dla lazy poniżej fold — eager/priority bez fade (cache hit = instant paint). */
export function lazyBlurPlaceholderProps(
	eager: boolean,
): { placeholder: "blur"; blurDataURL: string } | Record<string, never> {
	if (eager) return {};
	return { placeholder: "blur", blurDataURL: BRAND_BLUR_DATA_URL };
}
