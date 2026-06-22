import "server-only";

import { revalidateTag } from "next/cache";
import { AdminApiError } from "@magazyn/core/medusa/errors";
import { loginWithEmailPassword } from "@magazyn/core/medusa/client";
import { serverEnv } from "@magazyn/core/env";
import { resolveMedusaAdminEmail } from "@magazyn/core/medusa/admin-email";
import { allocateUniqueProductHandles } from "./product-handle";

type MedusaProductRow = {
	id: string;
	title: string;
	handle: string;
	created_at?: string | null;
};

export type SyncProductHandlesResult = {
	total: number;
	updated: number;
	unchanged: number;
	updates: Array<{ id: string; from: string; to: string; title: string }>;
	errors: Array<{ id: string; handle: string; message: string }>;
};

async function fetchAllProducts(token: string): Promise<MedusaProductRow[]> {
	const products: MedusaProductRow[] = [];
	const limit = 100;
	let offset = 0;

	for (;;) {
		const res = await fetch(
			`${serverEnv.medusaBackendUrl}/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle,created_at`,
			{
				headers: { Authorization: `Bearer ${token}` },
				cache: "no-store",
				signal: AbortSignal.timeout(30_000),
			},
		);

		if (!res.ok) {
			const text = await res.text();
			throw new AdminApiError(`Nie udało się pobrać produktów (${res.status}).`, res.status);
		}

		const data = (await res.json()) as { products?: MedusaProductRow[] };
		const batch = data.products ?? [];
		products.push(...batch);

		if (batch.length < limit) break;
		offset += limit;
	}

	return products;
}

async function getServiceToken(): Promise<string> {
	const email = serverEnv.adminEmail ? resolveMedusaAdminEmail(serverEnv.adminEmail) : undefined;
	const password = serverEnv.adminPassword;
	if (!email || !password) {
		throw new AdminApiError("Brak MEDUSA_ADMIN_EMAIL / MEDUSA_ADMIN_PASSWORD.", 500);
	}
	return loginWithEmailPassword(email, password);
}

async function updateProductHandle(
	token: string,
	productId: string,
	handle: string,
): Promise<void> {
	const res = await fetch(`${serverEnv.medusaBackendUrl}/admin/products/${productId}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ handle }),
		cache: "no-store",
		signal: AbortSignal.timeout(30_000),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new AdminApiError(`Nie udało się zaktualizować handle (${res.status}).`, res.status);
	}
}

/**
 * Ustawia slugi wszystkich produktów w Medusie na podstawie aktualnych tytułów
 * i czyści cache storefrontu.
 */
export async function syncAllProductHandles(): Promise<SyncProductHandlesResult> {
	const token = await getServiceToken();
	const products = await fetchAllProducts(token);
	const targetHandles = allocateUniqueProductHandles(products);

	const result: SyncProductHandlesResult = {
		total: products.length,
		updated: 0,
		unchanged: 0,
		updates: [],
		errors: [],
	};

	for (const product of products) {
		const nextHandle = targetHandles.get(product.id);
		if (!nextHandle) continue;

		const currentHandle = product.handle.trim();
		if (currentHandle === nextHandle) {
			result.unchanged += 1;
			continue;
		}

		try {
			await updateProductHandle(token, product.id, nextHandle);
			result.updated += 1;
			result.updates.push({
				id: product.id,
				from: currentHandle,
				to: nextHandle,
				title: product.title,
			});
		} catch (error) {
			result.errors.push({
				id: product.id,
				handle: currentHandle,
				message: error instanceof Error ? error.message : "Nieznany błąd",
			});
		}
	}

	revalidateTag("medusa-products", "max");
	revalidateTag("medusa-categories", "max");

	return result;
}
