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

/**
 * Jeden PUT /store/carts/:id z emailem + adresami.
 * Medusa v2 blokuje cart na czas workflow — dwa osobne updaty sekwencyjnie
 * potrafią się blokować i trwać 10-15s. Łączymy w jeden request.
 */
export async function saveContactDetails(
  cartId: string,
  email: string,
  shippingAddress: Address,
  billingAddress?: Address,
) {
  const response = await medusa.store.cart.update(cartId, {
    email,
    shipping_address: shippingAddress,
    billing_address: billingAddress ?? shippingAddress,
  });
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

export type CompleteCartResponse =
  | { type: "order"; order: { id: string; display_id?: number } }
  | {
      type: "cart";
      cart: Record<string, unknown>;
      error?: { message?: string; name?: string; type?: string; code?: string };
    };

/** Rozpoznaje typowy dla Medusy v2 komunikat „Cart is already completed". */
export function isCartAlreadyCompletedError(e: unknown): boolean {
  const msg =
    (e as { message?: string } | null)?.message ??
    (typeof e === "string" ? e : "") ??
    "";
  return /already\s+completed/i.test(msg);
}

/**
 * Zamienia surowy błąd HTTP z Medusy na sensowny, przetłumaczony komunikat
 * (Safari pokazywało generic „An unknown error occurred" bez kontekstu).
 */
export function describeMedusaError(e: unknown, fallback: string): string {
  if (!e) return fallback;
  const raw = e as Record<string, unknown>;
  const message =
    (raw.message as string | undefined) ??
    (raw.error as { message?: string } | undefined)?.message ??
    "";
  const type = (raw.type as string | undefined) ?? "";
  const code = (raw.code as string | undefined) ?? "";
  if (isCartAlreadyCompletedError(e)) {
    return "Koszyk został już sfinalizowany. Zacznij od nowa.";
  }
  if (message) return message;
  if (type || code) return `${type || "error"}${code ? ` (${code})` : ""}`;
  return fallback;
}

/**
 * `cart.complete` potrafi zwrócić 409 „conflicted with another request…"
 * gdy poprzednia próba wciąż się wykonuje (np. długi cold start Railway).
 * Ponawiamy kilka razy z krótkim odstępem — każde kolejne wywołanie z tym samym
 * Idempotency-Key zwraca stan z poprzedniej próby, więc to bezpieczne.
 */
export async function completeCart(
  cartId: string,
  opts: { retries?: number; delayMs?: number } = {},
): Promise<CompleteCartResponse> {
  const retries = opts.retries ?? 4;
  const delayMs = opts.delayMs ?? 2500;
  let lastErr: unknown = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const result = (await medusa.store.cart.complete(cartId)) as CompleteCartResponse;
      if (result.type === "cart" && (result.error?.message || result.error?.code)) {
        console.warn("[checkout] complete→cart", result.error, result.cart);
      }
      return result;
    } catch (e: unknown) {
      lastErr = e;
      const status =
        (e as { status?: number }).status ??
        (e as { response?: { status?: number } }).response?.status ??
        0;
      const msg = (e as { message?: string }).message ?? "";
      const isConflict =
        status === 409 ||
        /idempotency/i.test(msg) ||
        /conflict/i.test(msg);
      const alreadyCompleted = isCartAlreadyCompletedError(e);
      if (isConflict && !alreadyCompleted && i < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("completeCart: przekroczono limit prób");
}
