import type { ContentPageId } from "@/lib/content/types";

export const PAGE_SECTIONS_PREFIX = "pageSections:";
export const PAGE_SECTIONS_DRAFT_PREFIX = "pageSectionsDraft:";
export const PAGE_SECTIONS_HISTORY_PREFIX = "pageSectionsHistory:";

export const MAX_SECTIONS_PER_PAGE = 20;
export const MAX_HISTORY_VERSIONS = 10;

export function pageSectionsLiveKey(pageId: ContentPageId | string): string {
	return `${PAGE_SECTIONS_PREFIX}${pageId}`;
}

export function pageSectionsDraftKey(pageId: ContentPageId | string): string {
	return `${PAGE_SECTIONS_DRAFT_PREFIX}${pageId}`;
}

export function pageSectionsHistoryKey(pageId: ContentPageId | string): string {
	return `${PAGE_SECTIONS_HISTORY_PREFIX}${pageId}`;
}
