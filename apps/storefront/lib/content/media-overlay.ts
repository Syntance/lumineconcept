import type { RawStoreMetadataBlob } from "./admin-read";
import { isRemoteCmsMediaUrl } from "./media-publish";

function isMediaRowWithoutImage(node: Record<string, unknown>): boolean {
	if (!("imageUrl" in node) || typeof node.imageUrl !== "string" || node.imageUrl.trim()) {
		return false;
	}
	return typeof node.id === "string" && ("postUrl" in node || "order" in node);
}

function applyMediaGate(
	node: unknown,
	urlMap: Readonly<Record<string, string>>,
	gateUnmappedRemote: boolean,
): unknown {
	if (typeof node === "string") {
		const mapped = urlMap[node];
		if (mapped) return mapped;
		if (gateUnmappedRemote && isRemoteCmsMediaUrl(node)) return "";
		return node;
	}

	if (Array.isArray(node)) {
		return node
			.map((item) => applyMediaGate(item, urlMap, gateUnmappedRemote))
			.filter((item) => item !== null);
	}

	if (node && typeof node === "object") {
		const out: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(node)) {
			out[key] = applyMediaGate(val, urlMap, gateUnmappedRemote);
		}

		if (isMediaRowWithoutImage(out)) {
			return null;
		}

		if (typeof out.imageUrl === "string" && !out.imageUrl.trim()) {
			delete out.imageUrl;
		}
		if (typeof out.logoUrl === "string" && !out.logoUrl.trim()) {
			delete out.logoUrl;
		}
		if (typeof out.desktopImageUrl === "string" && !out.desktopImageUrl.trim()) {
			delete out.desktopImageUrl;
		}
		if (typeof out.mobileImageUrl === "string" && !out.mobileImageUrl.trim()) {
			delete out.mobileImageUrl;
		}
		if (typeof out.ogImageUrl === "string" && !out.ogImageUrl.trim()) {
			delete out.ogImageUrl;
		}
		if (typeof out.defaultOgImageUrl === "string" && !out.defaultOgImageUrl.trim()) {
			delete out.defaultOgImageUrl;
		}

		return out;
	}

	return node;
}

/**
 * Live blob z Medusy + mapa z prebuildu:
 * - URL w mapie → lokalny `/images/cms/…` (LCP),
 * - zdalny CMS bez wpisu w mapie → ukryty do redeploy (nie pokazuj R2 live),
 * - brak mapy (dev bez sync) → zostaw zdalne URL-e.
 */
export function applyMediaUrlOverlay(
	blob: RawStoreMetadataBlob,
	urlMap: Readonly<Record<string, string>>,
): RawStoreMetadataBlob {
	const gateUnmappedRemote = Object.keys(urlMap).length > 0;

	return {
		siteSettings: applyMediaGate(blob.siteSettings, urlMap, gateUnmappedRemote),
		pageSeo: applyMediaGate(blob.pageSeo, urlMap, gateUnmappedRemote),
		pageContent: applyMediaGate(blob.pageContent, urlMap, gateUnmappedRemote),
		globalContent: applyMediaGate(blob.globalContent, urlMap, gateUnmappedRemote),
	};
}
