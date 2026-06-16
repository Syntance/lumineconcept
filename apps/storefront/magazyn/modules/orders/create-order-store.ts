import "server-only";

import { cache } from "react";
import { adminFetch } from "@magazyn/core/medusa/client";
import { resolveMedusaMediaUrl, resolveMedusaMediaUrls } from "@magazyn/core/medusa/media-url";
import { magazynConfig } from "@magazyn/magazyn.config";
import { getStoreConfig } from "@magazyn/modules/products/store";
import { SYSTEM_PAYMENT_PROVIDER_ID } from "./order-payment-provider";
import type {
	ManualOrderInput,
	OrderFormOptions,
	OrderFormProductOption,
	OrderFormShippingOption,
} from "./create-order-types";

const CURRENCY = magazynConfig.currency;

const PICKER_FIELDS =
	"id,title,status,thumbnail,images.url,variants.id,variants.prices.amount,variants.prices.currency_code";

type MedusaVariant = {
	id: string;
	prices?: Array<{ amount?: number; currency_code?: string }> | null;
};

type MedusaProduct = {
	id: string;
	title: string;
	status?: "draft" | "published" | "proposed" | "rejected";
	thumbnail?: string | null;
	images?: Array<{ url?: string | null }> | null;
	variants?: MedusaVariant[] | null;
};

type MedusaShippingOption = {
	id: string;
	name: string;
	prices?: Array<{ amount?: number; currency_code?: string }> | null;
};

function toMinorUnits(amount: number | null | undefined): number {
	return Math.round((amount ?? 0) * 100);
}

function minorUnitsToPln(minor: number): number {
	return Math.round(minor) / 100;
}

function priceOf(variant: MedusaVariant | undefined): number | null {
	const price = variant?.prices?.find((p) => p.currency_code === CURRENCY);
	return price ? toMinorUnits(price.amount) : null;
}

function productThumbnail(product: MedusaProduct): string | null {
	const urls = resolveMedusaMediaUrls((product.images ?? []).map((image) => image.url));
	const thumb = resolveMedusaMediaUrl(product.thumbnail);
	if (!thumb) return urls[0] ?? null;
	const rest = urls.filter((url) => url !== thumb);
	return [thumb, ...rest][0] ?? null;
}

function mapProductToPickerOption(product: MedusaProduct): OrderFormProductOption | null {
	const variant = product.variants?.[0];
	if (!variant?.id) return null;
	return {
		productId: product.id,
		variantId: variant.id,
		title: product.title,
		thumbnail: productThumbnail(product),
		priceMinor: priceOf(variant),
	};
}

function mapProducts(data: MedusaProduct[]): OrderFormProductOption[] {
	return data
		.filter((product) => product.status === "published")
		.map(mapProductToPickerOption)
		.filter((row): row is OrderFormProductOption => row != null);
}

async function getAdminPolishRegionId(): Promise<string> {
	const fromEnv = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID?.trim();
	if (fromEnv) return fromEnv;

	const data = await adminFetch<{
		regions: Array<{ id: string; countries?: Array<{ iso_2?: string }> }>;
	}>("/admin/regions?limit=50&fields=id,countries.iso_2");

	const region = data.regions.find((row) => row.countries?.some((country) => country.iso_2 === "pl"));
	if (!region?.id) {
		throw new Error("Nie znaleziono regionu PL. Ustaw NEXT_PUBLIC_MEDUSA_REGION_ID lub dodaj region w Medusie.");
	}
	return region.id;
}

const listShippingOptionsForOrder = cache(async (): Promise<OrderFormShippingOption[]> => {
	const data = await adminFetch<{ shipping_options: MedusaShippingOption[] }>(
		"/admin/shipping-options?limit=50&fields=id,name,prices.amount,prices.currency_code",
	);

	return (data.shipping_options ?? []).map((option) => {
		const price = option.prices?.find((row) => row.currency_code === CURRENCY);
		return {
			id: option.id,
			name: option.name,
			amountMinor: toMinorUnits(price?.amount),
		};
	});
});

export async function listOrderFormProducts(limit = 30): Promise<OrderFormProductOption[]> {
	const fetchLimit = Math.min(Math.max(limit * 3, limit), 200);
	const data = await adminFetch<{ products: MedusaProduct[] }>(
		`/admin/products?limit=${fetchLimit}&order=title&fields=${PICKER_FIELDS}`,
	);
	return mapProducts(data.products ?? []).slice(0, limit);
}

export async function searchOrderFormProducts(query: string): Promise<OrderFormProductOption[]> {
	const trimmed = query.trim();
	if (trimmed.length < 2) return listOrderFormProducts(20);

	const data = await adminFetch<{ products: MedusaProduct[] }>(
		`/admin/products?limit=50&q=${encodeURIComponent(trimmed)}&fields=${PICKER_FIELDS}`,
	);
	return mapProducts(data.products ?? []).slice(0, 20);
}

export const getOrderFormOptions = cache(async (): Promise<OrderFormOptions> => {
	const [shippingOptions, initialProducts] = await Promise.all([
		listShippingOptionsForOrder(),
		listOrderFormProducts(30),
	]);
	return { shippingOptions, initialProducts };
});

const SOURCE_LABELS: Record<ManualOrderInput["sourceChannel"], string> = {
	instagram: "Instagram",
	email: "E-mail",
	telefon: "Telefon",
	inne: "Inne",
};

export async function createManualOrder(input: ManualOrderInput): Promise<{ orderId: string }> {
	const [regionId, storeConfig, shippingOptions] = await Promise.all([
		getAdminPolishRegionId(),
		getStoreConfig(),
		listShippingOptionsForOrder(),
	]);

	if (!storeConfig.salesChannelId) {
		throw new Error("Brak sales channel w Medusie — skonfiguruj kanał sprzedaży.");
	}

	const shipping = shippingOptions.find((option) => option.id === input.shippingOptionId);
	if (!shipping) {
		throw new Error("Wybrana metoda dostawy nie istnieje. Odśwież stronę i spróbuj ponownie.");
	}

	const address = {
		first_name: input.firstName,
		last_name: input.lastName,
		address_1: input.address1,
		postal_code: input.postalCode,
		city: input.city,
		country_code: "pl",
		phone: input.phone?.trim() || undefined,
		company: input.companyName?.trim() || undefined,
	};

	const metadata: Record<string, string> = {
		payment_provider_id: SYSTEM_PAYMENT_PROVIDER_ID,
		payment: "Przelew tradycyjny",
		shipping: shipping.name,
		manual_order_source: SOURCE_LABELS[input.sourceChannel],
	};

	if (input.orderNotes?.trim()) metadata.order_notes = input.orderNotes.trim();
	if (input.nip?.trim()) metadata.nip = input.nip.trim();
	if (input.companyName?.trim()) metadata.companyName = input.companyName.trim();
	if (input.invoiceRequested) metadata.invoice = "true";

	const draft = await adminFetch<{ draft_order: { id: string } }>("/admin/draft-orders", {
		method: "POST",
		body: JSON.stringify({
			region_id: regionId,
			sales_channel_id: storeConfig.salesChannelId,
			email: input.email.trim(),
			items: input.items.map((item) => ({
				variant_id: item.variantId,
				quantity: item.quantity,
				...(item.metadata && Object.keys(item.metadata).length > 0 ? { metadata: item.metadata } : {}),
			})),
			shipping_address: address,
			billing_address: address,
			shipping_methods: [
				{
					shipping_option_id: shipping.id,
					name: shipping.name,
					amount: minorUnitsToPln(shipping.amountMinor),
				},
			],
			metadata,
			no_notification_order: !input.sendConfirmationEmail,
		}),
	});

	const converted = await adminFetch<{ order: { id: string } }>(
		`/admin/draft-orders/${draft.draft_order.id}/convert-to-order`,
		{ method: "POST", body: JSON.stringify({}) },
	);

	if (!converted.order?.id) {
		throw new Error("Zamówienie zostało utworzone, ale nie udało się pobrać jego identyfikatora.");
	}

	return { orderId: converted.order.id };
}
