import type { Address } from "@lumine/types";
import type { HttpTypes } from "@medusajs/types";
import { medusa } from "./client";
import { resolveMedusaFetchBase } from "./resolve-fetch-base";

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
 * Odbiór osobisty — `type.code` / `shipping_option_type.code` z API albo nazwa
 * (np. „Odbiór osobisty” z `ensure-lumine-shipping`).
 */
export function isPickupShippingOption(
  o: Record<string, unknown> | undefined,
): boolean {
  if (!o) return false;
  const codeOf = (t: unknown) =>
    String((t as { code?: string } | undefined)?.code ?? "").toLowerCase();
  if (codeOf(o.type) === "pickup") return true;
  if (codeOf(o.shipping_option_type) === "pickup") return true;
  const name = String(o.name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (name.includes("odbior") && name.includes("osobist")) return true;
  return false;
}

function cartOptionsHavePickup(raw: unknown[] | null | undefined): boolean {
  if (!raw?.length) return false;
  return raw.some((o) => isPickupShippingOption(o as Record<string, unknown>));
}

/** Wspólna logika z `ShippingSelector` — kwota z `amount` / `calculated_price` Store API. */
export function normalizeShippingOptionsForDisplay(
  raw: Array<Record<string, unknown>> | null | undefined,
): Array<{ id: string; name: string; price: number; isPickup: boolean }> {
  const list = raw ?? [];
  return list.map((o) => {
    const calc = o.calculated_price as
      | { calculated_amount?: number }
      | undefined;
    const amount =
      Number(o.amount ?? o.price ?? calc?.calculated_amount ?? 0) || 0;
    return {
      id: String(o.id),
      name: (o.name as string | undefined) ?? "Dostawa",
      price: amount,
      isPickup: isPickupShippingOption(o),
    };
  });
}

/**
 * Szacunek koszyka przed wyborem metody: najtańsza opcja **płatna** (kurier),
 * bez odbioru osobistego (`pickup`), żeby min(0, 24.99) nie zerowało podglądu.
 */
export function pickLowestPaidShippingOptionPrice(
  options: Array<{ price: number; isPickup: boolean }>,
): number | null {
  const paid = options.filter((o) => !o.isPickup);
  if (!paid.length) return null;
  return Math.min(...paid.map((o) => o.price));
}

/** @deprecated Użyj `pickLowestPaidShippingOptionPrice` — pickup ma cenę 0. */
export function pickLowestShippingOptionPrice(
  options: Array<{ price: number; isPickup?: boolean }>,
): number | null {
  const normalized = options.map((o) => ({
    price: o.price,
    isPickup: o.isPickup ?? false,
  }));
  return pickLowestPaidShippingOptionPrice(normalized);
}

/**
 * Moduł-level cache promise'a z opcjami dostawy per cartId.
 *
 * Przed prefetchem Step 2 wchodził a opcje ładowały się dopiero ~3,4 s po
 * kliknięciu. Wołamy tę funkcję od razu jak mamy `cartId` (Step 1), a
 * `ShippingSelector` w Step 2 korzysta z tego samego cached promise'a — jeśli
 * prefetch już się
 * skończył, dane są natychmiast. Cache per cartId trzyma do zmiany koszyka.
 *
 * Celowo nie dajemy TTL — promise jest idempotentny (w najgorszym wypadku
 * pokaże dane sprzed kilku sekund, a `selectShippingOption` i tak walidowane
 * jest serwerowo po wyborze).
 */
const shippingOptionsCache = new Map<
  string,
  Promise<Awaited<ReturnType<typeof getShippingOptions>>>
>();

export function prefetchShippingOptions(cartId: string) {
  if (!cartId) return Promise.resolve([]);
  const cached = shippingOptionsCache.get(cartId);
  if (cached) return cached;
  const promise = (async () => {
    let raw = await getShippingOptions(cartId);
    /**
     * Bootstrap wcześniej tylko przy pustej liście — wtedy istniejące wdrożenia
     * miały wyłącznie DPD i nigdy nie dostawały odbioru. Jeśli brak opcji
     * `pickup`, wołamy `ensure-shipping` ponownie (idempotentnie dokleja brak).
     */
    const list = (raw ?? []) as unknown[];
    if (!list.length || !cartOptionsHavePickup(list)) {
      await ensureLumineShippingBootstrap();
      const refreshed = await getShippingOptions(cartId);
      if (refreshed?.length) raw = refreshed;
    }
    return raw;
  })().catch((e) => {
    shippingOptionsCache.delete(cartId);
    throw e;
  });
  shippingOptionsCache.set(cartId, promise);
  return promise;
}

export function invalidateShippingOptionsCache(cartId?: string) {
  if (cartId) shippingOptionsCache.delete(cartId);
  else shippingOptionsCache.clear();
}

/**
 * Moduł-level cache promise'a z „gotowością płatności" — regionem PL i listą
 * providerów. Tak samo jak przy shipping: wołamy w Step 1, a Step 2→3
 * korzysta z gotowego rezultatu zamiast robić 2 dodatkowe round-tripy
 * (`GET /store/regions` + `GET /store/payment-providers`), które w sumie
 * dodawały ~1,5 s do przejścia na krok płatności.
 *
 * Cache'ujemy do końca sesji — region i lista providerów zmieniają się
 * wyjątkowo rzadko (nowy deploy backendu). Jeśli w kroku 3 brakuje
 * providera dla wybranego cart.regionu, storefront fallbackuje na
 * `ensureLuminePaymentBootstrap()` — ta ścieżka i tak jest idempotentna.
 */
type PaymentReadiness = {
  regionId: string;
  providerId: string;
};

let paymentReadinessPromise: Promise<PaymentReadiness> | null = null;

const SYSTEM_PAYMENT_PROVIDER_ID = "pp_system_default";

function pickPreferredProvider(list: Array<{ id: string }>): string | undefined {
  return (
    list.find((p) => p.id === SYSTEM_PAYMENT_PROVIDER_ID)?.id ?? list[0]?.id
  );
}

export function prefetchPaymentReadiness(
  getRegionId: () => Promise<string>,
): Promise<PaymentReadiness> {
  if (paymentReadinessPromise) return paymentReadinessPromise;
  paymentReadinessPromise = (async () => {
    const regionId = await getRegionId();
    let providers = await listPaymentProviders(regionId);
    let providerId = pickPreferredProvider(providers);
    if (!providerId) {
      await ensureLuminePaymentBootstrap();
      providers = await listPaymentProviders(regionId);
      providerId = pickPreferredProvider(providers);
    }
    if (!providerId) {
      throw new Error(
        "Brak skonfigurowanych metod płatności. Skontaktuj się z obsługą.",
      );
    }
    return { regionId, providerId };
  })().catch((e) => {
    paymentReadinessPromise = null;
    throw e;
  });
  return paymentReadinessPromise;
}

export function invalidatePaymentReadinessCache() {
  paymentReadinessPromise = null;
}

/**
 * Jednorazowy bootstrap opcji DPD w Medusie (gdy w Adminie jest 0 opcji w strefie).
 * Wywoływane z checkoutu tylko gdy lista opcji jest pusta — idempotentne.
 */
export async function ensureLumineShippingBootstrap(): Promise<{ ok: boolean }> {
  const base = resolveMedusaFetchBase();

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

/**
 * Pobiera listę payment-providerów aktywnych dla regionu. W trybie testowym
 * oczekujemy przynajmniej `pp_system_default` (rejestrowany przez moduł
 * `@medusajs/medusa/payment`). Gdy lista jest pusta — wywołujący powinien
 * zabootstrapować providera przez `ensureLuminePaymentBootstrap()`.
 */
export async function listPaymentProviders(regionId: string) {
  const { payment_providers } = (await medusa.store.payment.listPaymentProviders(
    { region_id: regionId },
  )) as { payment_providers: Array<{ id: string; is_enabled?: boolean }> };
  return payment_providers.filter((p) => p.is_enabled !== false);
}

/**
 * Idempotentnie dokleja `pp_system_default` do regionów, gdy nie jest podpięty
 * (pierwszy deploy po dodaniu modułu payment do configu Medusy).
 */
export async function ensureLuminePaymentBootstrap(): Promise<{ ok: boolean }> {
  const base = resolveMedusaFetchBase();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      ? { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY }
      : {}),
  };

  const res = await fetch(`${base}/store/custom/ensure-payment`, {
    method: "POST",
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.warn("[payment] ensure bootstrap", res.status, body);
    return { ok: false };
  }
  const data = (await res.json()) as { ok?: boolean };
  return { ok: data.ok !== false };
}

/**
 * Wyzwala po stronie Medusy mail „potwierdzenie zamówienia" dla podanego
 * `order_id`. Używamy jako niezawodnego kanału obok subscribera `order.placed`
 * (local event bus pod Railway bywa zawodny — zob. backend/route
 * `/store/custom/notify-order-placed`). Backend ma `idempotency_key` więc
 * wielokrotne wywołanie nie wyśle duplikatów.
 *
 * Strategia „fire-and-forget" (po migracji do jednego regionu backend jest
 * szybki < 1 s, więc długi await był szkodliwy — opóźniał nawigację do
 * strony potwierdzenia o 500-700 ms bez żadnej korzyści).
 *
 *  1) `sendBeacon` — gwarantowana dostawa nawet po `window.location.assign`.
 *     To jest nasz główny kanał.
 *  2) `fetch(..., keepalive: true)` — kanał zapasowy, gdyby beacon był
 *     zablokowany przez ad-blocker / stare przeglądarki. Odpalamy bez
 *     awaita; `keepalive` dba o dokończenie mimo nawigacji.
 *
 * NIGDY nie rzuca — błąd providera maila nie może zablokować checkoutu.
 */
export function notifyOrderPlaced(orderId: string): void {
  if (!orderId) return;
  const base = resolveMedusaFetchBase();

  const url = `${base}/store/custom/notify-order-placed`;
  const payload = JSON.stringify({ order_id: orderId });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      ? { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY }
      : {}),
  };

  let beaconDelivered = false;
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    try {
      const blob = new Blob([payload], { type: "application/json" });
      beaconDelivered = navigator.sendBeacon(url, blob);
    } catch {
      beaconDelivered = false;
    }
  }

  if (!beaconDelivered) {
    void fetch(url, {
      method: "POST",
      headers,
      body: payload,
      keepalive: true,
    }).catch((e) => {
      console.warn("[mail] notify-order-placed fire-and-forget error", e);
    });
  }
}

export async function selectShippingOption(cartId: string, optionId: string) {
  const response = await medusa.store.cart.addShippingMethod(cartId, {
    option_id: optionId,
  });
  return response.cart;
}

/**
 * Ekspresowe przygotowanie checkoutu w 1 HTTP round-tripie:
 *   addShippingMethod + createPaymentCollection (jeśli brak) +
 *   createPaymentSession (jeśli brak dla providera).
 *
 * Oszczędza ~300-500 ms (dwa round-tripy zamiast jednego) w kroku 2 → 3.
 * Backend endpoint jest idempotentny — bezpieczne retry.
 *
 * Nie zwraca pełnego `cart` — storefront i tak odświeża go przez
 * `getCart(cartId)`; dzięki temu backend unika kapryśnego joina `region.*`
 * w remoteQuery, a odpowiedź jest szybka (pole `paymentCollectionId`).
 */
export async function prepareCheckout(
  cartId: string,
  optionId: string,
  providerId: string,
): Promise<{ paymentCollectionId?: string }> {
  const base = resolveMedusaFetchBase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      ? { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY }
      : {}),
  };

  const res = await fetch(`${base}/store/custom/prepare-checkout`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      cart_id: cartId,
      option_id: optionId,
      provider_id: providerId,
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      type?: string;
    };
    const err = new Error(
      body.message ?? `prepare-checkout ${res.status}`,
    ) as Error & { status?: number; type?: string };
    err.status = res.status;
    err.type = body.type;
    throw err;
  }
  const data = (await res.json()) as {
    ok?: boolean;
    payment_collection_id?: string;
  };
  return { paymentCollectionId: data.payment_collection_id };
}

/**
 * Medusa SDK v2 wymaga świeżego obiektu cart (nie ID), żeby policzyć tax/total
 * dla sesji płatności. Wcześniej robiliśmy `cart.retrieve` wewnątrz — w
 * checkoutcie to był zbędny round-trip, bo `selectShippingOption` tuż przed
 * tym zwraca już świeży cart (po doliczeniu dostawy). Pozwalamy przekazać
 * go przez trzeci argument; fallback `retrieve` zostaje dla wywołań bez
 * świeżego kontekstu (np. z zewnątrz / testów).
 */
export async function initPaymentSession(
  cartId: string,
  providerId: string,
  freshCart?: HttpTypes.StoreCart,
) {
  const cart = freshCart ?? (await medusa.store.cart.retrieve(cartId)).cart;
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
  const status =
    (raw.status as number | undefined) ??
    ((raw.response as { status?: number } | undefined)?.status) ??
    0;
  if (isCartAlreadyCompletedError(e)) {
    return "Koszyk został już sfinalizowany. Zacznij od nowa.";
  }
  /**
   * „An unknown error occurred" to generyczny tekst z Medusa SDK gdy upstream
   * zwrócił 500 bez szczegółów (np. zakleszczenie locka w `acquire-lock-step`
   * po cold starcie Railway). Pokazujemy userowi realny komunikat po polsku
   * z prośbą o ponowienie.
   */
  const looksGeneric =
    !message || /^an unknown error occurred\.?$/i.test(message.trim());
  if (
    looksGeneric &&
    (status >= 500 || status === 0) &&
    !(type || code)
  ) {
    return "Chwilowy problem z serwerem. Poczekaj 10 sekund i spróbuj jeszcze raz — Twoje dane zostały zachowane.";
  }
  if (message) return message;
  if (type || code) return `${type || "error"}${code ? ` (${code})` : ""}`;
  return fallback;
}

/**
 * Harmonogram ponowień przy 409/conflict. Exponential backoff zamiast stałego
 * 2500 ms × 4 = 10 s spinner w najgorszym razie. Teraz pierwszy retry już po
 * 500 ms (typowy czas domknięcia poprzedniego workflow `completeCart`), a
 * worst case to 500 + 1000 + 2000 + 4000 = 7,5 s z 4 próbami.
 */
const COMPLETE_CART_BACKOFF_MS = [500, 1000, 2000, 4000];

/**
 * `cart.complete` potrafi zwrócić 409 „conflicted with another request…"
 * gdy poprzednia próba wciąż się wykonuje (np. długi cold start Railway).
 * Ponawiamy kilka razy z rosnącym odstępem — każde kolejne wywołanie z tym
 * samym Idempotency-Key zwraca stan z poprzedniej próby, więc to bezpieczne.
 *
 * `opts.delayMs` zostaje dla wstecznej kompatybilności z testami — gdy jest
 * podane, używamy stałego odstępu (ułatwia asercje w unit testach).
 */
export async function completeCart(
  cartId: string,
  opts: { retries?: number; delayMs?: number } = {},
): Promise<CompleteCartResponse> {
  const retries = opts.retries ?? COMPLETE_CART_BACKOFF_MS.length;
  const fixedDelay = opts.delayMs;
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
      /**
       * Retriujemy TYLKO na 409 (prawdziwy conflict z Idempotency-Key) —
       * tam kolejne wołanie zwraca cached state. 500 oznacza że serwerowy
       * workflow utknął; retry wali w ten sam zakleszczony stan, tylko
       * wydłuża UX i nic nie naprawia (objaw sprzed wdrożenia
       * workflow-engine-redis, teraz nie powinien wystąpić).
       */
      const shouldRetry = isConflict && !isCartAlreadyCompletedError(e);
      if (shouldRetry && i < retries) {
        const wait =
          fixedDelay ??
          COMPLETE_CART_BACKOFF_MS[Math.min(i, COMPLETE_CART_BACKOFF_MS.length - 1)];
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("completeCart: przekroczono limit prób");
}
