export const MAX_PRODUCT_UPLOADS = 5;
export const MIN_PRODUCT_UPLOADS = 1;

export type ProductUploadSettings = {
	enabled: boolean;
	required: boolean;
	count: number;
	label: string;
};

export function clampUploadCount(value: number | null | undefined): number {
	const n = Number(value);
	if (!Number.isFinite(n)) return MAX_PRODUCT_UPLOADS;
	return Math.min(MAX_PRODUCT_UPLOADS, Math.max(MIN_PRODUCT_UPLOADS, Math.round(n)));
}

function parseBooleanMeta(value: unknown): boolean | undefined {
	if (value === "true" || value === true) return true;
	if (value === "false" || value === false) return false;
	return undefined;
}

export function parseUploadSettingsFromMetadata(
	meta: Record<string, unknown> | null | undefined,
): ProductUploadSettings {
	const enabled = meta?.uploads_enabled === "true" || meta?.uploads_enabled === true;
	const rawCount = meta?.uploads_count;
	const parsedCount =
		typeof rawCount === "string" || typeof rawCount === "number" ? Number(rawCount) : undefined;
	const count = clampUploadCount(parsedCount);
	const labelRaw = meta?.uploads_label;
	const label = typeof labelRaw === "string" ? labelRaw.trim() : "";
	const requiredRaw = parseBooleanMeta(meta?.uploads_required);
	/** Wsteczna zgodność: włączony upload bez flagi = wymagany. */
	const required = enabled ? (requiredRaw ?? true) : false;

	return { enabled, required, count, label };
}

export function serializeUploadSettingsForMetadata(
	settings: ProductUploadSettings,
): Record<string, string> {
	return {
		uploads_enabled: settings.enabled ? "true" : "false",
		uploads_required: settings.enabled && settings.required ? "true" : "false",
		uploads_count: String(clampUploadCount(settings.count)),
		uploads_label: settings.label.trim(),
	};
}

/** Walidacja przed dodaniem do koszyka — plik wymagany tylko gdy upload włączony i oznaczony jako required. */
export function isProductUploadComplete(
	settings: ProductUploadSettings,
	uploadedFileCount: number,
): boolean {
	if (!settings.enabled) return true;
	if (!settings.required) return true;
	return uploadedFileCount > 0;
}

export function getStorefrontUploadCount(settings: ProductUploadSettings): number {
	return settings.enabled ? settings.count : 0;
}
