"use client";

import { track as trackEvent } from "./track";
import * as posthog from "./destinations/posthog";
import type { AnalyticsEventMap, AnalyticsEventName } from "./events/registry";
import { ANALYTICS_SEGMENT } from "./segment";

export type IdentifySource =
  | "form_logo3d"
  | "form_salony"
  | "form_kontakt"
  | "checkout"
  | "lead_magnet"
  | "newsletter";

export function identifyLead(args: {
  email: string;
  name?: string;
  source: IdentifySource;
}): void {
  const trimmed = args.email.trim().toLowerCase();
  if (!trimmed.includes("@")) return;
  posthog.identify(trimmed, {
    email: trimmed,
    name: args.name?.trim() || undefined,
    segment: ANALYTICS_SEGMENT,
    source: args.source,
  });
}

export function markPurchaseCustomer(args: {
  email?: string;
  order_id: string;
  value: number;
}): void {
  if (args.email) {
    const trimmed = args.email.trim().toLowerCase();
    if (trimmed.includes("@")) {
      posthog.identify(trimmed, {
        email: trimmed,
        segment: ANALYTICS_SEGMENT,
        source: "checkout",
      });
    }
  }
  posthog.setUserProperties({
    first_order_id: args.order_id,
    total_spent: args.value,
    orders_count: 1,
    segment: ANALYTICS_SEGMENT,
  });
}

export function useAnalytics() {
  return {
    track<E extends AnalyticsEventName>(
      name: E,
      payload: AnalyticsEventMap[E],
    ): void {
      trackEvent(name, payload);
    },
    identify(id: string, traits?: Record<string, unknown>): void {
      posthog.identify(id, traits);
    },
    identifyLead,
    markPurchaseCustomer,
  };
}

export type { FormName } from "./events/registry";
