import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { createProductPage } from "@/lib/products/create-product-page";
import {
	generateGotoweWzoryListingMetadata,
	GotoweWzoryListingPage,
} from "@/components/shop/GotoweWzoryListingPage";
import {
	isDirectListingCategorySlug,
	LISTING_CATEGORY_HANDLE,
	type CategoryTreeNode,
} from "@/lib/medusa/category-tree";
import { getProductCategories } from "@/lib/medusa/products";

/**
 * ISR 1h — bez `generateStaticParams` (root layout woła `headers()` pod CSP
 * nonce; pre-render slugów → DYNAMIC_SERVER_USAGE → 500 na Vercel). Strona
 * cache'uje się po pierwszym wejściu; webhook Medusy invaliduje produkty.
 */
export const revalidate = 3600;

const productPage = createProductPage({
	basePath: "/sklep/gotowe-wzory",
	categoryLabel: "Gotowe wzory",
	categoryHref: "/sklep/gotowe-wzory",
});

const ProductPage = productPage.Page;

type PageParams = Promise<{ slug: string }>;

async function loadCategoryTree(): Promise<CategoryTreeNode[]> {
	const categories = await getProductCategories().catch(() => []);
	return categories as unknown as CategoryTreeNode[];
}

export async function generateMetadata({
	params,
}: {
	params: PageParams;
}): Promise<Metadata> {
	const { slug } = await params;
	const tree = await loadCategoryTree();

	if (slug === LISTING_CATEGORY_HANDLE.certyfikaty) {
		permanentRedirect("/sklep/certyfikaty");
	}

	if (isDirectListingCategorySlug(tree, LISTING_CATEGORY_HANDLE.gotoweWzory, slug)) {
		return generateGotoweWzoryListingMetadata(slug);
	}

	return productPage.generateMetadata({ params });
}

export default async function GotoweWzorySlugPage({
	params,
}: {
	params: PageParams;
}) {
	const { slug } = await params;
	const tree = await loadCategoryTree();

	if (slug === LISTING_CATEGORY_HANDLE.certyfikaty) {
		permanentRedirect("/sklep/certyfikaty");
	}

	if (isDirectListingCategorySlug(tree, LISTING_CATEGORY_HANDLE.gotoweWzory, slug)) {
		// Sortowanie z ?sort= obsługuje ShopGridClient po hydracji (useSearchParams).
		return (
			<GotoweWzoryListingPage categoryHandle={slug} searchParams={{}} />
		);
	}

	return <ProductPage params={params} />;
}
