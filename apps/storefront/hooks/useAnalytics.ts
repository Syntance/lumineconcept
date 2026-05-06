"use client";

import {
  trackEvent,
  trackProductViewed,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackCtaClick,
  trackFormStart,
  trackFormSubmit,
  trackNewsletterSignup,
} from "@/lib/analytics/events";

/**
 * Funkcje analityczne to stabilne, importowane referencje — `useCallback`
 * z `[]` był no-opem (i łamał regułę `react-hooks/use-memo` w eslint-plugin-react-hooks
 * 7+, która wymaga inline funkcji). Zwracamy je bezpośrednio.
 */
export function useAnalytics() {
  return {
    trackEvent,
    trackProductViewed,
    trackAddToCart,
    trackBeginCheckout,
    trackPurchase,
    trackCtaClick,
    trackFormStart,
    trackFormSubmit,
    trackNewsletterSignup,
  };
}
