/** Atrybut reguły Medusy — kontekst checkoutu przekazuje `enabled_in_store: "true"`. */
export const SHIPPING_STORE_RULE_ATTR = "enabled_in_store";

export type ShippingOptionRuleLike = {
	id?: string;
	attribute?: string;
	operator?: string;
	value?: unknown;
};

function ruleScalarValue(value: unknown): string | null {
	if (value == null) return null;
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (typeof value === "object" && value !== null && "value" in value) {
		const inner = (value as { value?: unknown }).value;
		if (typeof inner === "string") return inner;
		if (typeof inner === "number" || typeof inner === "boolean") return String(inner);
	}
	return null;
}

export function shippingStoreVisibilityRules(
	rules: ShippingOptionRuleLike[] | null | undefined,
): ShippingOptionRuleLike[] {
	return (rules ?? []).filter((rule) => rule.attribute === SHIPPING_STORE_RULE_ATTR);
}

/**
 * Czy metoda jest widoczna w checkoutcie sklepu.
 * Brak reguł = widoczna. Reguła `enabled_in_store eq false` ukrywa w sklepie (Medusa Store API).
 */
export function isShippingOptionEnabledInCheckout(
	rules: ShippingOptionRuleLike[] | null | undefined,
): boolean {
	const storeRules = shippingStoreVisibilityRules(rules);
	if (storeRules.length === 0) return true;

	return !storeRules.some((rule) => {
		if (rule.operator !== "eq") return false;
		const scalar = ruleScalarValue(rule.value);
		return scalar === "false";
	});
}
