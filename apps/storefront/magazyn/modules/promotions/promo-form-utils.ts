import type { AdminPromoCode, PromoCodeInput } from "./types";

export function promoCodeToFormValues(promo: AdminPromoCode): PromoCodeInput {
	let discountValueMajor = 0;
	if (promo.discountType === "percentage") {
		discountValueMajor = promo.discountValue;
	} else if (promo.discountType === "fixed") {
		discountValueMajor = promo.discountValue / 100;
	}

	return {
		code: promo.code,
		status: promo.status === "inactive" ? "draft" : promo.status,
		discountType: promo.discountType,
		discountValueMajor,
		productIds: promo.productIds,
		freeShippingEnabled: promo.freeShippingEnabled,
		freeShippingMinAmountMajor:
			promo.freeShippingMinAmount && promo.freeShippingMinAmount > 0
				? promo.freeShippingMinAmount / 100
				: null,
	};
}

export function formatPromoDiscountLabel(promo: AdminPromoCode): string {
	if (promo.discountType === "percentage") return `−${promo.discountValue}%`;
	if (promo.discountType === "fixed") {
		return `−${(promo.discountValue / 100).toLocaleString("pl-PL", {
			style: "currency",
			currency: "PLN",
		})}`;
	}
	if (promo.freeShippingEnabled) return "Darmowa dostawa";
	return "—";
}

export function formatPromoScopeLabel(promo: AdminPromoCode, productTitleById: Map<string, string>): string {
	if (promo.productIds.length === 0) return "Całe zamówienie";
	const names = promo.productIds
		.map((id) => productTitleById.get(id))
		.filter((name): name is string => Boolean(name));
	if (names.length === 0) return `${promo.productIds.length} produktów`;
	if (names.length <= 2) return names.join(", ");
	return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}
