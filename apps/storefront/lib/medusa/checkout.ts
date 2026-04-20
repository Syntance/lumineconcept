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

/**
 * Jednorazowy bootstrap opcji DPD w Medusie (gdy w Adminie jest 0 opcji w strefie).
 * Wywoływane z checkoutu tylko gdy lista opcji jest pusta — idempotentne.
 */
export async function ensureLumineShippingBootstrap(): Promise<{ ok: boolean }> {
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/medusa`
      : (process.env.MEDUSA_BACKEND_URL?.trim() ||
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.trim() ||
        "http://localhost:9000");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      ? { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY }
      : {}),
  };

  const res = await fetch(`${base}/store/custom/ensure-shipping`, {
    method: "POST",
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.warn("[shipping] ensure bootstrap", res.status, body);
    return { ok: false };
  }
  const data = (await res.json()) as { ok?: boolean };
  return { ok: data.ok !== false };
}

export async function selectShippingOption(cartId: string, optionId: string) {
  const response = await medusa.store.cart.addShippingMethod(cartId, {
    option_id: optionId,
  });
  return response.cart;
}

export async function initPaymentSession(cartId: string, providerId: string) {
  const { cart } = await medusa.store.cart.retrieve(cartId);
  const response = await medusa.store.payment.initiatePaymentSession(
    cart,
    { provider_id: providerId },
  );
  return response;
}

export async function completeCart(cartId: string) {
  const response = await medusa.store.cart.complete(cartId);
  return response;
}
