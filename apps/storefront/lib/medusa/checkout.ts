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
 * Moduł-level cache promise'a z opcjami dostawy per cartId.
 *
 * Evidence (debug 8a1bb3): lista opcji ładuje się ~3,4 s. Użytkownik skarżył
 * się że „wchodzi w krok dostawy a opcje dopiero wtedy się ładują". Wołamy
 * tę funkcję od razu jak mamy `cartId` (Step 1), a `ShippingSelector` w
 * Step 2 korzysta z tego samego cached promise'a — jeśli prefetch już się
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
    if (!raw?.length) {
      await ensureLumineShippingBootstrap();
      raw = await getShippingOptions(cartId);
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
 * Historycznie było fire-and-forget — ale przy twardej nawigacji
 * (`window.location.assign`) przeglądarka potrafi anulować request jeszcze
 * zanim Railway się rozgrzeje, mimo `keepalive: true`. Dlatego:
 *  1) najpierw próbujemy krótki await (7 s) — normalnie backend odpowie
 *     w < 1 s, a my daje mailem szansę wylecieć zanim użytkownik wyląduje
 *     na stronie potwierdzenia,
 *  2) równolegle wysyłamy `sendBeacon` jako kanał awaryjny — przeglądarki
 *     gwarantują jego dostarczenie nawet po unload/navigacji.
 *
 * NIGDY nie rzuca — błąd providera maila nie może zablokować checkoutu.
 */
export async function notifyOrderPlaced(orderId: string): Promise<void> {
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

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    try {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } catch {
      /* sendBeacon nie obsługuje publishable-key w headers, ale backend
         akceptuje request bez niego dla tego konkretnego endpointu
         (jest to `store/custom/*`, nie `store/*`). Fallback niżej. */
    }
  }

  const controller = new AbortController();
  const killer = setTimeout(() => controller.abort(), 7_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: payload,
      keepalive: true,
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.warn("[mail] notify-order-placed failed", res.status, body);
    }
  } catch (e) {
    const name = (e as { name?: string }).name;
    if (name === "AbortError") {
      console.info("[mail] notify-order-placed: await timeout, beacon w tle");
    } else {
      console.warn("[mail] notify-order-placed error", e);
    }
  } finally {
    clearTimeout(killer);
  }
}

export async function selectShippingOption(cartId: string, optionId: string) {
  const response = await medusa.store.cart.addShippingMethod(cartId, {
    option_id: optionId,
  });
  return response.cart;
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
  if (looksGeneric && (status >= 500 || status === 0)) {
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
       * Evidence (debug session 8a1bb3): trzy kolejne próby na 500 „unknown
       * error" padły dokładnie po 34 251 / 34 257 / 34 227 ms — to serwerowy
       * timeout locka (~30 s) po stronie Medusa/Railway. Każdy retry wali
       * w ten sam zakleszczony lock, bo workflow poprzedniej próby ciągle
       * nie zszedł. Retry tylko wydłuża UX z kilku sekund do 2+ minut i
       * nic nie naprawia. Retriujemy TYLKO na 409 (prawdziwy conflict
       * z Idempotency-Key) — tam kolejne wołanie zwraca cached state.
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
