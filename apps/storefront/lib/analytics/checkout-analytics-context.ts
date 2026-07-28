/** Kontekst checkoutu dla purchase (duration, shipping, payment) — sessionStorage. */
export const CHECKOUT_ANALYTICS_STORAGE_KEY = "lumine.checkout_analytics.v1";

export type CheckoutAnalyticsContext = {
  startedAt?: number;
  shippingMethod?: string;
  paymentMethod?: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function writeCheckoutAnalyticsContext(
  partial: CheckoutAnalyticsContext,
): void {
  if (!isBrowser()) return;
  try {
    const current = readCheckoutAnalyticsContext() ?? {};
    const next: CheckoutAnalyticsContext = { ...current, ...partial };
    sessionStorage.setItem(
      CHECKOUT_ANALYTICS_STORAGE_KEY,
      JSON.stringify(next),
    );
  } catch {
    /* prywatny tryb */
  }
}

export function readCheckoutAnalyticsContext(): CheckoutAnalyticsContext | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_ANALYTICS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckoutAnalyticsContext;
  } catch {
    return null;
  }
}

export function clearCheckoutAnalyticsContext(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(CHECKOUT_ANALYTICS_STORAGE_KEY);
  } catch {
    /* prywatny tryb */
  }
}

/**
 * Dedup eventów lejka „raz na koszyk" — sessionStorage przeżywa odświeżenie
 * strony i powrót z bramki płatności (ref w komponencie nie przeżywa).
 *
 * Bez tego `begin_checkout` odpalał się przy każdym wejściu na /checkout
 * (refresh, back, wejście z koszykiem odtworzonym z localStorage), przez co
 * lejek pokazywał WIĘCEJ rozpoczętych checkoutów niż dodań do koszyka
 * i zaniżał konwersję checkout → purchase.
 */
export const CHECKOUT_FUNNEL_ONCE_STORAGE_KEY = "lumine.checkout_funnel_once.v1";

export type CheckoutFunnelOnceEvent = "begin_checkout" | "checkout_abandon";

type FunnelOnceMap = Partial<Record<CheckoutFunnelOnceEvent, string>>;

function readFunnelOnce(): FunnelOnceMap {
  if (!isBrowser()) return {};
  try {
    const raw = sessionStorage.getItem(CHECKOUT_FUNNEL_ONCE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as FunnelOnceMap;
  } catch {
    return {};
  }
}

/** Czy event poleciał już dla TEGO koszyka (nowy koszyk = liczymy od nowa). */
export function hasFiredForCart(
  event: CheckoutFunnelOnceEvent,
  cartId: string,
): boolean {
  if (!cartId) return false;
  return readFunnelOnce()[event] === cartId;
}

export function markFiredForCart(
  event: CheckoutFunnelOnceEvent,
  cartId: string,
): void {
  if (!isBrowser() || !cartId) return;
  try {
    const next: FunnelOnceMap = { ...readFunnelOnce(), [event]: cartId };
    sessionStorage.setItem(
      CHECKOUT_FUNNEL_ONCE_STORAGE_KEY,
      JSON.stringify(next),
    );
  } catch {
    /* prywatny tryb */
  }
}

/** Czytelna etykieta metody płatności dla purchase (GA4 payment_type). */
export function paymentMethodAnalyticsLabel(providerId: string): string {
  if (providerId === "pp_przelewy24_przelewy24") return "przelewy24";
  if (providerId === "pp_system_default") return "bank_transfer";
  return providerId;
}
