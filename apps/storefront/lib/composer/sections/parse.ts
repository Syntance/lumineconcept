import { z } from "zod";
import {
	pageSectionSchema,
	pageSectionsArraySchema,
	sectionHistorySchema,
	sanitizeSectionsForSave,
	type PageSection,
	type PageSections,
	type SectionHistory,
} from "./schema";

export function parsePageSections(raw: unknown): PageSections {
	const parsed = pageSectionsArraySchema.safeParse(raw);
	if (!parsed.success) return [];
	return parsed.data;
}

export function parsePageSection(raw: unknown): PageSection | null {
	const parsed = pageSectionSchema.safeParse(raw);
	return parsed.success ? parsed.data : null;
}

export function parseSectionHistory(raw: unknown): SectionHistory {
	const parsed = sectionHistorySchema.safeParse(raw);
	if (parsed.success) return parsed.data;
	return { versions: [] };
}

export function prepareSectionsForSave(sections: PageSection[]): PageSections {
	const sanitized = sanitizeSectionsForSave(sections);
	return pageSectionsArraySchema.parse(sanitized);
}

export function safeParseSectionsJson(json: unknown): PageSections {
	if (typeof json === "string") {
		try {
			return parsePageSections(JSON.parse(json));
		} catch {
			return [];
		}
	}
	return parsePageSections(json);
}

export function safeParseHistoryJson(json: unknown): SectionHistory {
	if (typeof json === "string") {
		try {
			return parseSectionHistory(JSON.parse(json));
		} catch {
			return { versions: [] };
		}
	}
	return parseSectionHistory(json);
}

export { pageSectionsArraySchema, sectionHistorySchema };
