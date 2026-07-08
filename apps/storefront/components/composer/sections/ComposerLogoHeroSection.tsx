import { LogoCategoryHeroSection } from "@/components/category/LogoCategoryHeroSection";
import { cmsAttr } from "@/lib/cms-preview/attr";
import type { ContentPageId, HeroContent } from "@/lib/content/types";

type Props = {
	pageId: ContentPageId;
	sectionId: string;
	hero: HeroContent;
};

export async function ComposerLogoHeroSection({ pageId, sectionId, hero }: Props) {
	return (
		<div {...(await cmsAttr(`page.${pageId}.sections.${sectionId}`))}>
			<LogoCategoryHeroSection hero={hero} />
		</div>
	);
}
