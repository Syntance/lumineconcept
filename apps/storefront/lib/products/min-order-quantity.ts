export const MIN_ORDER_QUANTITY_META_KEY = "min_order_quantity";

/** Minimalna liczba sztuk do zamówienia (1–99). */
export function parseMinOrderQuantity(
	meta: Record<string, unknown> | null | undefined,
): number {
	const raw = meta?.[MIN_ORDER_QUANTITY_META_KEY];
	if (raw === undefined || raw === null || raw === "") return 1;
	const n = typeof raw === "number" ? raw : Number.parseInt(String(raw).trim(), 10);
	if (!Number.isFinite(n) || n < 1) return 1;
	return Math.min(99, Math.floor(n));
}

/**
 * Efektywna min. ilość na PDP / w koszyku.
 * Gdy w metadata brak wartości — opcjonalny fallback (np. vouchery: 5 szt.).
 */
export function resolveMinOrderQuantity(
	meta: Record<string, unknown> | null | undefined,
	opts?: { fallbackWhenUnset?: number },
): number {
	const raw = meta?.[MIN_ORDER_QUANTITY_META_KEY];
	if (raw !== undefined && raw !== null && raw !== "") {
		return parseMinOrderQuantity(meta);
	}
	const fallback = opts?.fallbackWhenUnset ?? 1;
	return Math.min(99, Math.max(1, Math.floor(fallback)));
}

export function serializeMinOrderQuantityForMetadata(minOrderQuantity: number): string {
	const clamped = Math.min(99, Math.max(1, Math.floor(minOrderQuantity)));
	return String(clamped);
}

/** Odczyt z metadanych pozycji koszyka (zapisane przy dodaniu). */
export function minOrderQuantityFromLineMetadata(
	meta: Record<string, string> | null | undefined,
): number {
	if (!meta) return 1;
	return parseMinOrderQuantity(meta as Record<string, unknown>);
}
