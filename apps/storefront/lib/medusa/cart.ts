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

/**
 * Zapis metadanych koszyka — fire-and-forget z retry.
 *
 * 1. Próbuje dedykowany `/store/custom/cart-express` (po deploy backendu).
 * 2. Fallback na `/store/carts/:id` z 3 próbami (Medusa updateCartWorkflow lubi 500 przy lock-contention).
 * 3. Nigdy nie rzuca — zwraca `null` przy niepowodzeniu (UI działa optymistycznie).
 */
export async function updateCartMetadata(
  cartId: string,
  metadataPatch: Record<string, string>,
): Promise<unknown | null> {
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

  const expressOnly =
    Object.keys(metadataPatch).length === 1 && "express_delivery" in metadataPatch;

  if (expressOnly) {
    try {
      const expressRes = await fetch(`${base}/store/custom/cart-express`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          cart_id: cartId,
          express_delivery: metadataPatch.express_delivery === "true",
        }),
      });
      if (expressRes.ok) {
        const data = (await expressRes.json()) as { cart?: unknown };
        if (data.cart) return data.cart;
      }
    } catch {
      /* endpoint nie dostępny — fallback niżej */
    }
  }

  const DELAYS = [0, 800, 2000];
  for (let attempt = 0; attempt < DELAYS.length; attempt++) {
    if (DELAYS[attempt]) {
      await new Promise((r) => setTimeout(r, DELAYS[attempt]));
    }
    try {
      const res = await fetch(`${base}/store/carts/${cartId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ metadata: metadataPatch }),
      });
      if (res.ok) {
        const data = (await res.json()) as { cart?: unknown };
        return data.cart ?? null;
      }
      if (res.status < 500) return null;
    } catch {
      /* sieć / timeout — retry */
    }
  }

  console.warn("[cart] updateCartMetadata: 3 próby nieudane, metadata nie zapisana na serwerze.");
  return null;
}
