const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|svg)$/i;

const MEDIA_URL_KEYS = new Set([
	"desktopImageUrl",
	"mobileImageUrl",
	"imageUrl",
	"logoUrl",
	"defaultOgImageUrl",
	"ogImageUrl",
]);

/** Zdalny URL obrazu CMS wymagający sync/prebuild (R2/CDN), nie lokalny asset. */
export function isRemoteCmsMediaUrl(value: unknown): value is string {
	if (typeof value !== "string" || !value.trim()) return false;
	const trimmed = value.trim();
	if (trimmed.startsWith("/images/cms/")) return false;
	if (trimmed.startsWith("/images/") || trimmed.startsWith("/icons/")) return false;
	if (trimmed.startsWith("data:")) return false;
	if (!/^https?:\/\//i.test(trimmed)) return false;
	const pathOnly = trimmed.split("?")[0] ?? trimmed;
	return IMAGE_EXT.test(pathOnly);
}

/** Zbiera URL-e mediów z payloadu CMS (do porównania przed/po zapisie). */
export function collectMediaUrls(node: unknown, acc: Set<string> = new Set()): Set<string> {
	if (typeof node === "string") {
		if (isRemoteCmsMediaUrl(node)) acc.add(node.trim());
		return acc;
	}
	if (Array.isArray(node)) {
		for (const item of node) collectMediaUrls(item, acc);
		return acc;
	}
	if (node && typeof node === "object") {
		for (const [key, val] of Object.entries(node)) {
			if (MEDIA_URL_KEYS.has(key) && isRemoteCmsMediaUrl(val)) {
				acc.add(String(val).trim());
			} else {
				collectMediaUrls(val, acc);
			}
		}
	}
	return acc;
}

export function mediaUrlsChanged(before: unknown, after: unknown): boolean {
	const prev = collectMediaUrls(before);
	const next = collectMediaUrls(after);
	if (prev.size !== next.size) return true;
	for (const url of next) {
		if (!prev.has(url)) return true;
	}
	for (const url of prev) {
		if (!next.has(url)) return true;
	}
	return false;
}
