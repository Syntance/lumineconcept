/**
 * Meta Pixel — minimalna integracja po stronie klienta.
 *
 * Pixel inicjalizowany jest dopiero gdy użytkownik wyrazi zgodę na marketing
 * (PostHogProvider). Domyślnie globalna zgoda jest „revoke” — zapobiega to
 * wysyłce eventów zanim user kliknie „Akceptuję wszystkie”.
 *
 * Konwencje eventów (mapowanie 1:1 z Notion):
 *   `Purchase`             → checkout success
 *   `Lead`                 → wysłany formularz wyceny / kontaktowy (B2B leady)
 *   `InitiateCheckout`     → wejście na /checkout
 *   `AddToCart`            → cart_add
 *   `CompleteRegistration` → email_signup (lead magnet / newsletter)
 *   `ViewContent`          → product_view + landing pages
 *   `Contact`              → mailto / tel / kliknięcie w formularz w calloucie
 *   `Search`               → wyszukiwarka / filtrowanie produktów
 *
 * Implementacja celowo nie nadpisuje globalnego `fbq` jeśli wcześniej zostało
 * zainstalowane przez inny skrypt (np. GTM); używamy istniejącej kolejki.
 */

declare global {
  interface Window {
    fbq: (
      action: string,
      eventOrId: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void;
    _fbq: unknown;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

let pixelInitialized = false;
let consentGranted = false;

export function initMetaPixel() {
  if (typeof window === "undefined" || !PIXEL_ID) return;
  if (pixelInitialized) return;

  if (typeof window.fbq !== "function") {
    /**
     * `fbq` z fbevents.js jest funkcją z dynamicznymi polami (`callMethod`,
     * `queue`, `loaded`, `version`) — bez `any` musielibyśmy budować osobny
     * typ tylko dla tego shimu. Trzymamy lokalny `any` zawężony do tej funkcji.
     */
    const queue: unknown[][] = [];
    type FbqShim = {
      (...args: unknown[]): void;
      callMethod?: (...args: unknown[]) => void;
      queue: unknown[][];
      loaded: boolean;
      version: string;
    };
    const fbq = function (this: unknown, ...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        queue.push(args);
      }
    } as unknown as FbqShim;
    fbq.queue = queue;
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq as unknown as typeof window.fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  // Domyślnie zgoda revoke — `grantMetaConsent()` ustawi grant po decyzji.
  // (`fbq('consent', ...)` wymaga zarejestrowanego pixela, więc init musi być pierwszy.)
  window.fbq("init", PIXEL_ID);
  window.fbq("consent", consentGranted ? "grant" : "revoke");
  pixelInitialized = true;
}

/** Cookie-consent: zgoda na marketing (Meta Pixel + CAPI personal data). */
export function grantMetaConsent() {
  consentGranted = true;
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("consent", "grant");
}

/** Cookie-consent: cofnięcie zgody — Pixel przestaje wysyłać dane osobowe. */
export function revokeMetaConsent() {
  consentGranted = false;
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("consent", "revoke");
}

/**
 * Standardowy event Pixela. `eventId` służy do deduplikacji z CAPI
 * (Notion: "ten sam event_id w browser pixel i CAPI").
 */
export function trackMetaEvent(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string,
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventId) {
    window.fbq("track", eventName, params, { eventID: eventId });
  } else {
    window.fbq("track", eventName, params);
  }
}

export function trackMetaCustomEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("trackCustom", eventName, params);
}
