import {
	ADD_COLOR_FIELD_VALUE,
	buildColorOptionTitles,
	DEFAULT_FIRST_COLOR_SLOT,
	defaultColorSlotTitle,
	type ColorCategoryId,
	type ProductCustomColor,
	emptyProductColorsByCategory,
	MAX_COLOR_SLOTS,
	MIN_COLOR_SLOTS,
	parseAllowCustomColorBySlot,
	parseCustomSlotNames,
	parseDisabledColorCategoriesBySlot,
	parseDisabledConfigIdsBySlot,
	parseProductColorsBySlot,
	REMOVE_COLOR_FIELD_VALUE,
} from "@/lib/products/color-slot-config";
import {
	categoryIds,
	findCategoryDefinition,
	type ColorCategoryDefinition,
	DEFAULT_COLOR_CATEGORIES,
} from "./color-categories";
import type { AdminProductDetail, ConfigOption } from "./store";

export type ColorSlotFormState = {
	slotTitles: string[];
	activeSlot: string;
	disabledBySlot: Record<string, Set<string>>;
	disabledCategoriesBySlot: Record<string, Set<string>>;
	allowCustomBySlot: Record<string, boolean>;
	productColorsBySlot: Record<string, Record<string, ProductCustomColor[]>>;
	nonColorDisabledIds: Set<string>;
};

function splitLegacyDisabledIds(
	legacyDisabled: string[],
	configOptions: ConfigOption[],
): { nonColors: string[]; colors: string[] } {
	const colorIds = new Set(configOptions.filter((o) => o.type === "color").map((o) => o.id));
	return {
		nonColors: legacyDisabled.filter((id) => !colorIds.has(id)),
		colors: legacyDisabled.filter((id) => colorIds.has(id)),
	};
}

function setsFromRecord(record: Record<string, string[]>): Record<string, Set<string>> {
	return Object.fromEntries(Object.entries(record).map(([title, ids]) => [title, new Set(ids)]));
}

export function createInitialColorSlotState(
	product: AdminProductDetail | undefined,
	configOptions: ConfigOption[],
	colorCategories: ColorCategoryDefinition[] = DEFAULT_COLOR_CATEGORIES,
): ColorSlotFormState {
	const categoryIdList = categoryIds(colorCategories);
	const colorSlotCount = product?.colorSlotCount ?? 1;
	const metadata = product?.metadata ?? {};
	const customNames = parseCustomSlotNames(metadata);
	const slotTitles = buildColorOptionTitles(colorSlotCount, customNames);
	const legacyDisabled = product?.disabledConfigIds ?? [];
	const { nonColors, colors } = splitLegacyDisabledIds(legacyDisabled, configOptions);
	const defaultAllow = product?.allowCustomColor ?? true;

	const disabledRecord =
		product?.disabledConfigIdsBySlot ??
		parseDisabledConfigIdsBySlot(metadata, slotTitles, colors);
	const allowRecord =
		product?.allowCustomColorBySlot ??
		parseAllowCustomColorBySlot(metadata, slotTitles, defaultAllow);
	const productColors =
		product?.productColorsBySlot ??
		parseProductColorsBySlot(metadata, slotTitles, categoryIdList);
	const disabledCategoriesRecord =
		product?.disabledColorCategoriesBySlot ??
		parseDisabledColorCategoriesBySlot(metadata, slotTitles);

	return {
		slotTitles,
		activeSlot: slotTitles[0] ?? DEFAULT_FIRST_COLOR_SLOT,
		disabledBySlot: setsFromRecord(disabledRecord),
		disabledCategoriesBySlot: setsFromRecord(disabledCategoriesRecord),
		allowCustomBySlot: allowRecord,
		productColorsBySlot: productColors,
		nonColorDisabledIds: new Set(
			nonColors.length > 0 ? nonColors : legacyDisabled.filter((id) => !colors.includes(id)),
		),
	};
}

export function addColorSlot(state: ColorSlotFormState): ColorSlotFormState {
	if (state.slotTitles.length >= MAX_COLOR_SLOTS) return state;

	const defaultTitles = buildColorOptionTitles(state.slotTitles.length + 1);
	const defaultNewTitle = defaultTitles[defaultTitles.length - 1];
	if (!defaultNewTitle) return state;

	let newTitle = defaultNewTitle;
	let counter = state.slotTitles.length + 1;
	while (state.slotTitles.includes(newTitle)) {
		counter++;
		newTitle = defaultColorSlotTitle(counter - 1);
	}

	const newTitles = [...state.slotTitles, newTitle];

	return {
		...state,
		slotTitles: newTitles,
		activeSlot: newTitle,
		disabledBySlot: { ...state.disabledBySlot, [newTitle]: new Set() },
		disabledCategoriesBySlot: { ...state.disabledCategoriesBySlot, [newTitle]: new Set() },
		allowCustomBySlot: { ...state.allowCustomBySlot, [newTitle]: true },
		productColorsBySlot: {
			...state.productColorsBySlot,
			[newTitle]: emptyProductColorsByCategory(),
		},
	};
}

export function removeColorSlot(state: ColorSlotFormState, titleToRemove?: string): ColorSlotFormState {
	if (state.slotTitles.length <= MIN_COLOR_SLOTS) return state;

	const removeTitle = titleToRemove ?? state.activeSlot;
	const removeIndex = state.slotTitles.indexOf(removeTitle);
	if (removeIndex === -1) return state;

	const newTitles = state.slotTitles.filter((title) => title !== removeTitle);
	const newDisabled: Record<string, Set<string>> = {};
	const newAllow: Record<string, boolean> = {};
	const newProductColors: ColorSlotFormState["productColorsBySlot"] = {};

	const newDisabledCategories: Record<string, Set<string>> = {};

	for (const title of newTitles) {
		newDisabled[title] = new Set(state.disabledBySlot[title] ?? []);
		newDisabledCategories[title] = new Set(state.disabledCategoriesBySlot[title] ?? []);
		newAllow[title] = state.allowCustomBySlot[title] ?? true;
		newProductColors[title] = state.productColorsBySlot[title] ?? emptyProductColorsByCategory();
	}

	const nextActive =
		removeTitle === state.activeSlot
			? (newTitles[Math.min(removeIndex, newTitles.length - 1)] ?? newTitles[0] ?? DEFAULT_FIRST_COLOR_SLOT)
			: state.activeSlot;

	return {
		...state,
		slotTitles: newTitles,
		activeSlot: nextActive,
		disabledBySlot: newDisabled,
		disabledCategoriesBySlot: newDisabledCategories,
		allowCustomBySlot: newAllow,
		productColorsBySlot: newProductColors,
	};
}

export function renameColorSlot(state: ColorSlotFormState, oldTitle: string, newTitle: string): ColorSlotFormState {
	const trimmed = newTitle.trim();
	if (!trimmed || trimmed === oldTitle) return state;
	if (state.slotTitles.includes(trimmed)) return state;

	const newTitles = state.slotTitles.map((title) => (title === oldTitle ? trimmed : title));
	const newDisabled: Record<string, Set<string>> = {};
	const newAllow: Record<string, boolean> = {};
	const newProductColors: ColorSlotFormState["productColorsBySlot"] = {};

	const newDisabledCategories: Record<string, Set<string>> = {};

	for (const title of newTitles) {
		const sourceTitle = title === trimmed ? oldTitle : title;
		newDisabled[title] = new Set(state.disabledBySlot[sourceTitle] ?? []);
		newDisabledCategories[title] = new Set(state.disabledCategoriesBySlot[sourceTitle] ?? []);
		newAllow[title] = state.allowCustomBySlot[sourceTitle] ?? true;
		newProductColors[title] = state.productColorsBySlot[sourceTitle] ?? emptyProductColorsByCategory();
	}

	return {
		...state,
		slotTitles: newTitles,
		activeSlot: state.activeSlot === oldTitle ? trimmed : state.activeSlot,
		disabledBySlot: newDisabled,
		disabledCategoriesBySlot: newDisabledCategories,
		allowCustomBySlot: newAllow,
		productColorsBySlot: newProductColors,
	};
}

export function addProductColor(
	state: ColorSlotFormState,
	slot: string,
	category: ColorCategoryId,
	input: { name: string; hex_color: string },
	categories: ColorCategoryDefinition[] = DEFAULT_COLOR_CATEGORIES,
): ColorSlotFormState {
	const section = findCategoryDefinition(categories, category);
	const slotColors = state.productColorsBySlot[slot] ?? emptyProductColorsByCategory();
	const color: ProductCustomColor = {
		id: `pc_${crypto.randomUUID()}`,
		name: input.name.trim(),
		hex_color: input.hex_color,
		color_category: category,
		mat_allowed: section?.matDefault ?? true,
	};

	return {
		...state,
		productColorsBySlot: {
			...state.productColorsBySlot,
			[slot]: {
				...slotColors,
				[category]: [...(slotColors[category] ?? []), color],
			},
		},
	};
}

export function removeProductColor(
	state: ColorSlotFormState,
	slot: string,
	category: ColorCategoryId,
	colorId: string,
): ColorSlotFormState {
	const slotColors = state.productColorsBySlot[slot] ?? emptyProductColorsByCategory();
	return {
		...state,
		productColorsBySlot: {
			...state.productColorsBySlot,
			[slot]: {
				...slotColors,
				[category]: (slotColors[category] ?? []).filter((c) => c.id !== colorId),
			},
		},
	};
}

export function toggleColorCategoryForSlot(
	state: ColorSlotFormState,
	slot: string,
	categoryId: string,
	enabled: boolean,
): ColorSlotFormState {
	const current = new Set(state.disabledCategoriesBySlot[slot] ?? []);
	if (enabled) current.delete(categoryId);
	else current.add(categoryId);
	return {
		...state,
		disabledCategoriesBySlot: {
			...state.disabledCategoriesBySlot,
			[slot]: current,
		},
	};
}

export function serializeColorSlotState(state: ColorSlotFormState): {
	colorSlotCount: number;
	colorSlotNames: string[];
	disabledConfigIds: string[];
	disabledConfigIdsBySlot: Record<string, string[]>;
	disabledColorCategoriesBySlot: Record<string, string[]>;
	allowCustomColorBySlot: Record<string, boolean>;
	productColorsBySlot: Record<string, Record<string, ProductCustomColor[]>>;
	allowCustomColor: boolean;
} {
	const disabledConfigIdsBySlot: Record<string, string[]> = {};
	const disabledColorCategoriesBySlot: Record<string, string[]> = {};
	for (const title of state.slotTitles) {
		disabledConfigIdsBySlot[title] = Array.from(state.disabledBySlot[title] ?? []);
		disabledColorCategoriesBySlot[title] = Array.from(state.disabledCategoriesBySlot[title] ?? []);
	}

	return {
		colorSlotCount: state.slotTitles.length,
		colorSlotNames: state.slotTitles,
		disabledConfigIds: Array.from(state.nonColorDisabledIds),
		disabledConfigIdsBySlot,
		disabledColorCategoriesBySlot,
		allowCustomColorBySlot: state.allowCustomBySlot,
		productColorsBySlot: state.productColorsBySlot,
		allowCustomColor: Object.values(state.allowCustomBySlot).some(Boolean),
	};
}

export { ADD_COLOR_FIELD_VALUE, REMOVE_COLOR_FIELD_VALUE };
