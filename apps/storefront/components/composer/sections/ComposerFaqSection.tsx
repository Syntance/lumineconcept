import { cmsAttr } from "@/lib/cms-preview/attr";
import type { ContentPageId, FaqItem } from "@/lib/content/types";
import { PageFaqSection } from "@/components/content/PageFaqSection";

type Props = {
	pageId: ContentPageId;
	sectionId: string;
	items: FaqItem[];
};

export async function ComposerFaqSection({ pageId, sectionId, items }: Props) {
	return (
		<div {...(await cmsAttr(`page.${pageId}.sections.${sectionId}`))}>
			<PageFaqSection faq={items} />
		</div>
	);
}
