import type { PostHog } from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
/** Reverse proxy przez Next.js (`/ingest` → eu.i.posthog.com) — mniej blokad adblockerów. */
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "/ingest";

let posthogInstance: PostHog | null = null;
let initPromise: Promise<PostHog | null> | null = null;

/**
 * Consent state ustawiony PRZED załadowaniem PostHog (np. powracający user).
 * Wartość jest stosowana wewnątrz initPromise — zanim jakikolwiek .then() zewnętrzny
 * (np. capture) wykona się. Dzięki temu capture("page_view") nie trafi na opted-out
 * instancję gdy optIn() zostanie wywołany w tym samym tick-u co capture.
 */
let _pendingConsent: boolean | null = null;

async function ensurePostHog(): Promise<PostHog | null> {
  if (typeof window === "undefined") return null;
  if (!POSTHOG_KEY) return null;
  if (posthogInstance) return posthogInstance;
  if (initPromise) return initPromise;

  initPromise = import("posthog-js").then((mod) => {
    const ph = mod.default;
    ph.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      ui_host: "https://eu.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      autocapture: false,
      person_profiles: "identified_only",
      opt_out_capturing_by_default: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "*",
      },
    });
    // Aplikuj consent ustawiony przed załadowaniem — musi być PRZED return ph,
    // żeby wszystkie zewnętrzne .then() (capture, identify) zastały poprawny stan.
    if (_pendingConsent === true) ph.opt_in_capturing();
    else if (_pendingConsent === false) ph.opt_out_capturing();
    posthogInstance = ph;
    return ph;
  });

  return initPromise;
}

export function initPostHog(): void {
  void ensurePostHog();
}

export function optIn(): void {
  _pendingConsent = true;
  if (posthogInstance) {
    posthogInstance.opt_in_capturing();
  }
  // Jeśli PostHog jeszcze się nie załadował: _pendingConsent zostanie zastosowany
  // wewnątrz initPromise (przed zewnętrznymi .then()).
}

export function optOut(): void {
  _pendingConsent = false;
  if (posthogInstance) {
    posthogInstance.opt_out_capturing();
  }
}

export function capture(
  name: string,
  payload: Record<string, unknown>,
): void {
  void ensurePostHog().then((ph) => ph?.capture(name, payload));
}

export function identify(
  id: string,
  traits?: Record<string, unknown>,
): void {
  void ensurePostHog().then((ph) => ph?.identify(id, traits));
}

export function setUserProperties(properties: Record<string, unknown>): void {
  void ensurePostHog().then((ph) => ph?.people?.set?.(properties));
}

/** set_once — nie nadpisuje wartości przy kolejnych wywołaniach (np. first_order_id). */
export function setUserPropertiesOnce(properties: Record<string, unknown>): void {
  void ensurePostHog().then((ph) => ph?.people?.set_once?.(properties));
}

export function reset(): void {
  void ensurePostHog().then((ph) => ph?.reset());
}

/**
 * distinct_id bieżącej instancji PostHog (synchronicznie, tylko gdy już
 * załadowany). Używane do snapshotu w order.metadata — server-side purchase
 * capture odtwarza ten sam distinct_id, żeby lejek begin_checkout → purchase
 * łączył się w jedną osobę (inaczej server liczy 0% domknięcia).
 */
export function getDistinctId(): string | undefined {
  if (!posthogInstance) return undefined;
  try {
    return posthogInstance.get_distinct_id();
  } catch {
    return undefined;
  }
}

export function getSessionId(): string | undefined {
  if (!posthogInstance) return undefined;
  try {
    return posthogInstance.get_session_id();
  } catch {
    return undefined;
  }
}
