import {
	buildListingCategoryFilters,
	LISTING_CATEGORY_HANDLE,
	type CategoryTreeNode,
} from "@/lib/medusa/category-tree";
import { categoryListingHref } from "@/lib/medusa/shop-breadcrumbs";

export type ShopNavLink = { href: string; label: string };

const LISTING_BASE_PATH = "/sklep/gotowe-wzory";

const EXCLUDED_SUB_HANDLES = new Set<string>([
	LISTING_CATEGORY_HANDLE.gotoweWzory,
	LISTING_CATEGORY_HANDLE.logo3d,
]);

/** Podkategorie listingu „Gotowe wzory” z Medusy (Cenniki, Certyfikaty, …). */
export function buildGotoweWzoryMobileSub(tree: CategoryTreeNode[]): ShopNavLink[] {
	return buildListingCategoryFilters(tree, LISTING_CATEGORY_HANDLE.gotoweWzory)
		.filter((node) => !EXCLUDED_SUB_HANDLES.has(node.handle))
		.map((node) => ({
			href: categoryListingHref(node.handle, LISTING_BASE_PATH),
			label: node.name,
		}));
}
