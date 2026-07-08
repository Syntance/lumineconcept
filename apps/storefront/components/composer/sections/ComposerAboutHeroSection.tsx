import { AboutHeroSection } from "@/components/about/AboutHeroSection";
import { resolveAboutHero } from "@/lib/content/about";
import { cmsAttr } from "@/lib/cms-preview/attr";
import type { HeroContent } from "@/lib/content/types";
import type { ContentPageId } from "@/lib/content/types";

type Props = {
	pageId: ContentPageId;
	sectionId: string;
	hero: HeroContent;
};

export async function ComposerAboutHeroSection({ pageId, sectionId, hero }: Props) {
	const resolved = resolveAboutHero(hero);
	return (
		<div {...(await cmsAttr(`page.${pageId}.sections.${sectionId}`))}>
			<AboutHeroSection hero={resolved} />
		</div>
	);
}
