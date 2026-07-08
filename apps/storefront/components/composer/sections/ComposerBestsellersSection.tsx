import { cmsAttr } from "@/lib/cms-preview/attr";
import {
	resolveBestsellerProducts,
	resolveBestsellersTitle,
} from "@/lib/bestsellers/resolve-bestsellers";
import type { ContentPageId } from "@/lib/content/types";
import type { BestsellersContent } from "@/lib/content/types";
import { BestsellersGrid } from "@/components/home/BestsellersGrid";

type Props = BestsellersContent & {
	pageId: ContentPageId;
	sectionId: string;
};

export async function ComposerBestsellersSection({
	pageId,
	sectionId,
	title,
	productIds,
}: Props) {
	const products = await resolveBestsellerProducts({ title, productIds });
	if (!products.length) return null;

	return (
		<BestsellersGrid
			title={resolveBestsellersTitle({ title, productIds })}
			products={products}
			cmsField={await cmsAttr(`page.${pageId}.sections.${sectionId}`)}
		/>
	);
}
