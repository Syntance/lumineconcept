import { resolveMedusaFetchBase } from "./resolve-fetch-base";

/** Pola koszyka wymagane przez UI (sumy pozycji, dostawa). */
export const CART_FIELDS_QUERY =
  "+items.total,+items.subtotal,+items.unit_price,+items.quantity,+items.thumbnail,+items.product.thumbnail,+items.product.images.url,+subtotal,+total,+tax_total,+shipping_total,+shipping_methods,+discount_total,+promotions.id,+promotions.code";

function publishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.trim() ||
    process.env.MEDUSA_PUBLISHABLE_KEY?.trim() ||
    ""
  );
}

/**
 * Store API przez same-origin proxy (przeglądarka) lub bezpośrednio (serwer).
 * Omija @medusajs/js-sdk — w dev Turbopack potrafił zwracać 200 na serwerze,
 * a klient SDK dostawał `TypeError: Failed to fetch` przy streamowanej odpowiedzi.
 */
export async function storeApiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = resolveMedusaFetchBase().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  const key = publishableKey();
  if (key && !headers.has("x-publishable-api-key")) {
    headers.set("x-publishable-api-key", key);
  }
  // Reguła ecom-core: żaden fetch Medusy bez limitu czasu. Domyślnie 30s;
  // caller może nadpisać własnym `signal` (np. krótszym dla prefetchy).
  return fetch(`${base}${normalizedPath}`, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(30_000),
    headers,
  });
}

export function cartFieldsSearchParams(): URLSearchParams {
  return new URLSearchParams({ fields: CART_FIELDS_QUERY });
}
