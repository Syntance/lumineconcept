export const MAX_COLOR_SLOTS = 5;
export const MIN_COLOR_SLOTS = 1;

export const COLOR_CATEGORY_IDS = ["standard", "color", "mirror", "custom"] as const;
export type ColorCategoryId = (typeof COLOR_CATEGORY_IDS)[number];

/** Kolor zdefiniowany tylko dla danego produktu (metadata.product_colors_by_slot). */
export type ProductCustomColor = {
	id: string;
	name: string;
	hex_color: string;
	color_category: ColorCategoryId;
	mat_allowed: boolean;
};

export function emptyProductColorsByCategory(): Record<ColorCategoryId, ProductCustomColor[]> {
	return { standard: [], color: [], mirror: [], custom: [] };
}

export function parseProductColorsBySlot(
	meta: Record<string, unknown> | null | undefined,
	slotTitles: readonly string[],
): Record<string, Record<ColorCategoryId, ProductCustomColor[]>> {
	const result: Record<string, Record<ColorCategoryId, ProductCustomColor[]>> = {};
	const obj = parseJsonRecord(meta?.product_colors_by_slot);

	for (const title of slotTitles) {
		const base = emptyProductColorsByCategory();
		const slotObj = obj?.[title];
		if (slotObj && typeof slotObj === "object" && !Array.isArray(slotObj)) {
			for (const id of COLOR_CATEGORY_IDS) {
				const arr = (slotObj as Record<string, unknown>)[id];
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
		}
		result[title] = base;
	}
	return result;
}

export function flattenProductColorsForSlot(
	byCategory: Record<ColorCategoryId, ProductCustomColor[]> | undefined,
): ProductCustomColor[] {
	if (!byCategory) return [];
	return COLOR_CATEGORY_IDS.flatMap((id) => byCategory[id] ?? []);
}

export const ADD_COLOR_FIELD_VALUE = "__add_color_field__";
export const REMOVE_COLOR_FIELD_VALUE = "__remove_color_field__";

/** Domyślna nazwa pierwszego pola koloru w konfiguratorze. */
export const DEFAULT_FIRST_COLOR_SLOT = "Kolor tabliczki";

/** Domyślna nazwa pola koloru (0 = pierwsze, 1+ = Element 2, Element 3…). */
export function defaultColorSlotTitle(index: number): string {
	if (index <= 0) return DEFAULT_FIRST_COLOR_SLOT;
	return `Element ${index + 1}`;
}

/** Czy tytuł opcji Medusy to pole koloru (domyślne lub własna nazwa „Element N"). */
export function isColorSlotTitle(title: string): boolean {
	const t = title.trim().toLowerCase();
	if (t.startsWith("kolor")) return true;
	return /^element\s+\d+$/.test(t);
}

export function buildColorOptionTitles(count: number, customNames?: string[]): string[] {
	const safe = Math.min(MAX_COLOR_SLOTS, Math.max(MIN_COLOR_SLOTS, count));

	if (customNames && customNames.length === safe) {
		return customNames;
	}

	return Array.from({ length: safe }, (_, i) => defaultColorSlotTitle(i));
}

export function parseCustomSlotNames(meta: Record<string, unknown> | null | undefined): string[] | undefined {
	const raw = meta?.color_slot_names;
	if (Array.isArray(raw)) {
		return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
	}
	if (typeof raw === "string") {
		try {
			const parsed: unknown = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
			}
		} catch {
			return undefined;
		}
	}
	return undefined;
}

export function formatColorSlotLabel(title: string): string {
	return title;
}

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

export function countColorSlotsFromProductOptions(
	options: ReadonlyArray<{ title: string }>,
): number {
	const fromOptions = options.filter((o) => isColorSlotTitle(o.title)).length;
	return fromOptions > 0 ? fromOptions : 1;
}

/** Kanoniczne tytuły pól koloru — zgodne z kluczami w metadata.disabled_config_ids_by_slot. */
export function resolveColorSlotTitles(
	options: ReadonlyArray<{ title: string }>,
	metadata: Record<string, unknown> | null | undefined,
): string[] {
	const count = countColorSlotsFromProductOptions(options);
	const customNames = parseCustomSlotNames(metadata);
	if (customNames && customNames.length === count) {
		return customNames;
	}

	const fromOptions = options
		.filter((o) => isColorSlotTitle(o.title))
		.map((o) => o.title);
	if (fromOptions.length > 0) {
		return fromOptions;
	}

	return buildColorOptionTitles(count, customNames);
}

export function parseDisabledConfigIdsBySlot(
	meta: Record<string, unknown> | null | undefined,
	slotTitles: readonly string[],
	legacyColorDisabled: string[] = [],
): Record<string, string[]> {
	const result: Record<string, string[]> = {};
	for (const title of slotTitles) {
		result[title] = [];
	}

	const obj = parseJsonRecord(meta?.disabled_config_ids_by_slot);
	if (obj) {
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
			result[title] = Array.isArray(arr)
				? arr.filter((x): x is string => typeof x === "string")
				: [...legacyColorDisabled];
		}
		return result;
	}

	for (const title of slotTitles) {
		result[title] = [...legacyColorDisabled];
	}
	return result;
}

export function getEnabledColorNamesForSlot(
	slotTitle: string,
	globalColors: ReadonlyArray<{ id: string; name: string }>,
	productColors: ReadonlyArray<{ name: string }>,
	disabledConfigIdsBySlot: Record<string, string[]>,
): string[] {
	const slotDisabled = new Set(disabledConfigIdsBySlot[slotTitle] ?? []);
	return [
		...globalColors.filter((c) => !slotDisabled.has(c.id)).map((c) => c.name),
		...productColors.map((c) => c.name),
	];
}

export function parseAllowCustomColorBySlot(
	meta: Record<string, unknown> | null | undefined,
	slotTitles: readonly string[],
	defaultAllow: boolean,
): Record<string, boolean> {
	const result: Record<string, boolean> = {};
	const obj = parseJsonRecord(meta?.allow_custom_color_by_slot);

	for (const title of slotTitles) {
		if (obj && title in obj) {
			const val = obj[title];
			result[title] = val !== "false" && val !== false;
		} else {
			result[title] = defaultAllow;
		}
	}
	return result;
}

export function hasPerSlotColorConfig(meta: Record<string, unknown> | null | undefined): boolean {
	return parseJsonRecord(meta?.disabled_config_ids_by_slot) !== null;
}

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

export function filterColorsByDisabledIds<T extends { id: string }>(
	colors: T[],
	disabledIds: string[] | undefined,
): T[] {
	if (!disabledIds || disabledIds.length === 0) return colors;
	const disabled = new Set(disabledIds);
	return colors.filter((c) => !disabled.has(c.id));
}
