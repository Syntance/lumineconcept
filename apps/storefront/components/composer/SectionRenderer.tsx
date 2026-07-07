import { Suspense } from "react";
import type { ContentPageId } from "@/lib/content/types";
import type { PageSection } from "@/lib/composer/sections/schema";
import { HeroSection } from "@/components/home/HeroSection";
import { SocialProofSection } from "@/components/home/SocialProofSection";
import { FooterCTA } from "@/components/home/FooterCTA";
import { BestsellersSkeleton } from "@/components/composer/sections/BestsellersSkeleton";
import { ComposerBestsellersSection } from "@/components/composer/sections/ComposerBestsellersSection";
import { ComposerRichTextSection } from "@/components/composer/sections/ComposerRichTextSection";
import { ComposerDividerSection } from "@/components/composer/sections/ComposerDividerSection";
import { SectionLayoutShell } from "./SectionLayoutShell";

type Props = {
	pageId: ContentPageId;
	sections: PageSection[];
};

async function renderSection(pageId: ContentPageId, section: PageSection) {
	if (section.hidden) return null;

	switch (section.type) {
		case "hero":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
					className="!p-0 !max-w-none"
				>
					<HeroSection hero={section.props} />
				</SectionLayoutShell>
			);
		case "bestsellers":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
					className="!p-0 !max-w-none"
				>
					<Suspense fallback={<BestsellersSkeleton />}>
						<ComposerBestsellersSection
							pageId={pageId}
							sectionId={section.id}
							{...section.props}
						/>
					</Suspense>
				</SectionLayoutShell>
			);
		case "socialProof":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
					className="!p-0 !max-w-none"
				>
					<SocialProofSection />
				</SectionLayoutShell>
			);
		case "cta":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
					className="!p-0 !max-w-none"
				>
					<Suspense fallback={null}>
						<FooterCTA />
					</Suspense>
				</SectionLayoutShell>
			);
		case "richText":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
				>
					<ComposerRichTextSection
						pageId={pageId}
						sectionId={section.id}
						{...section.props}
					/>
				</SectionLayoutShell>
			);
		case "divider":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
				>
					<ComposerDividerSection {...section.props} />
				</SectionLayoutShell>
			);
		default:
			if (process.env.NODE_ENV === "development") {
				console.warn(`[SectionRenderer] Nieznany typ sekcji: ${section.type}`);
			}
			return null;
	}
}

/**
 * Renderer composera — switch po typie sekcji, jedno H1 (hero), h2 w podsekcjach.
 * Nieznany typ → null (bez 500).
 */
export async function SectionRenderer({ pageId, sections }: Props) {
	const visible = sections.filter((s) => !s.hidden);
	const results = await Promise.all(visible.map((s) => renderSection(pageId, s)));
	return <>{results}</>;
}
