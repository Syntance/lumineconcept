export const MAX_PRODUCT_UPLOADS = 5;
export const MIN_PRODUCT_UPLOADS = 1;

export type ProductUploadSettings = {
	enabled: boolean;
	count: number;
	label: string;
};

export function clampUploadCount(value: number | null | undefined): number {
	const n = Number(value);
	if (!Number.isFinite(n)) return MAX_PRODUCT_UPLOADS;
	return Math.min(MAX_PRODUCT_UPLOADS, Math.max(MIN_PRODUCT_UPLOADS, Math.round(n)));
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

	return { enabled, count, label };
}

export function serializeUploadSettingsForMetadata(
	settings: ProductUploadSettings,
): Record<string, string> {
	return {
		uploads_enabled: settings.enabled ? "true" : "false",
		uploads_count: String(clampUploadCount(settings.count)),
		uploads_label: settings.label.trim(),
	};
}
