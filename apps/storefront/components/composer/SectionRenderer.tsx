import { Suspense } from "react";
import type { ContentPageId } from "@/lib/content/types";
import type { PageSection } from "@/lib/composer/sections/schema";
import { HeroSection } from "@/components/home/HeroSection";
import { SocialProofSection } from "@/components/home/SocialProofSection";
import { BestsellersSkeleton } from "@/components/composer/sections/BestsellersSkeleton";
import { ComposerBestsellersSection } from "@/components/composer/sections/ComposerBestsellersSection";
import { ComposerRichTextSection } from "@/components/composer/sections/ComposerRichTextSection";
import { ComposerDividerSection } from "@/components/composer/sections/ComposerDividerSection";
import { ComposerTestimonialsSection } from "@/components/composer/sections/ComposerTestimonialsSection";
import { ComposerFaqSection } from "@/components/composer/sections/ComposerFaqSection";
import { ComposerGallerySection } from "@/components/composer/sections/ComposerGallerySection";
import { ComposerCategoryTilesSection } from "@/components/composer/sections/ComposerCategoryTilesSection";
import { ComposerAboutSection } from "@/components/composer/sections/ComposerAboutSection";
import { ComposerAboutHeroSection } from "@/components/composer/sections/ComposerAboutHeroSection";
import { ComposerLogoHeroSection } from "@/components/composer/sections/ComposerLogoHeroSection";
import { ComposerTextImageSection } from "@/components/composer/sections/ComposerTextImageSection";
import { ComposerCtaSection } from "@/components/composer/sections/ComposerCtaSection";
import { ComposerContactFormSection } from "@/components/composer/sections/ComposerContactFormSection";
import { ComposerEmbedMapSection } from "@/components/composer/sections/ComposerEmbedMapSection";
import { SectionLayoutShell } from "./SectionLayoutShell";

type Props = {
	pageId: ContentPageId;
	sections: PageSection[];
};

async function renderSection(pageId: ContentPageId, section: PageSection) {
	if (section.hidden) return null;

	const cmsField = `page.${pageId}.sections.${section.id}`;
	const shellClass =
		section.type === "hero" ||
		section.type === "bestsellers" ||
		section.type === "socialProof" ||
		section.type === "cta" ||
		section.type === "gallery"
			? "!p-0 !max-w-none"
			: undefined;

	switch (section.type) {
		case "hero": {
			const heroNode =
				pageId === "o-nas" ? (
					<ComposerAboutHeroSection
						pageId={pageId}
						sectionId={section.id}
						hero={section.props}
					/>
				) : pageId === "logo-3d" ? (
					<ComposerLogoHeroSection
						pageId={pageId}
						sectionId={section.id}
						hero={section.props}
					/>
				) : (
					<HeroSection hero={section.props} cmsField={cmsField} />
				);
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
					className={shellClass}
				>
					{heroNode}
				</SectionLayoutShell>
			);
		}
		case "bestsellers":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
					className={shellClass}
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
					className={shellClass}
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
					className={shellClass}
				>
					<ComposerCtaSection pageId={pageId} sectionId={section.id} {...section.props} />
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
		case "testimonials":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
				>
					<ComposerTestimonialsSection
						pageId={pageId}
						sectionId={section.id}
						items={section.props.items}
					/>
				</SectionLayoutShell>
			);
		case "faq":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
				>
					<ComposerFaqSection
						pageId={pageId}
						sectionId={section.id}
						items={section.props.items}
					/>
				</SectionLayoutShell>
			);
		case "gallery":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
					className={shellClass}
				>
					<ComposerGallerySection
						pageId={pageId}
						sectionId={section.id}
						items={section.props.items}
					/>
				</SectionLayoutShell>
			);
		case "categoryTiles":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
				>
					<ComposerCategoryTilesSection
						pageId={pageId}
						sectionId={section.id}
						items={section.props.items}
					/>
				</SectionLayoutShell>
			);
		case "about":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
				>
					<ComposerAboutSection pageId={pageId} sectionId={section.id} {...section.props} />
				</SectionLayoutShell>
			);
		case "textImage":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
				>
					<ComposerTextImageSection pageId={pageId} sectionId={section.id} {...section.props} />
				</SectionLayoutShell>
			);
		case "contactForm":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
				>
					<ComposerContactFormSection pageId={pageId} sectionId={section.id} {...section.props} />
				</SectionLayoutShell>
			);
		case "embedMap":
			return (
				<SectionLayoutShell
					key={section.id}
					pageId={pageId}
					sectionId={section.id}
					layout={section.layout}
				>
					<ComposerEmbedMapSection pageId={pageId} sectionId={section.id} {...section.props} />
				</SectionLayoutShell>
			);
		default: {
			const unknownType = (section as { type: string }).type;
			if (process.env.NODE_ENV === "development") {
				console.warn(`[SectionRenderer] Nieznany typ sekcji: ${unknownType}`);
			}
			return null;
		}
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
