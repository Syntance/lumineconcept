"use client";

/**
 * Skrót do najczęściej używanych funkcji trackujących z `@/lib/analytics/events`.
 * Wszystkie referencje są stabilne (importowane funkcje), więc hook jest no-op poza
 * wygodnym aliasem importów.
 */
import {
  trackCartAdd,
  trackCheckoutStart,
  trackCtaClick,
  trackEmailSignup,
  trackEvent,
  trackFormStart,
  trackFormSubmit,
  trackProductView,
  trackPurchase,
} from "@/lib/analytics/events";

export function useAnalytics() {
  return {
    trackEvent,
    trackProductView,
    trackProductViewed: trackProductView,
    trackCartAdd,
    trackAddToCart: trackCartAdd,
    trackCheckoutStart,
    trackBeginCheckout: trackCheckoutStart,
    trackPurchase,
    trackCtaClick,
    trackFormStart,
    trackFormSubmit,
    trackEmailSignup,
    trackNewsletterSignup: (email: string) =>
      trackEmailSignup({
        source: "newsletter",
        emailDomain: email.split("@")[1],
      }),
  };
}
