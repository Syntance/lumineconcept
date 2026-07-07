import type { RawStoreMetadataBlob } from "./admin-read";

function parseMetadataJsonField(value: unknown): unknown {
	if (typeof value !== "string") return value;
	try {
		return JSON.parse(value) as unknown;
	} catch {
		return value;
	}
}

/** Store.metadata trzyma CMS jako JSON-stringi — parsuj przed overlay URL-i. */
export function normalizeMetadataBlobForOverlay(blob: RawStoreMetadataBlob): RawStoreMetadataBlob {
	return {
		siteSettings: parseMetadataJsonField(blob.siteSettings),
		pageSeo: parseMetadataJsonField(blob.pageSeo),
		pageContent: parseMetadataJsonField(blob.pageContent),
		globalContent: parseMetadataJsonField(blob.globalContent),
	};
}
import {
	isCmsMediaAssetUrl,
	isRuntimeCmsMediaGateEnabled,
	lookupPublishedMediaUrl,
	shouldStripUnpublishedCmsMedia,
} from "./cms-media-gate";

function isMediaRowWithoutImage(node: Record<string, unknown>): boolean {
	if (!("imageUrl" in node) || typeof node.imageUrl !== "string" || node.imageUrl.trim()) {
		return false;
	}
	return typeof node.id === "string" && ("postUrl" in node || "order" in node);
}

function applyMediaGate(
	node: unknown,
	urlMap: Readonly<Record<string, string>>,
	gateEnabled: boolean,
): unknown {
	if (typeof node === "string") {
		const published = lookupPublishedMediaUrl(node, urlMap);
		if (published) return published;
		if (gateEnabled && shouldStripUnpublishedCmsMedia(node, urlMap)) {
			return "";
		}
		return node;
	}

	if (Array.isArray(node)) {
		return node
			.map((item) => applyMediaGate(item, urlMap, gateEnabled))
			.filter((item) => item !== null);
	}

	if (node && typeof node === "object") {
		const out: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(node)) {
			out[key] = applyMediaGate(val, urlMap, gateEnabled);
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
 * - opublikowany URL → `/images/cms/…`,
 * - nieopublikowany upload CMS → ukryty do sync/prebuild + Redeploy (prod); dev: bezpośrednio z CDN.
 */
export function applyMediaUrlOverlay(
	blob: RawStoreMetadataBlob,
	urlMap: Readonly<Record<string, string>>,
	options?: { disableGate?: boolean },
): RawStoreMetadataBlob {
	// disableGate (tryb „edycji na żywo", draftMode): świeżo wgrane, jeszcze
	// nieopublikowane zdjęcia renderują się w podglądzie OD RAZU, bezpośrednio
	// z CDN — klient nie czeka na Redeploy, żeby ZOBACZYĆ zmianę. Publikacja
	// na produkcję nadal wymaga Redeploy (mapa prebuild bez zmian).
	const gateEnabled = options?.disableGate
		? false
		: isRuntimeCmsMediaGateEnabled(urlMap);

	return {
		siteSettings: applyMediaGate(blob.siteSettings, urlMap, gateEnabled),
		pageSeo: applyMediaGate(blob.pageSeo, urlMap, gateEnabled),
		pageContent: applyMediaGate(blob.pageContent, urlMap, gateEnabled),
		globalContent: applyMediaGate(blob.globalContent, urlMap, gateEnabled),
	};
}

export { isCmsMediaAssetUrl };
