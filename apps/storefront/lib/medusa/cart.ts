import { medusa } from "./client";
import { getPolishRegionId } from "./region";

export async function createCart() {
  const response = await medusa.store.cart.create({
    region_id: await getPolishRegionId(),
  });
  return response.cart;
}

export async function getCart(cartId: string) {
  const response = await medusa.store.cart.retrieve(cartId);
  return response.cart;
}

export async function addLineItem(
  cartId: string,
  variantId: string,
  quantity: number,
  metadata?: Record<string, string>,
) {
  const response = await medusa.store.cart.createLineItem(cartId, {
    variant_id: variantId,
    quantity,
    ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {}),
  });
  return response.cart;
}

export async function updateLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number,
) {
  const response = await medusa.store.cart.updateLineItem(cartId, lineItemId, {
    quantity,
  });
  return response.cart;
}

export async function removeLineItem(cartId: string, lineItemId: string) {
  const response = await medusa.store.cart.deleteLineItem(cartId, lineItemId);
  return response;
}

export async function applyPromotionCode(cartId: string, code: string) {
  const response = await medusa.store.cart.update(cartId, {
    promo_codes: [code],
  });
  return response.cart;
}
