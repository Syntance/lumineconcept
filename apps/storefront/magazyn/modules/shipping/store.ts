import "server-only";

import { adminFetch } from "@magazyn/core/medusa/client";
import { toMinorUnitsFromDecimal } from "@magazyn/core/lib/format";
import { magazynConfig } from "@magazyn/magazyn.config";
import {
	isShippingOptionEnabledInCheckout,
	SHIPPING_STORE_RULE_ATTR,
	shippingStoreVisibilityRules,
	type ShippingOptionRuleLike,
} from "@/lib/medusa/shipping-option-visibility";
import type { AdminShippingOption, ShippingOptionUpdateInput } from "./types";

const CURRENCY = magazynConfig.currency.toLowerCase();

const LIST_FIELDS = [
	"id",
	"name",
	"price_type",
	"type.code",
	"type.label",
	"type.description",
	"rules.id",
	"rules.attribute",
	"rules.operator",
	"rules.value",
	"prices.id",
	"prices.amount",
	"prices.currency_code",
].join(",");

type MedusaShippingOption = {
	id: string;
	name: string;
	price_type?: string;
	type?: { code?: string; label?: string; description?: string | null } | null;
	rules?: ShippingOptionRuleLike[] | null;
	prices?: Array<{ id?: string; amount?: number; currency_code?: string }> | null;
};

function priceRow(option: MedusaShippingOption) {
	return option.prices?.find((row) => row.currency_code === CURRENCY);
}

function priceMinor(option: MedusaShippingOption): number {
	return toMinorUnitsFromDecimal(priceRow(option)?.amount);
}

function isFlatPriceType(priceType: string | null | undefined): boolean {
	return priceType === "flat" || priceType === "flat_rate";
}

function mapShippingOption(option: MedusaShippingOption): AdminShippingOption {
	const row = priceRow(option);
	return {
		id: option.id,
		name: option.name,
		typeCode: option.type?.code ?? null,
		typeLabel: option.type?.label ?? null,
		typeDescription: option.type?.description ?? null,
		priceMinor: priceMinor(option),
		priceId: row?.id ?? null,
		priceType: option.price_type ?? null,
		checkoutEnabled: isShippingOptionEnabledInCheckout(option.rules),
	};
}

export async function listShippingOptionsAdmin(): Promise<AdminShippingOption[]> {
	const data = await adminFetch<{ shipping_options: MedusaShippingOption[] }>(
		`/admin/shipping-options?limit=50&fields=${LIST_FIELDS}`,
	);

	return (data.shipping_options ?? [])
		.map(mapShippingOption)
		.sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

async function fetchShippingOptionRules(optionId: string): Promise<ShippingOptionRuleLike[]> {
	const data = await adminFetch<{ shipping_option: MedusaShippingOption }>(
		`/admin/shipping-options/${optionId}?fields=id,rules.id,rules.attribute,rules.operator,rules.value`,
	);
	return data.shipping_option?.rules ?? [];
}

export async function setShippingOptionCheckoutEnabled(
	optionId: string,
	enabled: boolean,
): Promise<void> {
	const rules = await fetchShippingOptionRules(optionId);
	if (isShippingOptionEnabledInCheckout(rules) === enabled) return;

	const storeRules = shippingStoreVisibilityRules(rules);

	if (enabled) {
		if (storeRules.length === 0) return;
		await adminFetch(`/admin/shipping-options/${optionId}/rules/batch`, {
			method: "POST",
			body: JSON.stringify({
				delete: storeRules.map((rule) => rule.id).filter(Boolean),
			}),
		});
		return;
	}

	await adminFetch(`/admin/shipping-options/${optionId}/rules/batch`, {
		method: "POST",
		body: JSON.stringify({
			delete: storeRules.map((rule) => rule.id).filter(Boolean),
			create: [
				{
					attribute: SHIPPING_STORE_RULE_ATTR,
					operator: "eq",
					value: "false",
				},
			],
		}),
	});
}

export async function updateShippingOption(
	optionId: string,
	input: ShippingOptionUpdateInput,
): Promise<void> {
	const data = await adminFetch<{ shipping_option: MedusaShippingOption }>(
		`/admin/shipping-options/${optionId}?fields=id,name,price_type,type.code,type.label,type.description,prices.id,prices.amount,prices.currency_code,rules.id,rules.attribute,rules.operator,rules.value`,
	);
	const option = data.shipping_option;
	if (!option?.id) throw new Error("Nie znaleziono metody dostawy.");

	const name = input.name.trim();
	if (!name) throw new Error("Nazwa jest wymagana.");

	const body: Record<string, unknown> = { name };

	if (option.type?.code) {
		body.type = {
			code: option.type.code,
			label: input.typeLabel.trim() || option.type.label || name,
			description: input.typeDescription.trim() || null,
		};
	}

	const row = priceRow(option);
	if (row?.id && isFlatPriceType(option.price_type)) {
		if (!Number.isFinite(input.priceMajor) || input.priceMajor < 0) {
			throw new Error("Podaj poprawną cenę (0 lub więcej).");
		}
		body.prices = [
			{
				id: row.id,
				amount: input.priceMajor,
				currency_code: CURRENCY,
			},
		];
	}

	await adminFetch(`/admin/shipping-options/${optionId}`, {
		method: "POST",
		body: JSON.stringify(body),
	});

	await setShippingOptionCheckoutEnabled(optionId, input.checkoutEnabled);
}
