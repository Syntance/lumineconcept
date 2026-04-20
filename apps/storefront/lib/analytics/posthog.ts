import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
/** Ingest EU Cloud — dashboard jest na eu.posthog.com, SDK musi wysyłać na eu.i.posthog.com */
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com";

let initialized = false;

export function initPostHog() {
  if (typeof window === "undefined" || initialized || !POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    autocapture: true,
    opt_out_capturing_by_default: true,
  });

  initialized = true;
}

export function optInPostHog() {
  if (typeof window === "undefined") return;
  posthog.opt_in_capturing();
}

export function optOutPostHog() {
  if (typeof window === "undefined") return;
  posthog.opt_out_capturing();
}

export function capturePostHogEvent(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  posthog.capture(eventName, properties);
}

export function identifyUser(distinctId: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.identify(distinctId, properties);
}

export function resetPostHog() {
  if (typeof window === "undefined") return;
  posthog.reset();
}

export { posthog };
