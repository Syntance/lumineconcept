import { cmsAttr } from "@/lib/cms-preview/attr";
import type { ContentPageId, GalleryPhoto } from "@/lib/content/types";
import { LogoBoardRealizations } from "@/app/(shop)/sklep/tablice-z-logo/LogoBoardRealizations";

type Props = {
	pageId: ContentPageId;
	sectionId: string;
	items: GalleryPhoto[];
};

export async function ComposerGallerySection({ pageId, sectionId, items }: Props) {
	const sorted = [...items].sort((a, b) => a.order - b.order);
	if (!sorted.length) return null;

	return (
		<div {...(await cmsAttr(`page.${pageId}.sections.${sectionId}`))}>
			<LogoBoardRealizations items={sorted} />
		</div>
	);
}
