import type { RawStoreMetadataBlob } from "./admin-read";

function replaceUrlsInNode(node: unknown, urlMap: Readonly<Record<string, string>>): unknown {
	if (typeof node === "string") {
		const mapped = urlMap[node];
		return mapped ?? node;
	}
	if (Array.isArray(node)) {
		return node.map((item) => replaceUrlsInNode(item, urlMap));
	}
	if (node && typeof node === "object") {
		const out: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(node)) {
			out[key] = replaceUrlsInNode(val, urlMap);
		}
		return out;
	}
	return node;
}

/**
 * Nakłada mapę z prebuild (`https://cdn…` → `/images/cms/…`) na live blob z Medusy.
 * Tekst zostaje świeży; zlokalizowane obrazy przyspieszają LCP.
 */
export function applyMediaUrlOverlay(
	blob: RawStoreMetadataBlob,
	urlMap: Readonly<Record<string, string>>,
): RawStoreMetadataBlob {
	if (Object.keys(urlMap).length === 0) return blob;
	return {
		siteSettings: replaceUrlsInNode(blob.siteSettings, urlMap),
		pageSeo: replaceUrlsInNode(blob.pageSeo, urlMap),
		pageContent: replaceUrlsInNode(blob.pageContent, urlMap),
		globalContent: replaceUrlsInNode(blob.globalContent, urlMap),
	};
}
