import type { ContentPageId } from "@/lib/content/types";
import type { PageSection, SectionTypeId } from "./sections/schema";
import { createSection } from "./registry";

export type SectionPreset = {
	id: string;
	label: string;
	description: string;
	pageId?: ContentPageId;
	sectionTypes: SectionTypeId[];
};

export const SECTION_PRESETS: SectionPreset[] = [
	{
		id: "home-minimal",
		label: "Strona główna — minimal",
		description: "Hero + bestsellery + CTA",
		pageId: "home",
		sectionTypes: ["hero", "bestsellers", "cta"],
	},
	{
		id: "listing-trust",
		label: "Listing — zaufanie",
		description: "Opinie + FAQ pod siatką produktów",
		sectionTypes: ["testimonials", "faq"],
	},
	{
		id: "about-full",
		label: "O nas — pełny",
		description: "Hero + bloki O nas",
		pageId: "o-nas",
		sectionTypes: ["hero", "about"],
	},
];

export function presetsForPage(pageId: ContentPageId): SectionPreset[] {
	return SECTION_PRESETS.filter((p) => !p.pageId || p.pageId === pageId);
}

export function applyPreset(preset: SectionPreset): PageSection[] {
	return preset.sectionTypes.map((type) => createSection(type));
}

export function presetSectionTypes(preset: SectionPreset): SectionTypeId[] {
	return preset.sectionTypes;
}
