import "server-only";
import { adminFetch } from "@magazyn/core/medusa/client";

export type AdminCategory = {
	id: string;
	name: string;
	handle: string;
	description: string;
	isActive: boolean;
	productCount: number;
};

type MedusaCategory = {
	id: string;
	name: string;
	handle: string;
	description?: string | null;
	is_active?: boolean;
	products?: Array<{ id: string }> | null;
};

export async function listCategories(): Promise<AdminCategory[]> {
	const data = await adminFetch<{ product_categories: MedusaCategory[] }>(
		"/admin/product-categories?limit=100&fields=id,name,handle,description,is_active,products.id",
	);

	return data.product_categories
		.map((category) => ({
			id: category.id,
			name: category.name,
			handle: category.handle,
			description: category.description ?? "",
			isActive: category.is_active ?? true,
			productCount: category.products?.length ?? 0,
		}))
		.sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

export type CategoryInput = {
	name: string;
	handle: string;
	description?: string;
	isActive: boolean;
};

export async function createCategory(input: CategoryInput): Promise<void> {
	await adminFetch("/admin/product-categories", {
		method: "POST",
		body: JSON.stringify({
			name: input.name,
			handle: input.handle,
			description: input.description ?? "",
			is_active: input.isActive,
			is_internal: false,
		}),
	});
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
	await adminFetch(`/admin/product-categories/${id}`, {
		method: "POST",
		body: JSON.stringify({
			name: input.name,
			handle: input.handle,
			description: input.description ?? "",
			is_active: input.isActive,
		}),
	});
}

export async function deleteCategory(id: string): Promise<void> {
	await adminFetch(`/admin/product-categories/${id}`, { method: "DELETE" });
}
