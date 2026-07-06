/** Wewnętrzny prefix kodu promocji darmowej dostawy powiązanej z głównym kodem. */
export const LUMINE_FS_PREFIX = "__lumine_fs_";

/** Atrybut Medusa dla targetowania produktów w promocji. */
export const LUMINE_PRODUCT_RULE_ATTR = "items.product.id";

/** Atrybut Medusa dla minimalnej wartości koszyka (grosze). */
export const LUMINE_SUBTOTAL_RULE_ATTR = "subtotal";

/** Atrybut target-reguły promocji dostawy: nazwa metody wysyłki. */
export const LUMINE_SHIPPING_NAME_RULE_ATTR = "name";

/**
 * Nazwa metody-dopłaty ekspresowej — MUSI być identyczna z
 * EXPRESS_FEE_SHIPPING_METHOD_NAME w apps/backend/src/lib/express-fee.ts.
 * Promocje "darmowa dostawa" (100% na shipping_methods) wykluczają ją regułą
 * `name ne`, inaczej kod darmowej dostawy zerował także dopłatę express
 * (bug 06.07.2026: zniżka −27,50 zamiast −25,00).
 */
export const EXPRESS_FEE_SHIPPING_METHOD_NAME = "Dopłata ekspresowa (+50%)";

export function freeShippingPromotionCode(mainPromotionId: string): string {
	return `${LUMINE_FS_PREFIX}${mainPromotionId}`;
}

export function isShadowFreeShippingCode(code: string): boolean {
	return code.startsWith(LUMINE_FS_PREFIX);
}
