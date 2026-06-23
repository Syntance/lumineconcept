import { isValidHex } from "@/lib/color/hex";
import { doesUploadBlockAddToCart } from "@/lib/products/upload-settings";
import type { TextFieldDef } from "@/lib/products/text-fields";
import type { ProductUploadSettings } from "@/lib/products/upload-settings";
import { CUSTOM_COLOR_VALUE, isMatAllowed } from "@/components/product/ProductVariantSelector";
import type { ManualOrderProductConfig } from "./create-order-types";

export type ManualOrderColorState = {
	selected: string;
	customHex: string | null;
	matFinish: boolean;
};

export type ManualOrderLineConfigState = {
	colorStates: Record<string, ManualOrderColorState>;
	includeStand: boolean;
	standColorState: ManualOrderColorState;
	textFieldValues: Record<string, string>;
	links: string[];
	uploadedFiles: Array<{ url: string; filename: string } | null>;
	lineNote: string;
};

export function extractMetaKey(optionTitle: string): string {
	const lower = optionTitle.toLowerCase().replace(/\s+/g, "_");
	if (lower === "kolor") return "kolor";
	return lower.replace(/^kolor_/, "");
}

export function createEmptyLineConfigState(config: ManualOrderProductConfig): ManualOrderLineConfigState {
	return {
		colorStates: Object.fromEntries(
			config.colorSlotTitles.map((title) => [
				title,
				{ selected: "", customHex: null, matFinish: false } satisfies ManualOrderColorState,
			]),
		),
		includeStand: false,
		standColorState: { selected: "", customHex: null, matFinish: false },
		textFieldValues: Object.fromEntries(config.textFields.map((field) => [field.key, ""])),
		links: Array.from({ length: config.linksCount }, () => ""),
		uploadedFiles: Array.from(
			{ length: config.uploadSettings.enabled ? config.uploadSettings.count : 0 },
			() => null,
		),
		lineNote: "",
	};
}

function isColorStateComplete(
	state: ManualOrderColorState,
	allowCustom: boolean,
): boolean {
	if (!state.selected.trim()) return false;
	if (state.selected === CUSTOM_COLOR_VALUE) {
		return allowCustom && !!state.customHex && isValidHex(state.customHex);
	}
	return true;
}

export function validateManualOrderLineConfig(
	config: ManualOrderProductConfig,
	state: ManualOrderLineConfigState,
): string | null {
	for (const title of config.colorSlotTitles) {
		const colors = config.colorsBySlot[title] ?? [];
		if (colors.length === 0) continue;
		const allowCustom = config.allowCustomBySlot[title] ?? false;
		if (!isColorStateComplete(state.colorStates[title] ?? { selected: "", customHex: null, matFinish: false }, allowCustom)) {
			return `Wybierz kolor: ${title}`;
		}
	}

	if (config.standAvailable && state.includeStand) {
		if (!isColorStateComplete(state.standColorState, config.standAllowCustom)) {
			return "Wybierz kolor podstawki";
		}
	}

	for (const field of config.textFields) {
		const value = state.textFieldValues[field.key]?.trim() ?? "";
		if (field.required && !value) {
			return `Uzupełnij pole: ${field.label}`;
		}
		if (field.maxLength && value.length > field.maxLength) {
			return `${field.label}: maks. ${field.maxLength} znaków`;
		}
	}

	if (config.linksCount > 0) {
		const missing = state.links.slice(0, config.linksCount).some((link) => !link.trim());
		if (missing) {
			return config.linksCount === 1
				? "Podaj link do kodu QR"
				: `Podaj wszystkie ${config.linksCount} linki do kodów QR`;
		}
	}

	const uploadedCount = state.uploadedFiles.filter((file) => file?.url).length;
	if (doesUploadBlockAddToCart(config.uploadSettings, uploadedCount)) {
		const label = config.uploadSettings.label.trim() || "Plik klienta";
		return `Dodaj wymagany plik: ${label}`;
	}

	return null;
}

function appendColorMetadata(
	meta: Record<string, string>,
	title: string,
	state: ManualOrderColorState,
	colorMap: Record<string, string>,
	matDisabledSet: Set<string>,
): void {
	const key = extractMetaKey(title);
	meta[`color_${key}_label`] = title;
	const { selected, customHex, matFinish } = state;
	if (selected && selected !== CUSTOM_COLOR_VALUE) {
		meta[`color_${key}`] = selected;
		const hex = colorMap[selected.toLowerCase()];
		if (hex) meta[`color_${key}_hex`] = hex;
	}
	if (customHex && isValidHex(customHex)) {
		meta[`color_${key}_custom`] = customHex;
	}
	if (matFinish && selected && selected !== CUSTOM_COLOR_VALUE && isMatAllowed(selected, matDisabledSet)) {
		meta[`color_${key}_mat`] = "true";
	}
}

export function buildManualOrderLineMetadata(
	config: ManualOrderProductConfig,
	state: ManualOrderLineConfigState,
): Record<string, string> {
	const meta: Record<string, string> = {};
	const matDisabledSet = new Set(config.matDisabledSet);

	for (const title of config.colorSlotTitles) {
		const colorState = state.colorStates[title];
		if (!colorState) continue;
		appendColorMetadata(meta, title, colorState, config.colorMap, matDisabledSet);
	}

	for (const field of config.textFields) {
		const value = state.textFieldValues[field.key]?.trim();
		if (value) {
			meta[`text_${field.key}`] = value;
			meta[`text_${field.key}_label`] = field.label;
		}
	}

	for (let index = 0; index < config.linksCount; index++) {
		const url = state.links[index]?.trim();
		if (url) meta[`link_${index + 1}`] = url;
	}

	state.uploadedFiles.forEach((file, index) => {
		if (file?.url) meta[`file_${index + 1}`] = file.url;
	});

	if (config.standAvailable && state.includeStand) {
		meta.certificate_stand = "true";
		appendColorMetadata(
			meta,
			config.standColorOptionTitle,
			state.standColorState,
			config.colorMap,
			matDisabledSet,
		);
	}

	const lineNote = state.lineNote.trim();
	if (lineNote) meta.line_note = lineNote;

	return meta;
}

export function summarizeLineConfig(
	config: ManualOrderProductConfig,
	metadata: Record<string, string>,
): string {
	const parts: string[] = [];

	for (const title of config.colorSlotTitles) {
		const key = extractMetaKey(title);
		const color = metadata[`color_${key}`]?.trim();
		const custom = metadata[`color_${key}_custom`]?.trim();
		if (color) parts.push(`${title}: ${color}`);
		else if (custom) parts.push(`${title}: ${custom}`);
	}

	if (metadata.certificate_stand === "true") {
		const standKey = extractMetaKey(config.standColorOptionTitle);
		const standColor = metadata[`color_${standKey}`] ?? metadata[`color_${standKey}_custom`];
		parts.push(standColor ? `Podstawka: ${standColor}` : "Podstawka");
	}

	for (const field of config.textFields) {
		const value = metadata[`text_${field.key}`]?.trim();
		if (value) parts.push(`${field.label}: ${value.length > 24 ? `${value.slice(0, 24)}…` : value}`);
	}

	const fileCount = Object.keys(metadata).filter((key) => key.startsWith("file_") && metadata[key]?.trim()).length;
	if (fileCount > 0) parts.push(`${fileCount} plik${fileCount === 1 ? "" : fileCount < 5 ? "i" : "ów"}`);

	if (metadata.line_note?.trim()) parts.push("Uwagi");

	return parts.join(" · ") || "Skonfigurowano";
}

export function hasConfiguratorRequirements(config: ManualOrderProductConfig): boolean {
	return (
		config.colorSlotTitles.some((title) => (config.colorsBySlot[title]?.length ?? 0) > 0) ||
		config.textFields.length > 0 ||
		config.uploadSettings.enabled ||
		config.linksCount > 0 ||
		config.standAvailable
	);
}

export type { TextFieldDef, ProductUploadSettings };
