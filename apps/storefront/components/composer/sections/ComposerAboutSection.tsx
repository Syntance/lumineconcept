import { cmsAttr } from "@/lib/cms-preview/attr";
import type { AboutPageContent, ContentPageId } from "@/lib/content/types";
import { resolveAboutPage } from "@/lib/content/about";
import { AboutIntroSection } from "@/components/about/AboutIntroSection";
import { AboutMissionSection } from "@/components/about/AboutMissionSection";
import { AboutClosingSection } from "@/components/about/AboutClosingSection";
import { ABOUT_PAGE_CONTENT_MOBILE_LOWER } from "@/components/about/about-media";

type Props = AboutPageContent & {
	pageId: ContentPageId;
	sectionId: string;
};

export async function ComposerAboutSection({ pageId, sectionId, ...about }: Props) {
	const resolved = resolveAboutPage({ about });

	return (
		<div
			className={ABOUT_PAGE_CONTENT_MOBILE_LOWER}
			{...(await cmsAttr(`page.${pageId}.sections.${sectionId}`))}
		>
			<AboutIntroSection sections={resolved.sections} />
			<AboutMissionSection sections={resolved.sections} />
			<AboutClosingSection sections={resolved.sections} />
		</div>
	);
}
