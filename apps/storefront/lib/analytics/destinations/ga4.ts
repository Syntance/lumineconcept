import type { AnalyticsEventName } from "../events/registry";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? "";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** Kolejka dataLayer — działa przed i po załadowaniu gtag.js (Consent Mode). */
function pushGACommand(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(args);
}

const ECOMMERCE_EVENTS = new Set<AnalyticsEventName>([
  "product_view",
  "add_to_cart",
  "remove_from_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
  "view_cart",
  "view_item_list",
]);

// PII fields never forwarded to GA4 DataLayer (GDPR)
const GA4_PII_DENY = new Set(["email", "phone", "first_name", "last_name"]);

function pickEcommerceParams(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (payload.currency != null) params.currency = payload.currency;
  if (payload.value != null) params.value = payload.value;
  if (payload.transaction_id != null) {
    params.transaction_id = payload.transaction_id;
  }
  if (Array.isArray(payload.items)) params.items = payload.items;
  if (payload.items_count != null) params.items_count = payload.items_count;
  if (payload.shipping_method != null) {
    params.shipping_tier = payload.shipping_method;
  }
  if (payload.payment_method != null) {
    params.payment_type = payload.payment_method;
  }
  if (payload.item_list_name != null) {
    params.item_list_name = payload.item_list_name;
  }
  return params;
}

function sanitizePayloadForGA4(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (!GA4_PII_DENY.has(k)) out[k] = v;
  }
  return out;
}

function pickProductViewParams(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const base = pickEcommerceParams(payload);
  if (payload.item_id != null) {
    base.items = [
      {
        item_id: payload.item_id,
        item_name: payload.item_name,
        price: payload.value ?? payload.price,
      },
    ];
  }
  return base;
}

/**
 * Ustawia segment biznesowy jako GA4 user property (custom dimension).
 * Pozwala wymiarować raporty wg segmentu (beauty/edu) bez doklejania pola
 * do każdego eventu. Wywoływać raz po inicjalizacji GA4.
 */
export function setGA4UserSegment(segment: string): void {
  if (!GA4_ID || typeof window === "undefined") return;
  pushGACommand("set", "user_properties", { segment });
}

export function sendGA4Event(
  name: AnalyticsEventName,
  payload: Record<string, unknown>,
): void {
  if (!GA4_ID || typeof window === "undefined") return;

  if (name === "page_view") {
    pushGACommand("event", "page_view", {
      page_path: payload.page_path,
      page_title: payload.title,
    });
    return;
  }

  if (name === "search") {
    pushGACommand("event", "search", {
      search_term: payload.search_term,
    });
    return;
  }

  if (name === "product_view") {
    pushGACommand("event", "view_item", pickProductViewParams(payload));
    return;
  }

  if (name === "view_item_list") {
    pushGACommand("event", "view_item_list", pickEcommerceParams(payload));
    return;
  }

  if (name === "view_cart") {
    pushGACommand("event", "view_cart", pickEcommerceParams(payload));
    return;
  }

  if (name === "add_to_cart") {
    pushGACommand("event", "add_to_cart", pickEcommerceParams(payload));
    return;
  }

  if (name === "remove_from_cart") {
    pushGACommand("event", "remove_from_cart", pickEcommerceParams(payload));
    return;
  }

  if (name === "begin_checkout") {
    pushGACommand("event", "begin_checkout", pickEcommerceParams(payload));
    return;
  }

  if (name === "add_shipping_info") {
    pushGACommand("event", "add_shipping_info", pickEcommerceParams(payload));
    return;
  }

  if (name === "add_payment_info") {
    pushGACommand("event", "add_payment_info", pickEcommerceParams(payload));
    return;
  }

  if (name === "purchase") {
    pushGACommand("event", "purchase", pickEcommerceParams(payload));
    return;
  }

  if (ECOMMERCE_EVENTS.has(name)) {
    pushGACommand("event", name, pickEcommerceParams(payload));
    return;
  }

  pushGACommand("event", name, sanitizePayloadForGA4(payload));
}
