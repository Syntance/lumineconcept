/**
 * PostHog ładowany leniwie — `posthog-js` to ~60kB gzip i strzela w bundle
 * nawet jeśli user nie zgodzi się na analitykę. Ładujemy go dopiero przy
 * pierwszym wywołaniu `initPostHog` (po zgodzie lub pierwszym evencie).
 *
 * Autocapture jest wyłączony — zamieniał każdy klik na event, co zaśmiecało
 * dashboardy i zwiększało rachunek. Używamy tylko jawnych `capture(...)`.
 */
import type { PostHog } from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
/** Ingest EU Cloud — dashboard jest na eu.posthog.com, SDK musi wysyłać na eu.i.posthog.com */
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com";

let posthogInstance: PostHog | null = null;
let initPromise: Promise<PostHog | null> | null = null;

async function ensurePostHog(): Promise<PostHog | null> {
  if (typeof window === "undefined") return null;
  if (!POSTHOG_KEY) return null;
  if (posthogInstance) return posthogInstance;
  if (initPromise) return initPromise;

  initPromise = import("posthog-js").then((mod) => {
    const ph = mod.default;
    ph.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      autocapture: false,
      opt_out_capturing_by_default: true,
    });
    posthogInstance = ph;
    return ph;
  });

  return initPromise;
}

export function initPostHog() {
  /**
   * Nie czekamy na promise — wywołujący nie potrzebuje instancji,
   * kolejne `capture(...)` same ją podniosą.
   */
  void ensurePostHog();
}

export function optInPostHog() {
  void ensurePostHog().then((ph) => ph?.opt_in_capturing());
}

export function optOutPostHog() {
  void ensurePostHog().then((ph) => ph?.opt_out_capturing());
}

export function capturePostHogEvent(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  void ensurePostHog().then((ph) => ph?.capture(eventName, properties));
}

export function identifyUser(
  distinctId: string,
  properties?: Record<string, unknown>,
) {
  void ensurePostHog().then((ph) => ph?.identify(distinctId, properties));
}

export function resetPostHog() {
  void ensurePostHog().then((ph) => ph?.reset());
}
