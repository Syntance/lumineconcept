import "server-only";
import { cache } from "react";
import { adminFetch } from "@magazyn/core/medusa/client";
import { resolveMedusaMediaUrl, resolveMedusaMediaUrls } from "@magazyn/core/medusa/media-url";
import { magazynConfig } from "@magazyn/magazyn.config";

export type ProductStatus = "draft" | "published";

/** Wartości formularza produktu — wspólne dla dodawania i edycji. */
export type ProductFormValues = {
	title: string;
	handle: string;
	status: ProductStatus;
	categoryId: string | null;
	description: string;
	/** Cena w najmniejszej jednostce (grosze) w walucie z magazyn.config.ts. */
	price: number | null;
	images: string[];
};

export type AdminProductRow = {
	id: string;
	title: string;
	handle: string;
	status: ProductStatus;
	thumbnail: string | null;
	categoryName: string | null;
	price: number | null;
};

export type AdminProductDetail = ProductFormValues & {
	id: string;
	variantId: string | null;
	/** ID ceny PLN pierwszego wariantu — wymagane do poprawnej aktualizacji w Medusa v2. */
	priceId: string | null;
};

export type CategoryOption = { id: string; name: string };

const CURRENCY = magazynConfig.currency;

type MedusaPrice = { id?: string; currency_code: string; amount: number };
type MedusaVariant = { id: string; prices?: MedusaPrice[] | null };
type MedusaProduct = {
	id: string;
	title: string;
	handle: string;
	status: ProductStatus;
	description?: string | null;
	thumbnail?: string | null;
	images?: Array<{ url?: string | null }> | null;
	categories?: Array<{ id: string; name: string }> | null;
	variants?: MedusaVariant[] | null;
};

/**
 * Konwertuje cenę z Medusa API (decimal w głównej jednostce, np. 100.50 zł)
 * na wartość w groszach (integer, np. 10050).
 * Medusa v2 zwraca ceny jako decimal, ale magazyn oczekuje minor units (grosze).
 */
function toMinorUnits(amount: number | null | undefined): number {
	return Math.round((amount ?? 0) * 100);
}

/** Grosze → PLN (decimal), zgodnie z konwencją Medusa v2 i endpointem base-price. */
function minorUnitsToPln(minor: number): number {
	return Math.round(minor) / 100;
}

function priceOf(variant: MedusaVariant | undefined, currency: string): number | null {
	const price = variant?.prices?.find((p) => p.currency_code === currency);
	return price ? toMinorUnits(price.amount) : null;
}

function priceIdOf(variant: MedusaVariant | undefined, currency: string): string | null {
	const price = variant?.prices?.find((p) => p.currency_code === currency);
	return price?.id ?? null;
}

const LIST_FIELDS =
	"id,title,handle,status,thumbnail,images.url,categories.id,categories.name,variants.prices.id,variants.prices.amount,variants.prices.currency_code";

const DETAIL_FIELDS =
	"id,title,handle,status,description,thumbnail,images.url,categories.id,categories.name,variants.id,variants.prices.id,variants.prices.amount,variants.prices.currency_code";

function thumbnailOf(product: MedusaProduct): string | null {
	const fromImages = resolveMedusaMediaUrls((product.images ?? []).map((i) => i.url));
	const resolved = [resolveMedusaMediaUrl(product.thumbnail), ...fromImages].filter((u): u is string => Boolean(u));
	return resolved[0] ?? null;
}

/** Domyślny sales channel + shipping profile — wymagane przy tworzeniu produktu. */
export const getStoreConfig = cache(async (): Promise<{ salesChannelId: string | null; shippingProfileId: string | null }> => {
	const [channels, profiles] = await Promise.all([
		adminFetch<{ sales_channels: Array<{ id: string }> }>("/admin/sales-channels?limit=1"),
		adminFetch<{ shipping_profiles: Array<{ id: string }> }>("/admin/shipping-profiles?limit=1"),
	]);
	return {
		salesChannelId: channels.sales_channels[0]?.id ?? null,
		shippingProfileId: profiles.shipping_profiles[0]?.id ?? null,
	};
});

export async function listCategoryOptions(): Promise<CategoryOption[]> {
	const data = await adminFetch<{
		product_categories: Array<{
			id: string;
			name: string;
			parent_category?: { name: string } | null;
		}>;
	}>("/admin/product-categories?limit=100&fields=id,name,parent_category.name");

	return data.product_categories
		.map((c) => {
			const parent = c.parent_category?.name?.trim();
			return {
				id: c.id,
				name: parent ? `${parent} / ${c.name}` : c.name,
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

export async function listAdminProducts(): Promise<AdminProductRow[]> {
	const data = await adminFetch<{ products: MedusaProduct[] }>(`/admin/products?limit=200&fields=${LIST_FIELDS}`);

	return data.products.map((product) => {
		const variant = product.variants?.[0];
		return {
			id: product.id,
			title: product.title,
			handle: product.handle,
			status: product.status,
			thumbnail: thumbnailOf(product),
			categoryName: product.categories?.[0]?.name ?? null,
			price: priceOf(variant, CURRENCY),
		};
	});
}

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
	const data = await adminFetch<{ product: MedusaProduct }>(`/admin/products/${id}?fields=${DETAIL_FIELDS}`);
	const product = data.product;
	if (!product) return null;

	const variant = product.variants?.[0];
	return {
		id: product.id,
		variantId: variant?.id ?? null,
		priceId: priceIdOf(variant, CURRENCY),
		title: product.title,
		handle: product.handle,
		status: product.status,
		categoryId: product.categories?.[0]?.id ?? null,
		description: product.description ?? "",
		price: priceOf(variant, CURRENCY),
		images: resolveMedusaMediaUrls((product.images ?? []).map((i) => i.url)),
	};
}

function buildPrices(values: ProductFormValues, existingPriceId?: string | null): MedusaPrice[] {
	if (values.price == null) return [];
	const amount = minorUnitsToPln(values.price);
	const price: MedusaPrice = { currency_code: CURRENCY, amount };
	if (existingPriceId) price.id = existingPriceId;
	return [price];
}

/**
 * Cena wyświetlana na storefrontzie: metadata.base_price (używana gdy brak ceny wariantu
 * lub jako fallback). Ten sam endpoint co w natywnym panelu Medusa Lumine.
 */
async function syncProductBasePrice(productId: string, priceMinor: number): Promise<void> {
	const basePrice = minorUnitsToPln(priceMinor);
	await adminFetch(`/admin/products/${productId}/base-price`, {
		method: "POST",
		body: JSON.stringify({ base_price: basePrice }),
	});
}

export async function createAdminProduct(values: ProductFormValues): Promise<string> {
	const { salesChannelId, shippingProfileId } = await getStoreConfig();

	const body: Record<string, unknown> = {
		title: values.title.trim(),
		handle: values.handle.trim(),
		status: values.status,
		description: values.description.trim(),
		images: resolveMedusaMediaUrls(values.images).map((url) => ({ url })),
		options: [{ title: "Typ", values: ["Domyślny"] }],
		variants: [
			{ title: "Domyślny", options: { Typ: "Domyślny" }, manage_inventory: false, prices: buildPrices(values) },
		],
	};

	if (values.categoryId) body.categories = [{ id: values.categoryId }];
	if (shippingProfileId) body.shipping_profile_id = shippingProfileId;
	if (salesChannelId) body.sales_channels = [{ id: salesChannelId }];

	const data = await adminFetch<{ product: { id: string } }>("/admin/products", {
		method: "POST",
		body: JSON.stringify(body),
	});
	const productId = data.product.id;
	if (values.price != null) {
		await syncProductBasePrice(productId, values.price);
	}
	return productId;
}

export async function updateAdminProduct(
	id: string,
	values: ProductFormValues,
	existingHandle?: string | null,
): Promise<void> {
	const body: Record<string, unknown> = {
		title: values.title.trim(),
		status: values.status,
		description: values.description.trim(),
		images: resolveMedusaMediaUrls(values.images).map((url) => ({ url })),
	};

	/** Nie nadpisuj handle przy edycji — slug z tytułu mógłby złamać URL produktu. */
	if (existingHandle) {
		body.handle = existingHandle;
	} else {
		body.handle = values.handle.trim();
	}

	/** Pusta kategoria = nie wysyłaj `categories` — Medusa wtedy kasuje przypisanie do drzewa sklepu. */
	if (values.categoryId) {
		body.categories = [{ id: values.categoryId }];
	}

	await adminFetch(`/admin/products/${id}`, { method: "POST", body: JSON.stringify(body) });

	if (values.price != null) {
		await syncProductBasePrice(id, values.price);
	}
}

export async function deleteAdminProduct(id: string): Promise<void> {
	await adminFetch(`/admin/products/${id}`, { method: "DELETE" });
}
