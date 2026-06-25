import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { createProductPage } from "@/lib/products/create-product-page";
import {
	generateGotoweWzoryListingMetadata,
	GotoweWzoryListingPage,
} from "@/components/shop/GotoweWzoryListingPage";
import {
	getDirectListingCategoryHandles,
	isDirectListingCategorySlug,
	LISTING_CATEGORY_HANDLE,
	type CategoryTreeNode,
} from "@/lib/medusa/category-tree";
import { getProductCategories } from "@/lib/medusa/products";

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

export async function generateStaticParams() {
	const [productParams, tree] = await Promise.all([
		productPage.generateStaticParams(),
		loadCategoryTree(),
	]);

	const categorySlugs = getDirectListingCategoryHandles(
		tree,
		LISTING_CATEGORY_HANDLE.gotoweWzory,
	)
		.filter((handle) => handle !== LISTING_CATEGORY_HANDLE.certyfikaty)
		.map((handle) => ({ slug: handle }));

	const seen = new Set<string>();
	const merged: Array<{ slug: string }> = [];

	for (const entry of [...categorySlugs, ...productParams]) {
		if (seen.has(entry.slug)) continue;
		seen.add(entry.slug);
		merged.push(entry);
	}

	return merged;
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
		/**
		 * Brak `searchParams` w page — route ma `generateStaticParams` (SSG).
		 * `searchParams` na SSG → DYNAMIC_SERVER_USAGE → 500 na Vercel.
		 * Sortowanie z `?sort=` obsługuje ShopGridClient po hydracji.
		 */
		return (
			<GotoweWzoryListingPage categoryHandle={slug} searchParams={{}} />
		);
	}

	return <ProductPage params={params} />;
}
