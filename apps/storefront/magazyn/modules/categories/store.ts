import "server-only";
import { adminFetch } from "@magazyn/core/medusa/client";
import { LISTING_CATEGORY_HANDLE } from "@/lib/medusa/category-tree";
import {
	CATEGORY_SORT_METADATA_KEY,
	categorySortOrderMetadata,
	compareCategoriesBySortOrder,
	parseCategorySortOrder,
} from "@/lib/medusa/category-sort";

/** Rooty struktury sklepu — nie tworzymy ich w magazynie, nie przenosimy pod „gotowe-wzory”. */
const SHOP_ROOT_HANDLES = new Set<string>([
	LISTING_CATEGORY_HANDLE.gotoweWzory,
	LISTING_CATEGORY_HANDLE.logo3d,
	LISTING_CATEGORY_HANDLE.certyfikaty,
]);

export type AdminCategory = {
	id: string;
	name: string;
	handle: string;
	description: string;
	isActive: boolean;
	productCount: number;
	sortOrder: number;
	/** true = kategoria nie jest dzieckiem „gotowe-wzory” — nie pojawi się w filtrach sklepu. */
	needsReparent: boolean;
};

type MedusaCategory = {
	id: string;
	name: string;
	handle: string;
	description?: string | null;
	is_active?: boolean;
	parent_category_id?: string | null;
	parent_category?: { id?: string; handle?: string } | null;
	metadata?: Record<string, unknown> | null;
	products?: Array<{ id: string }> | null;
};

const CATEGORY_FIELDS =
	"id,name,handle,description,is_active,parent_category_id,parent_category.handle,metadata,products.id";

async function fetchAllCategories(): Promise<MedusaCategory[]> {
	const data = await adminFetch<{ product_categories: MedusaCategory[] }>(
		`/admin/product-categories?limit=100&fields=${CATEGORY_FIELDS}`,
	);
	return data.product_categories ?? [];
}

function gotoweWzoryId(categories: MedusaCategory[]): string | null {
	return categories.find((c) => c.handle === LISTING_CATEGORY_HANDLE.gotoweWzory)?.id ?? null;
}

function resolveParentForHandle(
	handle: string,
	gotoweId: string | null,
): string | null | undefined {
	if (SHOP_ROOT_HANDLES.has(handle)) return null;
	if (!gotoweId) {
		throw new Error(
			"Brak kategorii „Gotowe wzory” w Medusie. Uruchom sync kategorii (pnpm sync-medusa-categories).",
		);
	}
	return gotoweId;
}

function nextSortOrder(categories: MedusaCategory[], gotoweId: string | null): number {
	const siblings = categories.filter(
		(c) => c.parent_category_id === gotoweId && !SHOP_ROOT_HANDLES.has(c.handle),
	);
	let max = -1;
	for (const category of siblings) {
		max = Math.max(max, parseCategorySortOrder(category.metadata));
	}
	return max + 1;
}

function mergeMetadata(
	existing: Record<string, unknown> | null | undefined,
	sortOrder: number,
): Record<string, string> {
	const base: Record<string, string> = {};
	if (existing) {
		for (const [key, value] of Object.entries(existing)) {
			if (value === null || value === undefined) continue;
			base[key] = typeof value === "string" ? value : String(value);
		}
	}
	return { ...base, ...categorySortOrderMetadata(sortOrder) };
}

function toAdminCategory(
	category: MedusaCategory,
	gotoweId: string | null,
): AdminCategory {
	const isRoot = SHOP_ROOT_HANDLES.has(category.handle);
	const underGotowe = Boolean(gotoweId && category.parent_category_id === gotoweId);
	return {
		id: category.id,
		name: category.name,
		handle: category.handle,
		description: category.description ?? "",
		isActive: category.is_active ?? true,
		productCount: category.products?.length ?? 0,
		sortOrder: parseCategorySortOrder(category.metadata),
		needsReparent: !isRoot && !underGotowe,
	};
}

/**
 * Kategorie zarządzane w magazynie = podkategorie „gotowe-wzory” (te same co w filtrach sklepu).
 * Rooty sklepu (gotowe-wzory, logo-3d, certyfikaty) są ukryte — tworzy je sync backendu.
 */
export async function listCategories(): Promise<AdminCategory[]> {
	const all = await fetchAllCategories();
	const gotoweId = gotoweWzoryId(all);

	return all
		.filter((category) => !SHOP_ROOT_HANDLES.has(category.handle))
		.map((category) => toAdminCategory(category, gotoweId))
		.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "pl"));
}

export type CategoryInput = {
	name: string;
	handle: string;
	description?: string;
	isActive: boolean;
};

export async function createCategory(input: CategoryInput): Promise<void> {
	const all = await fetchAllCategories();
	const gotoweId = gotoweWzoryId(all);
	const parentId = resolveParentForHandle(input.handle, gotoweId);
	const sortOrder = nextSortOrder(all, gotoweId);

	await adminFetch("/admin/product-categories", {
		method: "POST",
		body: JSON.stringify({
			name: input.name,
			handle: input.handle,
			description: input.description ?? "",
			is_active: input.isActive,
			is_internal: false,
			parent_category_id: parentId ?? undefined,
			metadata: categorySortOrderMetadata(sortOrder),
		}),
	});
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
	const all = await fetchAllCategories();
	const gotoweId = gotoweWzoryId(all);
	const parentId = resolveParentForHandle(input.handle, gotoweId);
	const existing = all.find((c) => c.id === id);
	const sortOrder = existing
		? parseCategorySortOrder(existing.metadata)
		: nextSortOrder(all, gotoweId);

	await adminFetch(`/admin/product-categories/${id}`, {
		method: "POST",
		body: JSON.stringify({
			name: input.name,
			handle: input.handle,
			description: input.description ?? "",
			is_active: input.isActive,
			parent_category_id: parentId ?? null,
			metadata: mergeMetadata(existing?.metadata, sortOrder),
		}),
	});
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
	const all = await fetchAllCategories();

	for (let index = 0; index < orderedIds.length; index++) {
		const id = orderedIds[index];
		const existing = all.find((c) => c.id === id);
		if (!existing) continue;

		await adminFetch(`/admin/product-categories/${id}`, {
			method: "POST",
			body: JSON.stringify({
				metadata: mergeMetadata(existing.metadata, index),
			}),
		});
	}
}

export async function deleteCategory(id: string): Promise<void> {
	await adminFetch(`/admin/product-categories/${id}`, { method: "DELETE" });
}

/** Eksport do testów / spójności sortowania z PLP. */
export { compareCategoriesBySortOrder, parseCategorySortOrder, CATEGORY_SORT_METADATA_KEY };
