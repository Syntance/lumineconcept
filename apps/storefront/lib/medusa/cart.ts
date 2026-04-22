import { medusa } from "./client";
import { resolveMedusaFetchBase } from "./resolve-fetch-base";
import { getPolishRegionId } from "./region";

/**
 * Medusa 2 domyślnie nie zwraca `items.total` w koszyku — bez tego UI pokazuje „NaN zł”.
 * `*items` rozszerza pola pozycji (w tym sumy), `+` dokłada brakujące do domyślnego zestawu.
 */
const CART_RETRIEVE_QUERY = {
  fields:
    "+items.total,+items.subtotal,+items.unit_price,+items.quantity,+subtotal,+total,+tax_total,+shipping_total",
};

export async function createCart() {
  const response = await medusa.store.cart.create(
    { region_id: await getPolishRegionId() },
    CART_RETRIEVE_QUERY,
  );
  return response.cart;
}

export async function getCart(cartId: string) {
  const response = await medusa.store.cart.retrieve(cartId, CART_RETRIEVE_QUERY);
  return response.cart;
}

export async function addLineItem(
  cartId: string,
  variantId: string,
  quantity: number,
  metadata?: Record<string, string>,
) {
  const response = await medusa.store.cart.createLineItem(
    cartId,
    {
      variant_id: variantId,
      quantity,
      ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {}),
    },
    CART_RETRIEVE_QUERY,
  );
  return response.cart;
}

export async function updateLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number,
) {
  const response = await medusa.store.cart.updateLineItem(
    cartId,
    lineItemId,
    {
      quantity,
    },
    CART_RETRIEVE_QUERY,
  );
  return response.cart;
}

export async function removeLineItem(cartId: string, lineItemId: string) {
  const response = await medusa.store.cart.deleteLineItem(cartId, lineItemId);
  return response;
}

export async function applyPromotionCode(cartId: string, code: string) {
  const response = await medusa.store.cart.update(
    cartId,
    {
      promo_codes: [code],
    },
    CART_RETRIEVE_QUERY,
  );
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
  const base = resolveMedusaFetchBase();

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
