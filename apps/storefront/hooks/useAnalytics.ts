"use client";

import { useCallback } from "react";
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

export function useAnalytics() {
  return {
    trackEvent: useCallback(trackEvent, []),
    trackProductViewed: useCallback(trackProductViewed, []),
    trackAddToCart: useCallback(trackAddToCart, []),
    trackBeginCheckout: useCallback(trackBeginCheckout, []),
    trackPurchase: useCallback(trackPurchase, []),
    trackCtaClick: useCallback(trackCtaClick, []),
    trackFormStart: useCallback(trackFormStart, []),
    trackFormSubmit: useCallback(trackFormSubmit, []),
    trackNewsletterSignup: useCallback(trackNewsletterSignup, []),
  };
}
