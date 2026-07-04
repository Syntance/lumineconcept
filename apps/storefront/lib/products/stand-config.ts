import {
	emptyProductColorsByCategory,
	getEnabledColorNamesForSlot,
	buildColorNameCategoryMap,
	type ProductCustomColor,
} from "@/lib/products/color-slot-config";

function parseJsonRecord(raw: unknown): Record<string, unknown> | null {
	if (typeof raw === "string") {
		try {
			const parsed: unknown = JSON.parse(raw);
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				return parsed as Record<string, unknown>;
			}
		} catch {
			return null;
		}
	}
	if (raw && typeof raw === "object" && !Array.isArray(raw)) {
		return raw as Record<string, unknown>;
	}
	return null;
}

/** @deprecated Użyj `getStandSurchargeGrosze` — cena jest per produkt w metadata. */
export const STAND_SURCHARGE_PLN = 10;

export const STAND_AVAILABLE_META_KEY = "stand_available";
export const STAND_PAID_META_KEY = "stand_paid";
export const STAND_SURCHARGE_GROSZE_KEY = "stand_surcharge_grosze";
export const STAND_DISABLED_CONFIG_IDS_KEY = "stand_disabled_config_ids";
export const STAND_DISABLED_CATEGORIES_KEY = "stand_disabled_color_categories";
export const STAND_PRODUCT_COLORS_KEY = "stand_product_colors";
export const STAND_ALLOW_CUSTOM_KEY = "stand_allow_custom_color";
export const STAND_MAT_OVERRIDES_KEY = "stand_mat_overrides";
export const DISABLED_CONFIG_IDS_BY_SLOT_WITH_STAND_KEY =
	"disabled_config_ids_by_slot_with_stand";
export const 	DISABLED_COLOR_CATEGORIES_BY_SLOT_WITH_STAND_KEY =
	"disabled_color_categories_by_slot_with_stand";
export const MAT_OVERRIDES_BY_SLOT_WITH_STAND_KEY = "mat_overrides_by_slot_with_stand";

/** Tytuł pola koloru podstawki na PDP (metadata: color_podstawki). */
export const STAND_COLOR_OPTION_TITLE = "Podstawka";

export function parseStandAvailable(
	meta: Record<string, unknown> | null | undefined,
): boolean {
	return meta?.[STAND_AVAILABLE_META_KEY] === "true";
}

function parsePositiveInt(raw: unknown): number {
	if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
		return Math.round(raw);
	}
	if (typeof raw === "string" && raw.trim() !== "") {
		const n = Number(raw.trim());
		if (Number.isFinite(n) && n > 0) return Math.round(n);
	}
	return 0;
}

/** Czy podstawka jest płatna (domyślnie: nie — gratis). */
export function parseStandPaid(meta: Record<string, unknown> | null | undefined): boolean {
	return meta?.[STAND_PAID_META_KEY] === "true";
}

/** Dopłata za podstawkę w groszach (0 = gratis). */
export function getStandSurchargeGrosze(
	meta: Record<string, unknown> | null | undefined,
): number {
	if (!parseStandPaid(meta)) return 0;
	return parsePositiveInt(meta?.[STAND_SURCHARGE_GROSZE_KEY]);
}

/** Dopłata w PLN (decimal) — do wyświetlania i backendu koszyka. */
export function getStandSurchargePln(meta: Record<string, unknown> | null | undefined): number {
	return getStandSurchargeGrosze(meta) / 100;
}

export function formatStandSurchargePln(grosze: number): string {
	return new Intl.NumberFormat("pl-PL", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(grosze / 100);
}

function parseStringArray(raw: unknown): string[] {
	if (typeof raw === "string") {
		try {
			const parsed: unknown = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				return parsed.filter((x): x is string => typeof x === "string");
			}
		} catch {
			return [];
		}
	}
	if (Array.isArray(raw)) {
		return raw.filter((x): x is string => typeof x === "string");
	}
	return [];
}

export function parseStandDisabledConfigIds(
	meta: Record<string, unknown> | null | undefined,
): string[] {
	return parseStringArray(meta?.[STAND_DISABLED_CONFIG_IDS_KEY]);
}

export function parseStandDisabledCategories(
	meta: Record<string, unknown> | null | undefined,
): string[] {
	return parseStringArray(meta?.[STAND_DISABLED_CATEGORIES_KEY]);
}

export function parseStandAllowCustom(
	meta: Record<string, unknown> | null | undefined,
): boolean {
	const raw = meta?.[STAND_ALLOW_CUSTOM_KEY];
	return raw === "true" || raw === undefined;
}

export function parseStandProductColors(
	meta: Record<string, unknown> | null | undefined,
	categoryIds: readonly string[] = ["standard", "color", "mirror", "custom"],
): Record<string, ProductCustomColor[]> {
	const base = emptyProductColorsByCategory(categoryIds);
	const obj = parseJsonRecord(meta?.[STAND_PRODUCT_COLORS_KEY]);
	if (!obj) return base;

	const keys = new Set([...categoryIds, ...Object.keys(obj)]);
	for (const id of keys) {
		const arr = obj[id];
		if (Array.isArray(arr)) {
			base[id] = arr
				.filter(
					(item): item is ProductCustomColor =>
						!!item &&
						typeof item === "object" &&
						typeof (item as ProductCustomColor).id === "string" &&
						typeof (item as ProductCustomColor).name === "string" &&
						typeof (item as ProductCustomColor).hex_color === "string",
				)
				.map((item) => ({
					...item,
					color_category: id,
					mat_allowed: item.mat_allowed !== false,
				}));
		}
	}
	return base;
}

export function parseStandMatOverrides(
	meta: Record<string, unknown> | null | undefined,
): Record<string, boolean> {
	const obj = parseJsonRecord(meta?.[STAND_MAT_OVERRIDES_KEY]);
	if (!obj) return {};
	const parsed: Record<string, boolean> = {};
	for (const [id, value] of Object.entries(obj)) {
		if (value === true || value === "true") parsed[id] = true;
		if (value === false || value === "false") parsed[id] = false;
	}
	return parsed;
}

export function parseDisabledConfigIdsBySlotWithStand(
	meta: Record<string, unknown> | null | undefined,
	slotTitles: readonly string[],
	fallback: Record<string, string[]> = {},
): Record<string, string[]> {
	const result: Record<string, string[]> = {};
	for (const title of slotTitles) {
		result[title] = fallback[title] ?? [];
	}

	const obj = parseJsonRecord(meta?.[DISABLED_CONFIG_IDS_BY_SLOT_WITH_STAND_KEY]);
	if (!obj) return result;

	const metadataKeys = Object.keys(obj);
	for (let i = 0; i < slotTitles.length; i++) {
		const title = slotTitles[i];
		if (!title) continue;
		let arr = obj[title];
		if (!Array.isArray(arr)) {
			const fallbackKey = metadataKeys[i];
			if (fallbackKey && fallbackKey !== title) {
				arr = obj[fallbackKey];
			}
		}
		if (Array.isArray(arr)) {
			result[title] = arr.filter((x): x is string => typeof x === "string");
		}
	}
	return result;
}

export function parseDisabledColorCategoriesBySlotWithStand(
	meta: Record<string, unknown> | null | undefined,
	slotTitles: readonly string[],
	fallback: Record<string, string[]> = {},
): Record<string, string[]> {
	const result: Record<string, string[]> = {};
	for (const title of slotTitles) {
		result[title] = fallback[title] ?? [];
	}

	const obj = parseJsonRecord(meta?.[DISABLED_COLOR_CATEGORIES_BY_SLOT_WITH_STAND_KEY]);
	if (!obj) return result;

	const metadataKeys = Object.keys(obj);
	for (let i = 0; i < slotTitles.length; i++) {
		const title = slotTitles[i];
		if (!title) continue;
		let arr = obj[title];
		if (!Array.isArray(arr)) {
			const fallbackKey = metadataKeys[i];
			if (fallbackKey && fallbackKey !== title) {
				arr = obj[fallbackKey];
			}
		}
		if (Array.isArray(arr)) {
			result[title] = arr.filter((x): x is string => typeof x === "string");
		}
	}
	return result;
}

export function getStandEnabledColorNames(
	globalColors: ReadonlyArray<{ id: string; name: string; color_category?: string | null }>,
	standProductColors: ReadonlyArray<{ name: string; color_category?: string | null }>,
	meta: Record<string, unknown> | null | undefined,
): string[] {
	const disabledIds = {
		[STAND_COLOR_OPTION_TITLE]: parseStandDisabledConfigIds(meta),
	};
	const disabledCats = {
		[STAND_COLOR_OPTION_TITLE]: parseStandDisabledCategories(meta),
	};
	return getEnabledColorNamesForSlot(
		STAND_COLOR_OPTION_TITLE,
		globalColors,
		standProductColors,
		disabledIds,
		disabledCats,
	);
}

export function buildStandColorMaps(
	globalColors: ReadonlyArray<{
		id: string;
		name: string;
		hex_color?: string | null;
		color_category?: string | null;
		mat_allowed?: boolean;
	}>,
	standProductColors: ReadonlyArray<ProductCustomColor>,
	meta: Record<string, unknown> | null | undefined,
): {
	values: string[];
	colorMap: Record<string, string>;
	matDisabledSet: Set<string>;
	allowCustom: boolean;
	categoryByColorName: Record<string, string>;
	customCategoryEnabled: boolean;
} {
	const values = getStandEnabledColorNames(globalColors, standProductColors, meta);
	const disabledIds = new Set(parseStandDisabledConfigIds(meta));
	const matOverrides = parseStandMatOverrides(meta);
	const colorMap: Record<string, string> = {};
	const matDisabledSet = new Set<string>();
	const valueKeys = new Set(values.map((v) => v.toLowerCase()));

	for (const c of globalColors) {
		if (disabledIds.has(c.id)) continue;
		if (!valueKeys.has(c.name.toLowerCase())) continue;
		if (c.hex_color) colorMap[c.name.toLowerCase()] = c.hex_color;
		const matAllowed = matOverrides[c.id] ?? c.mat_allowed !== false;
		if (!matAllowed) matDisabledSet.add(c.name.toLowerCase());
	}
	for (const c of standProductColors) {
		if (!valueKeys.has(c.name.toLowerCase())) continue;
		colorMap[c.name.toLowerCase()] = c.hex_color;
		if (!c.mat_allowed) matDisabledSet.add(c.name.toLowerCase());
	}

	const disabledCats = parseStandDisabledCategories(meta);
	const allowCustom =
		parseStandAllowCustom(meta) && !disabledCats.includes("custom");
	const customCategoryEnabled = !disabledCats.includes("custom");

	const colorsForCategories: Array<{ name: string; color_category?: string | null }> =
		[];
	for (const c of globalColors) {
		if (disabledIds.has(c.id)) continue;
		if (valueKeys.has(c.name.toLowerCase())) colorsForCategories.push(c);
	}
	for (const c of standProductColors) {
		if (valueKeys.has(c.name.toLowerCase())) colorsForCategories.push(c);
	}

	return {
		values,
		colorMap,
		matDisabledSet,
		allowCustom,
		categoryByColorName: buildColorNameCategoryMap(colorsForCategories),
		customCategoryEnabled,
	};
}
