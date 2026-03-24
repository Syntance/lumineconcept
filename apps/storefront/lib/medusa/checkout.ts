import type { Address } from "@lumine/types";
import { medusa } from "./client";

export async function updateCartAddress(
  cartId: string,
  shippingAddress: Address,
  billingAddress?: Address,
) {
  const response = await medusa.store.cart.update(cartId, {
    shipping_address: shippingAddress,
    billing_address: billingAddress ?? shippingAddress,
  });
  return response.cart;
}

export async function setCartEmail(cartId: string, email: string) {
  const response = await medusa.store.cart.update(cartId, { email });
  return response.cart;
}

export async function getShippingOptions(cartId: string) {
  const response = await medusa.store.fulfillment.listCartOptions({ cart_id: cartId });
  return response.shipping_options;
}

export async function selectShippingOption(cartId: string, optionId: string) {
  const response = await medusa.store.cart.addShippingMethod(cartId, {
    option_id: optionId,
  });
  return response.cart;
}

export async function initPaymentSession(cartId: string, providerId: string) {
  const response = await medusa.store.payment.initiatePaymentSession(
    { cart_id: cartId },
    { provider_id: providerId },
  );
  return response;
}

export async function completeCart(cartId: string) {
  const response = await medusa.store.cart.complete(cartId);
  return response;
}
