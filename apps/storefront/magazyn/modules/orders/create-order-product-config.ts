import "server-only";

import {
	buildColorMap,
	buildMatDisabledSet,
	mergeGlobalAndProductColors,
	type GlobalConfigOption,
} from "@/lib/products/global-config";
import {
	flattenProductColorsForSlot,
	getEnabledColorNamesForSlot,
	resolveAllowCustomColorForSlot,
} from "@/lib/products/color-slot-config";
import type { TextFieldDef } from "@/lib/products/text-fields";
import type { ProductUploadSettings } from "@/lib/products/upload-settings";
import {
	getStandEnabledColorNames,
	parseStandProductColors,
	STAND_COLOR_OPTION_TITLE,
} from "@/lib/products/stand-config";
import { getAdminProduct, listGlobalConfigOptions, type ConfigOption } from "@magazyn/modules/products/store";
import type { ManualOrderProductConfig, ManualOrderColorDef } from "./create-order-types";

function globalColorsFromConfig(options: ConfigOption[]): GlobalConfigOption[] {
	return options
		.filter((option) => option.type === "color")
		.map((option) => ({
			id: option.id,
			type: "color" as const,
			name: option.name,
			hex_color: option.hex_color,
			color_category: option.color_category,
			mat_allowed: option.mat_allowed,
			sort_order: option.sort_order,
			metadata: null,
		}));
}

function toColorDef(
	name: string,
	merged: GlobalConfigOption[],
	matOverrides: Record<string, boolean>,
): ManualOrderColorDef {
	const match = merged.find((color) => color.name.toLowerCase() === name.toLowerCase());
	const matAllowed = matOverrides[name] ?? match?.mat_allowed ?? true;
	return {
		name,
		hex: match?.hex_color ?? null,
		category: match?.color_category ?? "standard",
		matAllowed,
	};
}

function parseLinksCount(metadata: Record<string, unknown> | null | undefined): number {
	const raw = metadata?.links_count;
	const parsed = typeof raw === "string" || typeof raw === "number" ? Number(raw) : NaN;
	return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.round(parsed), 5) : 0;
}

export async function getManualOrderProductConfig(
	productId: string,
): Promise<ManualOrderProductConfig | null> {
	const [product, globalOptions] = await Promise.all([
		getAdminProduct(productId),
		listGlobalConfigOptions(),
	]);

	if (!product?.variantId) return null;

	const globalColors = globalColorsFromConfig(globalOptions);
	const slotTitles = product.colorSlotNames ?? [];
	const metadata = product.metadata ?? {};
	const colorsBySlot: Record<string, ManualOrderColorDef[]> = {};
	const allowCustomBySlot: Record<string, boolean> = {};

	for (const slotTitle of slotTitles) {
		const productColorsFlat = flattenProductColorsForSlot(product.productColorsBySlot[slotTitle]);
		const merged = mergeGlobalAndProductColors(
			globalColors,
			productColorsFlat.map((color) => ({
				id: color.id,
				name: color.name,
				hex_color: color.hex_color,
				color_category: color.color_category,
				mat_allowed: color.mat_allowed,
			})),
		);
		const enabledNames = getEnabledColorNamesForSlot(
			slotTitle,
			globalColors,
			productColorsFlat,
			product.disabledConfigIdsBySlot,
			product.disabledColorCategoriesBySlot,
		);
		const matOverrides = product.matOverridesBySlot[slotTitle] ?? {};
		colorsBySlot[slotTitle] = enabledNames.map((name) => toColorDef(name, merged, matOverrides));
		allowCustomBySlot[slotTitle] = resolveAllowCustomColorForSlot(
			product.allowCustomColorBySlot,
			slotTitle,
			product.allowCustomColor,
			product.disabledColorCategoriesBySlot,
		);
	}

	const standProductColors = flattenProductColorsForSlot(parseStandProductColors(metadata));
	const standMerged = mergeGlobalAndProductColors(
		globalColors,
		standProductColors.map((color) => ({
			id: color.id,
			name: color.name,
			hex_color: color.hex_color,
			color_category: color.color_category,
			mat_allowed: color.mat_allowed,
		})),
	);
	const standEnabledNames = getStandEnabledColorNames(globalColors, standProductColors, metadata);
	const standMatOverrides = product.standMatOverrides;
	const standColors = standEnabledNames.map((name) => toColorDef(name, standMerged, standMatOverrides));

	const allMerged = mergeGlobalAndProductColors(
		globalColors,
		slotTitles.flatMap((title) =>
			flattenProductColorsForSlot(product.productColorsBySlot[title]).map((color) => ({
				id: color.id,
				name: color.name,
				hex_color: color.hex_color,
				color_category: color.color_category,
				mat_allowed: color.mat_allowed,
			})),
		),
	);

	const colorMap = buildColorMap(allMerged);
	for (const color of standMerged) {
		if (color.hex_color) {
			colorMap[color.name.toLowerCase()] = color.hex_color;
		}
	}

	const matDisabledSet = [...buildMatDisabledSet(allMerged)];

	return {
		productId: product.id,
		variantId: product.variantId,
		title: product.title,
		priceMinor: product.price,
		thumbnail: product.images[0] ?? null,
		colorSlotTitles: slotTitles,
		colorsBySlot,
		allowCustomBySlot,
		matOverridesBySlot: product.matOverridesBySlot,
		textFields: product.textFields,
		uploadSettings: product.uploadSettings,
		linksCount: parseLinksCount(metadata),
		standAvailable: product.standAvailable,
		standColors,
		standAllowCustom: product.standAllowCustomColor,
		standMatOverrides: product.standMatOverrides,
		colorMap,
		matDisabledSet,
		standColorOptionTitle: STAND_COLOR_OPTION_TITLE,
	};
}
