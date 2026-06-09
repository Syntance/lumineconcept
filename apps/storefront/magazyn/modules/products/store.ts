import "server-only";
import { cache } from "react";
import { adminFetch } from "@magazyn/core/medusa/client";
import { resolveMedusaMediaUrl, resolveMedusaMediaUrls } from "@magazyn/core/medusa/media-url";
import { magazynConfig } from "@magazyn/magazyn.config";
import {
	buildColorOptionTitles,
	isColorSlotTitle,
	parseAllowCustomColorBySlot,
	parseCustomSlotNames,
	parseDisabledColorCategoriesBySlot,
	parseDisabledConfigIdsBySlot,
	parseMatOverridesBySlot,
	parseProductColorsBySlot,
	type ProductCustomColor,
} from "@/lib/products/color-slot-config";
import { LISTING_CATEGORY_HANDLE, isShopSectionRoot } from "@/lib/medusa/category-tree";
import { compareCategoriesBySortOrder } from "@/lib/medusa/category-sort";
import type { TextFieldDef } from "@/lib/products/text-fields";
import { parseTextFieldsFromMetadata, serializeTextFieldsForMetadata } from "@/lib/products/text-fields";
import {
	parseUploadSettingsFromMetadata,
	serializeUploadSettingsForMetadata,
	type ProductUploadSettings,
} from "@/lib/products/upload-settings";
import {
	findCategoryDefinition,
	type ColorCategoryId,
	normalizeHexInput,
} from "./color-categories";
import { getColorCategories } from "@magazyn/modules/settings/color-category-store";

export { buildColorOptionTitles } from "@/lib/products/color-slot-config";

export type ProductStatus = "draft" | "published";

export type ConfigOption = {
	id: string;
	type: string;
	name: string;
	hex_color: string | null;
	color_category: string | null;
	mat_allowed: boolean;
	sort_order: number;
};

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
	/** ID globalnych opcji wyłączonych (rozmiary, materiały itd. — bez kolorów). */
	disabledConfigIds: string[];
	/** Wyłączone kolory per pole „Kolor”, „Kolor 2”… (metadata.disabled_config_ids_by_slot). */
	disabledConfigIdsBySlot: Record<string, string[]>;
	/** Wyłączone kategorie kolorów per pole (metadata.disabled_color_categories_by_slot). */
	disabledColorCategoriesBySlot: Record<string, string[]>;
	/** Własny HEX od klienta per pole koloru (legacy — OR po kategoriach). */
	allowCustomColorBySlot: Record<string, boolean>;
	/** Kolory zdefiniowane tylko dla tego produktu (metadata.product_colors_by_slot). */
	productColorsBySlot: Record<string, Record<string, ProductCustomColor[]>>;
	/** Nadpisania mat_allowed per pole koloru (metadata.mat_overrides_by_slot). */
	matOverridesBySlot: Record<string, Record<string, boolean>>;
	/** Liczba pól „Kolor” w konfiguratorze (1 = samo „Kolor”, 2+ = „Kolor 2”…). */
	colorSlotCount: number;
	/** Custom nazwy pól kolorów (metadata.color_slot_names). */
	colorSlotNames?: string[];
	/** Legacy fallback — metadata.allow_custom_color. */
	allowCustomColor: boolean;
	/** Pola tekstowe konfiguratora (metadata.text_fields). */
	textFields: TextFieldDef[];
	/** Wgrywanie plików przez klienta (metadata.uploads_*). */
	uploadSettings: ProductUploadSettings;
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
	metadata: Record<string, unknown>;
};

export type CategoryOption = { id: string; name: string };

const CURRENCY = magazynConfig.currency;

type MedusaPrice = { id?: string; currency_code: string; amount: number };
type MedusaVariant = {
	id: string;
	title?: string;
	options?: Record<string, string> | null;
	prices?: MedusaPrice[] | null;
};
type MedusaProductOption = {
	id?: string;
	title: string;
	values?: Array<{ value: string }> | null;
};
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
	options?: MedusaProductOption[] | null;
	metadata?: Record<string, unknown> | null;
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
	"id,title,handle,status,description,thumbnail,images.url,categories.id,categories.name,metadata,options.id,options.title,options.values.value,variants.id,variants.title,variants.options,variants.prices.id,variants.prices.amount,variants.prices.currency_code";

export function parseDisabledConfigIds(meta: Record<string, unknown> | null | undefined): string[] {
	const raw = meta?.disabled_config_ids;
	if (typeof raw === "string") {
		try {
			const parsed: unknown = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
		} catch {
			return [];
		}
	}
	if (Array.isArray(raw)) {
		return raw.filter((x): x is string => typeof x === "string");
	}
	return [];
}

function isColorOptionTitle(title: string): boolean {
	return isColorSlotTitle(title);
}

export function countColorSlotsFromOptions(options: MedusaProductOption[]): number {
	const colorCount = options.filter((o) => isColorOptionTitle(o.title)).length;
	return colorCount > 0 ? colorCount : 1;
}

export function parseAllowCustomColor(meta: Record<string, unknown> | null | undefined): boolean {
	return meta?.allow_custom_color !== "false";
}

export type CreateColorOptionInput = {
	name: string;
	hex_color: string;
	color_category: ColorCategoryId;
};

export async function createGlobalColorOption(input: CreateColorOptionInput): Promise<ConfigOption> {
	const name = input.name.trim();
	const hex = normalizeHexInput(input.hex_color);
	if (!name || name.length < 2) {
		throw new Error("Nazwa koloru musi mieć min. 2 znaki.");
	}
	if (!hex) {
		throw new Error("Podaj poprawny kolor HEX (np. #AF7C61) lub „transparent”.");
	}

	const allColors = (await listGlobalConfigOptions()).filter((o) => o.type === "color");
	const inCategory = allColors.filter((o) => (o.color_category ?? "standard") === input.color_category);
	const maxSort = inCategory.reduce((max, o) => Math.max(max, o.sort_order), -1);
	const categories = await getColorCategories();
	const section = findCategoryDefinition(categories, input.color_category);
	if (!section) {
		throw new Error("Nieznana kategoria koloru.");
	}

	const data = await adminFetch<{ config_option: ConfigOption }>("/admin/product-config", {
		method: "POST",
		body: JSON.stringify({
			type: "color",
			name,
			hex_color: hex,
			color_category: input.color_category,
			mat_allowed: section?.matDefault ?? true,
			sort_order: maxSort + 1,
			metadata: null,
		}),
	});

	return data.config_option;
}

export async function deleteGlobalColorOption(id: string): Promise<void> {
	await adminFetch(`/admin/product-config/${id}`, { method: "DELETE" });
}

export async function updateGlobalColorOption(
	id: string,
	patch: Pick<ConfigOption, "mat_allowed">,
): Promise<ConfigOption> {
	const data = await adminFetch<{ config_option: ConfigOption }>(`/admin/product-config/${id}`, {
		method: "POST",
		body: JSON.stringify(patch),
	});
	return data.config_option;
}

export async function listGlobalConfigOptions(): Promise<ConfigOption[]> {
	const data = await adminFetch<{ config_options: ConfigOption[] }>("/admin/product-config");
	return (data.config_options ?? []).sort((a, b) => {
		if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
		return a.name.localeCompare(b.name, "pl");
	});
}

async function syncProductConfiguratorSettings(productId: string, values: ProductFormValues): Promise<void> {
	const current = await adminFetch<{ product: MedusaProduct }>(
		`/admin/products/${productId}?fields=metadata`,
	);
	const existingMeta = (current.product.metadata ?? {}) as Record<string, unknown>;

	await adminFetch(`/admin/products/${productId}`, {
		method: "POST",
		body: JSON.stringify({
			metadata: {
				...existingMeta,
				disabled_config_ids: JSON.stringify(values.disabledConfigIds),
				disabled_config_ids_by_slot: JSON.stringify(values.disabledConfigIdsBySlot),
				disabled_color_categories_by_slot: JSON.stringify(values.disabledColorCategoriesBySlot),
				allow_custom_color_by_slot: JSON.stringify(
					Object.fromEntries(
						Object.entries(values.allowCustomColorBySlot).map(([title, enabled]) => [
							title,
							enabled ? "true" : "false",
						]),
					),
				),
				allow_custom_color: Object.values(values.allowCustomColorBySlot).some(Boolean)
					? "true"
					: "false",
				product_colors_by_slot: JSON.stringify(values.productColorsBySlot),
				mat_overrides_by_slot: JSON.stringify(values.matOverridesBySlot),
				color_slot_names: values.colorSlotNames ? JSON.stringify(values.colorSlotNames) : undefined,
				text_fields: JSON.stringify(serializeTextFieldsForMetadata(values.textFields)),
				...serializeUploadSettingsForMetadata(values.uploadSettings),
			},
		}),
	});
}

async function syncProductColorOptions(
	productId: string,
	colorSlotCount: number,
	existingOptions: MedusaProductOption[],
	colorSlotNames?: string[],
): Promise<void> {
	const nonColorOptions = existingOptions.filter((o) => !isColorOptionTitle(o.title));
	const colorTitles = buildColorOptionTitles(colorSlotCount, colorSlotNames);

	const colorOptions = colorTitles.map((title) => {
		const existing = existingOptions.find((o) => o.title === title);
		const values = (existing?.values ?? []).map((v) => v.value).filter(Boolean);
		return { title, values: values.length > 0 ? values : ["Standard"] };
	});

	await adminFetch(`/admin/products/${productId}`, {
		method: "POST",
		body: JSON.stringify({
			options: [
				...nonColorOptions.map((o) => ({
					title: o.title,
					values: (o.values ?? []).map((v) => v.value),
				})),
				...colorOptions,
			],
		}),
	});
}

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
			handle: string;
			parent_category_id?: string | null;
			metadata?: Record<string, unknown> | null;
		}>;
	}>("/admin/product-categories?limit=100&fields=id,name,handle,parent_category_id,metadata");

	const gotoweId = data.product_categories.find(
		(c) => c.handle === LISTING_CATEGORY_HANDLE.gotoweWzory,
	)?.id;

	return data.product_categories
		.filter((c) => !isShopSectionRoot(c))
		.filter((c) => !gotoweId || c.parent_category_id === gotoweId)
		.sort(compareCategoriesBySortOrder)
		.map((c) => ({
			id: c.id,
			name: c.name,
		}));
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
	const options = product.options ?? [];
	const colorSlotCount = countColorSlotsFromOptions(options);
	const metadata = (product.metadata ?? {}) as Record<string, unknown>;
	const customNames = parseCustomSlotNames(metadata);
	const slotTitles = buildColorOptionTitles(colorSlotCount, customNames);
	const legacyDisabled = parseDisabledConfigIds(metadata);
	const defaultAllowCustom = parseAllowCustomColor(metadata);

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
		disabledConfigIds: legacyDisabled,
		disabledConfigIdsBySlot: parseDisabledConfigIdsBySlot(metadata, slotTitles, []),
		disabledColorCategoriesBySlot: parseDisabledColorCategoriesBySlot(metadata, slotTitles),
		allowCustomColorBySlot: parseAllowCustomColorBySlot(metadata, slotTitles, defaultAllowCustom),
		productColorsBySlot: parseProductColorsBySlot(metadata, slotTitles),
		matOverridesBySlot: parseMatOverridesBySlot(metadata, slotTitles),
		colorSlotCount,
		colorSlotNames: customNames ?? slotTitles,
		allowCustomColor: defaultAllowCustom,
		textFields: parseTextFieldsFromMetadata(metadata),
		uploadSettings: parseUploadSettingsFromMetadata(metadata),
		metadata,
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
	const colorTitles = buildColorOptionTitles(values.colorSlotCount, values.colorSlotNames);
	const colorOptionsRecord = Object.fromEntries(colorTitles.map((t) => [t, "Standard"]));

	const body: Record<string, unknown> = {
		title: values.title.trim(),
		handle: values.handle.trim(),
		status: values.status,
		description: values.description.trim(),
		images: resolveMedusaMediaUrls(values.images).map((url) => ({ url })),
		options: colorTitles.map((title) => ({ title, values: ["Standard"] })),
		variants: [
			{
				title: "Standard",
				options: colorOptionsRecord,
				manage_inventory: false,
				prices: buildPrices(values),
			},
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
	await syncProductConfiguratorSettings(productId, values);
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

	const current = await adminFetch<{ product: MedusaProduct }>(
		`/admin/products/${id}?fields=options.id,options.title,options.values.value`,
	);
	await syncProductColorOptions(
		id,
		values.colorSlotCount,
		current.product.options ?? [],
		values.colorSlotNames,
	);
	await syncProductConfiguratorSettings(id, values);

	if (values.price != null) {
		await syncProductBasePrice(id, values.price);
	}
}

export async function deleteAdminProduct(id: string): Promise<void> {
	await adminFetch(`/admin/products/${id}`, { method: "DELETE" });
}
