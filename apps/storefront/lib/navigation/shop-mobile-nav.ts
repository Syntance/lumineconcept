import {
	buildListingCategoryFilters,
	LISTING_CATEGORY_HANDLE,
	type CategoryTreeNode,
} from "@/lib/medusa/category-tree";
import { categoryListingHref } from "@/lib/medusa/shop-breadcrumbs";

export type ShopNavLink = { href: string; label: string };

const LISTING_BASE_PATH = "/sklep/gotowe-wzory";

/** Główne sekcje sklepu — zawsze na górze podmenu mobilnego. */
export const SHOP_MOBILE_MAIN_CATEGORIES: readonly ShopNavLink[] = [
	{ href: "/sklep/gotowe-wzory", label: "Gotowe wzory" },
	{ href: "/sklep/logo-3d", label: "Tablice z logo" },
	{ href: "/sklep/certyfikaty", label: "Certyfikaty" },
] as const;

const MAIN_SECTION_HANDLES = new Set<string>([
	LISTING_CATEGORY_HANDLE.gotoweWzory,
	LISTING_CATEGORY_HANDLE.logo3d,
	LISTING_CATEGORY_HANDLE.certyfikaty,
]);

/**
 * Podmenu „Sklep” w navbarze mobilnym: sekcje + podkategorie gotowe-wzory z Medusy.
 */
export function buildShopMobileNavSub(tree: CategoryTreeNode[]): ShopNavLink[] {
	const subcategories = buildListingCategoryFilters(
		tree,
		LISTING_CATEGORY_HANDLE.gotoweWzory,
	)
		.filter((node) => !MAIN_SECTION_HANDLES.has(node.handle))
		.map((node) => ({
			href: categoryListingHref(node.handle, LISTING_BASE_PATH),
			label: node.name,
		}));

	return [...SHOP_MOBILE_MAIN_CATEGORIES, ...subcategories];
}
