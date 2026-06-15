import "server-only";
import { adminFetch } from "@moduly/magazyn-core";
import {
	DEFAULT_COLOR_CATEGORIES,
	type ColorCategoryDefinition,
	parseColorCategories,
	slugifyCategoryId,
} from "@magazyn/modules/products/color-categories";

const METADATA_KEY = "magazyn_color_categories";

type MedusaStore = { id: string; metadata?: Record<string, unknown> | null };

async function getStore(): Promise<MedusaStore> {
	const data = await adminFetch<{ stores: MedusaStore[] }>(
		"/admin/stores?limit=1&fields=id,metadata",
	);
	const store = data.stores[0];
	if (!store) throw new Error("Nie znaleziono sklepu w Medusa.");
	return store;
}

function readCategoriesRaw(store: MedusaStore): unknown {
	return store.metadata?.[METADATA_KEY];
}

export async function getColorCategories(): Promise<ColorCategoryDefinition[]> {
	try {
		const store = await getStore();
		return parseColorCategories(readCategoriesRaw(store));
	} catch {
		return DEFAULT_COLOR_CATEGORIES;
	}
}

async function saveColorCategories(categories: ColorCategoryDefinition[]): Promise<void> {
	const store = await getStore();
	await adminFetch(`/admin/stores/${store.id}`, {
		method: "POST",
		body: JSON.stringify({
			metadata: {
				...(store.metadata ?? {}),
				[METADATA_KEY]: JSON.stringify(categories),
			},
		}),
	});
}

export async function addColorCategory(label: string): Promise<ColorCategoryDefinition> {
	const trimmed = label.trim();
	if (trimmed.length < 2) {
		throw new Error("Nazwa kategorii musi mieć min. 2 znaki.");
	}

	const categories = await getColorCategories();
	const id = slugifyCategoryId(trimmed);
	if (categories.some((entry) => entry.id === id)) {
		throw new Error("Kategoria o takiej nazwie już istnieje.");
	}

	const created: ColorCategoryDefinition = {
		id,
		label: trimmed,
		matDefault: true,
	};

	await saveColorCategories([...categories, created]);
	return created;
}

export async function deleteColorCategory(categoryId: string): Promise<void> {
	const categories = await getColorCategories();
	const target = categories.find((entry) => entry.id === categoryId);
	if (!target) {
		throw new Error("Nie znaleziono kategorii.");
	}

	const next = categories.filter((entry) => entry.id !== categoryId);
	if (next.length === 0) {
		throw new Error("Musi zostać co najmniej jedna kategoria kolorów.");
	}

	await saveColorCategories(next);
}
