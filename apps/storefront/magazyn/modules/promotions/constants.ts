/** Wewnętrzny prefix kodu promocji darmowej dostawy powiązanej z głównym kodem. */
export const LUMINE_FS_PREFIX = "__lumine_fs_";

/** Atrybut Medusa dla targetowania produktów w promocji. */
export const LUMINE_PRODUCT_RULE_ATTR = "items.product.id";

/** Atrybut Medusa dla minimalnej wartości koszyka (grosze). */
export const LUMINE_SUBTOTAL_RULE_ATTR = "subtotal";

export function freeShippingPromotionCode(mainPromotionId: string): string {
	return `${LUMINE_FS_PREFIX}${mainPromotionId}`;
}

export function isShadowFreeShippingCode(code: string): boolean {
	return code.startsWith(LUMINE_FS_PREFIX);
}
