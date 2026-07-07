import "server-only";
import { cache } from "react";
import { draftMode } from "next/headers";
import { magazynConfig } from "@magazyn/magazyn.config";
import { fetchStoreMetadataBlob } from "@/lib/content/admin-read";
import { getPageContent } from "@/lib/content";
import type { ContentPageId } from "@/lib/content/types";
import { migratePageContentToSections } from "@/lib/composer/sections/migrate";
import { parsePageSections, parseSectionHistory, safeParseSectionsJson } from "@/lib/composer/sections/parse";
import type { PageSections, SectionHistory } from "@/lib/composer/sections/schema";

async function readSectionsFromMetadata(
	pageId: ContentPageId,
	preferDraft: boolean,
): Promise<PageSections | null> {
	const blob = await fetchStoreMetadataBlob();
	if (!blob) return null;

	if (preferDraft && blob.pageSectionsDraft[pageId]) {
		const draft = safeParseSectionsJson(blob.pageSectionsDraft[pageId]);
		if (draft.length > 0) return draft;
	}

	if (blob.pageSectionsLive[pageId]) {
		const live = safeParseSectionsJson(blob.pageSectionsLive[pageId]);
		if (live.length > 0) return live;
	}

	return null;
}

/**
 * Sekcje strony — draft w draftMode, live na produkcji.
 * Fallback: migracja z legacy PageContent (bez zapisu).
 */
export const getPageSections = cache(async (pageId: ContentPageId): Promise<PageSections> => {
	let preferDraft = false;
	try {
		preferDraft = (await draftMode()).isEnabled;
	} catch {
		/* build / poza request */
	}

	const fromMeta = await readSectionsFromMetadata(pageId, preferDraft);
	if (fromMeta?.length) return fromMeta;

	const legacy = await getPageContent(pageId);
	return migratePageContentToSections(pageId, legacy);
});

export async function getPageSectionsHistory(pageId: ContentPageId): Promise<SectionHistory> {
	const blob = await fetchStoreMetadataBlob();
	if (!blob?.pageSectionsHistory[pageId]) return { versions: [] };
	return parseSectionHistory(
		typeof blob.pageSectionsHistory[pageId] === "string"
			? JSON.parse(blob.pageSectionsHistory[pageId] as string)
			: blob.pageSectionsHistory[pageId],
	);
}

export function composerEnabledForPage(pageId: ContentPageId): boolean {
	return magazynConfig.content.pages.some((p) => p.id === pageId);
}

export { parsePageSections };
