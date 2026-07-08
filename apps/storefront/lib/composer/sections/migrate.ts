import { magazynConfig } from "@magazyn/magazyn.config";
import type { ContentBlockKey, ContentPageId, PageContent } from "@/lib/content/types";
import type { PageSection, SectionTypeId } from "./schema";

function newSectionId(type: SectionTypeId): string {
	return `${type}-${crypto.randomUUID().slice(0, 8)}`;
}

const BLOCK_TO_SECTION: Partial<Record<ContentBlockKey, SectionTypeId>> = {
	hero: "hero",
	bestsellers: "bestsellers",
	brandingCta: "cta",
	testimonials: "testimonials",
	faq: "faq",
	gallery: "gallery",
	categoryTiles: "categoryTiles",
	about: "about",
};

/**
 * Konwerter legacy PageContent → lista sekcji composera.
 * Kolejność bloków = kolejność z magazyn.config.ts dla danej strony.
 */
export function migratePageContentToSections(
	pageId: ContentPageId,
	content: PageContent,
): PageSection[] {
	const page = magazynConfig.content.pages.find((p) => p.id === pageId);
	if (!page) return [];

	const sections: PageSection[] = [];

	for (const block of page.blocks) {
		const sectionType = BLOCK_TO_SECTION[block];
		if (!sectionType) continue;

		switch (block) {
			case "hero":
				if (content.hero) {
					sections.push({
						id: newSectionId("hero"),
						type: "hero",
						props: content.hero,
					});
				}
				break;
			case "bestsellers":
				if (content.bestsellers) {
					sections.push({
						id: newSectionId("bestsellers"),
						type: "bestsellers",
						props: content.bestsellers,
					});
				}
				break;
			case "brandingCta":
				sections.push({
					id: newSectionId("cta"),
					type: "cta",
					props: {
						heading: "Gotowa na branding,",
						subheading: "który wyróżni Twój salon?",
						ctaLabel: "Zobacz sklep",
						ctaHref: "/sklep",
						...content.brandingCta,
					},
				});
				break;
			case "testimonials":
				if (content.testimonials?.length) {
					sections.push({
						id: newSectionId("testimonials"),
						type: "testimonials",
						props: { items: content.testimonials },
					});
				}
				break;
			case "faq":
				if (content.faq?.length) {
					sections.push({
						id: newSectionId("faq"),
						type: "faq",
						props: { items: content.faq },
					});
				}
				break;
			case "gallery":
				if (content.gallery?.length) {
					sections.push({
						id: newSectionId("gallery"),
						type: "gallery",
						props: { items: content.gallery },
					});
				}
				break;
			case "categoryTiles":
				if (content.categoryTiles?.length) {
					sections.push({
						id: newSectionId("categoryTiles"),
						type: "categoryTiles",
						props: { items: content.categoryTiles },
					});
				}
				break;
			case "about":
				if (content.about) {
					sections.push({
						id: newSectionId("about"),
						type: "about",
						props: content.about,
					});
				}
				break;
			default:
				break;
		}
	}

	// Strona główna: SocialProof między bestsellers a CTA (jak w page.tsx).
	if (pageId === "home") {
		const insertAt = sections.findIndex((s) => s.type === "bestsellers");
		const social: PageSection = {
			id: newSectionId("socialProof"),
			type: "socialProof",
			props: {},
		};
		if (insertAt >= 0) {
			sections.splice(insertAt + 1, 0, social);
		} else {
			sections.push(social);
		}
	}

	return sections;
}
