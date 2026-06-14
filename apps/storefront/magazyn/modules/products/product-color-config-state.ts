import {
	ADD_COLOR_FIELD_VALUE,
	buildColorOptionTitles,
	CUSTOM_COLOR_CATEGORY_ID,
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
	parseMatOverridesBySlot,
	parseProductColorsBySlot,
	REMOVE_COLOR_FIELD_VALUE,
} from "@/lib/products/color-slot-config";
import {
	categoryIds,
	findCategoryDefinition,
	type ColorCategoryDefinition,
	DEFAULT_COLOR_CATEGORIES,
} from "./color-categories";
import {
	parseDisabledConfigIdsBySlotWithStand,
	parseDisabledColorCategoriesBySlotWithStand,
	parseStandAllowCustom,
	parseStandDisabledCategories,
	parseStandDisabledConfigIds,
	parseStandMatOverrides,
	parseStandProductColors,
} from "@/lib/products/stand-config";
import type { AdminProductDetail, ConfigOption } from "./store";

export type ProductColorMode = "no_stand" | "with_stand";

export type ColorSlotFormState = {
	standAvailable: boolean;
	productColorMode: ProductColorMode;
	disabledBySlotWithStand: Record<string, Set<string>>;
	disabledCategoriesBySlotWithStand: Record<string, Set<string>>;
	standDisabledColorIds: Set<string>;
	standDisabledCategories: Set<string>;
	standProductColors: Record<string, ProductCustomColor[]>;
	standAllowCustomColor: boolean;
	standMatOverrides: Record<string, boolean>;
	slotTitles: string[];
	activeSlot: string;
	disabledBySlot: Record<string, Set<string>>;
	disabledCategoriesBySlot: Record<string, Set<string>>;
	allowCustomBySlot: Record<string, boolean>;
	productColorsBySlot: Record<string, Record<string, ProductCustomColor[]>>;
	matOverridesBySlot: Record<string, Record<string, boolean>>;
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
	const matOverridesRecord =
		product?.matOverridesBySlot ?? parseMatOverridesBySlot(metadata, slotTitles);

	const noStandDisabled =
		product?.disabledConfigIdsBySlot ??
		parseDisabledConfigIdsBySlot(metadata, slotTitles, colors);
	const noStandCategories =
		product?.disabledColorCategoriesBySlot ??
		parseDisabledColorCategoriesBySlot(metadata, slotTitles);
	const withStandDisabled = parseDisabledConfigIdsBySlotWithStand(
		metadata,
		slotTitles,
		noStandDisabled,
	);
	const withStandCategories = parseDisabledColorCategoriesBySlotWithStand(
		metadata,
		slotTitles,
		noStandCategories,
	);

	return {
		standAvailable: product?.standAvailable ?? metadata.stand_available === "true",
		productColorMode: "no_stand",
		disabledBySlotWithStand: setsFromRecord(withStandDisabled),
		disabledCategoriesBySlotWithStand: setsFromRecord(withStandCategories),
		standDisabledColorIds: new Set(
			product?.standDisabledConfigIds ?? parseStandDisabledConfigIds(metadata),
		),
		standDisabledCategories: new Set(
			product?.standDisabledColorCategories ?? parseStandDisabledCategories(metadata),
		),
		standProductColors:
			product?.standProductColors ??
			parseStandProductColors(metadata, categoryIdList),
		standAllowCustomColor:
			product?.standAllowCustomColor ?? parseStandAllowCustom(metadata),
		standMatOverrides:
			product?.standMatOverrides ?? parseStandMatOverrides(metadata),
		slotTitles,
		activeSlot: slotTitles[0] ?? DEFAULT_FIRST_COLOR_SLOT,
		disabledBySlot: setsFromRecord(
			product?.disabledConfigIdsBySlot ??
				parseDisabledConfigIdsBySlot(metadata, slotTitles, colors),
		),
		disabledCategoriesBySlot: setsFromRecord(noStandCategories),
		allowCustomBySlot: allowRecord,
		productColorsBySlot: productColors,
		matOverridesBySlot: matOverridesRecord,
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
		disabledBySlotWithStand: { ...state.disabledBySlotWithStand, [newTitle]: new Set() },
		disabledCategoriesBySlot: { ...state.disabledCategoriesBySlot, [newTitle]: new Set() },
		disabledCategoriesBySlotWithStand: {
			...state.disabledCategoriesBySlotWithStand,
			[newTitle]: new Set(),
		},
		allowCustomBySlot: { ...state.allowCustomBySlot, [newTitle]: true },
		productColorsBySlot: {
			...state.productColorsBySlot,
			[newTitle]: emptyProductColorsByCategory(),
		},
		matOverridesBySlot: { ...state.matOverridesBySlot, [newTitle]: {} },
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
	const newMatOverrides: ColorSlotFormState["matOverridesBySlot"] = {};

	const newDisabledCategories: Record<string, Set<string>> = {};
	const newDisabledWithStand: Record<string, Set<string>> = {};
	const newDisabledCategoriesWithStand: Record<string, Set<string>> = {};

	for (const title of newTitles) {
		newDisabled[title] = new Set(state.disabledBySlot[title] ?? []);
		newDisabledWithStand[title] = new Set(state.disabledBySlotWithStand[title] ?? []);
		newDisabledCategories[title] = new Set(state.disabledCategoriesBySlot[title] ?? []);
		newDisabledCategoriesWithStand[title] = new Set(
			state.disabledCategoriesBySlotWithStand[title] ?? [],
		);
		newAllow[title] = state.allowCustomBySlot[title] ?? true;
		newProductColors[title] = state.productColorsBySlot[title] ?? emptyProductColorsByCategory();
		newMatOverrides[title] = { ...(state.matOverridesBySlot[title] ?? {}) };
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
		disabledBySlotWithStand: newDisabledWithStand,
		disabledCategoriesBySlot: newDisabledCategories,
		disabledCategoriesBySlotWithStand: newDisabledCategoriesWithStand,
		allowCustomBySlot: newAllow,
		productColorsBySlot: newProductColors,
		matOverridesBySlot: newMatOverrides,
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
	const newMatOverrides: ColorSlotFormState["matOverridesBySlot"] = {};

	const newDisabledCategories: Record<string, Set<string>> = {};
	const newDisabledWithStand: Record<string, Set<string>> = {};
	const newDisabledCategoriesWithStand: Record<string, Set<string>> = {};

	for (const title of newTitles) {
		const sourceTitle = title === trimmed ? oldTitle : title;
		newDisabled[title] = new Set(state.disabledBySlot[sourceTitle] ?? []);
		newDisabledWithStand[title] = new Set(state.disabledBySlotWithStand[sourceTitle] ?? []);
		newDisabledCategories[title] = new Set(state.disabledCategoriesBySlot[sourceTitle] ?? []);
		newDisabledCategoriesWithStand[title] = new Set(
			state.disabledCategoriesBySlotWithStand[sourceTitle] ?? [],
		);
		newAllow[title] = state.allowCustomBySlot[sourceTitle] ?? true;
		newProductColors[title] = state.productColorsBySlot[sourceTitle] ?? emptyProductColorsByCategory();
		newMatOverrides[title] = { ...(state.matOverridesBySlot[sourceTitle] ?? {}) };
	}

	return {
		...state,
		slotTitles: newTitles,
		activeSlot: state.activeSlot === oldTitle ? trimmed : state.activeSlot,
		disabledBySlot: newDisabled,
		disabledBySlotWithStand: newDisabledWithStand,
		disabledCategoriesBySlot: newDisabledCategories,
		disabledCategoriesBySlotWithStand: newDisabledCategoriesWithStand,
		allowCustomBySlot: newAllow,
		productColorsBySlot: newProductColors,
		matOverridesBySlot: newMatOverrides,
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

	const nextAllowCustomBySlot = { ...state.allowCustomBySlot };
	if (!enabled && categoryId === CUSTOM_COLOR_CATEGORY_ID) {
		nextAllowCustomBySlot[slot] = false;
	}

	return {
		...state,
		disabledCategoriesBySlot: {
			...state.disabledCategoriesBySlot,
			[slot]: current,
		},
		allowCustomBySlot: nextAllowCustomBySlot,
	};
}

export function toggleGlobalColorMat(
	state: ColorSlotFormState,
	slot: string,
	colorId: string,
	globalDefault: boolean,
	enabled: boolean,
): ColorSlotFormState {
	const current = { ...(state.matOverridesBySlot[slot] ?? {}) };
	if (enabled === globalDefault) {
		delete current[colorId];
	} else {
		current[colorId] = enabled;
	}

	return {
		...state,
		matOverridesBySlot: {
			...state.matOverridesBySlot,
			[slot]: current,
		},
	};
}

export function toggleProductColorMat(
	state: ColorSlotFormState,
	slot: string,
	category: ColorCategoryId,
	colorId: string,
	enabled: boolean,
): ColorSlotFormState {
	const slotColors = state.productColorsBySlot[slot] ?? emptyProductColorsByCategory();
	return {
		...state,
		productColorsBySlot: {
			...state.productColorsBySlot,
			[slot]: {
				...slotColors,
				[category]: (slotColors[category] ?? []).map((color) =>
					color.id === colorId ? { ...color, mat_allowed: enabled } : color,
				),
			},
		},
	};
}

export function getGlobalColorMatAllowed(
	state: ColorSlotFormState,
	slot: string,
	colorId: string,
	globalDefault: boolean,
): boolean {
	return state.matOverridesBySlot[slot]?.[colorId] ?? globalDefault;
}

export function getActiveDisabledBySlot(state: ColorSlotFormState): Record<string, Set<string>> {
	return state.productColorMode === "with_stand"
		? state.disabledBySlotWithStand
		: state.disabledBySlot;
}

export function getActiveDisabledCategoriesBySlot(
	state: ColorSlotFormState,
): Record<string, Set<string>> {
	return state.productColorMode === "with_stand"
		? state.disabledCategoriesBySlotWithStand
		: state.disabledCategoriesBySlot;
}

export function serializeColorSlotState(state: ColorSlotFormState): {
	colorSlotCount: number;
	colorSlotNames: string[];
	disabledConfigIds: string[];
	disabledConfigIdsBySlot: Record<string, string[]>;
	disabledColorCategoriesBySlot: Record<string, string[]>;
	disabledConfigIdsBySlotWithStand: Record<string, string[]>;
	disabledColorCategoriesBySlotWithStand: Record<string, string[]>;
	allowCustomColorBySlot: Record<string, boolean>;
	productColorsBySlot: Record<string, Record<string, ProductCustomColor[]>>;
	matOverridesBySlot: Record<string, Record<string, boolean>>;
	allowCustomColor: boolean;
	standAvailable: boolean;
	standDisabledConfigIds: string[];
	standDisabledColorCategories: string[];
	standProductColors: Record<string, ProductCustomColor[]>;
	standAllowCustomColor: boolean;
	standMatOverrides: Record<string, boolean>;
} {
	const disabledConfigIdsBySlot: Record<string, string[]> = {};
	const disabledColorCategoriesBySlot: Record<string, string[]> = {};
	const disabledConfigIdsBySlotWithStand: Record<string, string[]> = {};
	const disabledColorCategoriesBySlotWithStand: Record<string, string[]> = {};
	for (const title of state.slotTitles) {
		disabledConfigIdsBySlot[title] = Array.from(state.disabledBySlot[title] ?? []);
		disabledColorCategoriesBySlot[title] = Array.from(state.disabledCategoriesBySlot[title] ?? []);
		disabledConfigIdsBySlotWithStand[title] = Array.from(
			state.disabledBySlotWithStand[title] ?? [],
		);
		disabledColorCategoriesBySlotWithStand[title] = Array.from(
			state.disabledCategoriesBySlotWithStand[title] ?? [],
		);
	}

	return {
		colorSlotCount: state.slotTitles.length,
		colorSlotNames: state.slotTitles,
		disabledConfigIds: Array.from(state.nonColorDisabledIds),
		disabledConfigIdsBySlot,
		disabledColorCategoriesBySlot,
		disabledConfigIdsBySlotWithStand,
		disabledColorCategoriesBySlotWithStand,
		allowCustomColorBySlot: state.allowCustomBySlot,
		productColorsBySlot: state.productColorsBySlot,
		matOverridesBySlot: state.matOverridesBySlot,
		allowCustomColor: Object.values(state.allowCustomBySlot).some(Boolean),
		standAvailable: state.standAvailable,
		standDisabledConfigIds: Array.from(state.standDisabledColorIds),
		standDisabledColorCategories: Array.from(state.standDisabledCategories),
		standProductColors: state.standProductColors,
		standAllowCustomColor: state.standAllowCustomColor,
		standMatOverrides: state.standMatOverrides,
	};
}

export { ADD_COLOR_FIELD_VALUE, REMOVE_COLOR_FIELD_VALUE };
