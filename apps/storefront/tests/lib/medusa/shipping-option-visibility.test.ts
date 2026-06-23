import { describe, expect, it } from "vitest";
import {
	isShippingOptionEnabledInCheckout,
	SHIPPING_STORE_RULE_ATTR,
} from "@/lib/medusa/shipping-option-visibility";

describe("isShippingOptionEnabledInCheckout", () => {
	it("traktuje brak reguł jako włączone w checkoutcie", () => {
		expect(isShippingOptionEnabledInCheckout([])).toBe(true);
		expect(isShippingOptionEnabledInCheckout(undefined)).toBe(true);
	});

	it("wykrywa regułę enabled_in_store eq false", () => {
		expect(
			isShippingOptionEnabledInCheckout([
				{
					attribute: SHIPPING_STORE_RULE_ATTR,
					operator: "eq",
					value: "false",
				},
			]),
		).toBe(false);
	});

	it("ignoruje inne atrybuty reguł", () => {
		expect(
			isShippingOptionEnabledInCheckout([
				{ attribute: "is_return", operator: "eq", value: "true" },
			]),
		).toBe(true);
	});
});
