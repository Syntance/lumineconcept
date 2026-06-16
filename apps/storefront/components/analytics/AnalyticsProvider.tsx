"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_EVENT, getConsent } from "@/lib/consent/consent";
import { initPostHog, optIn, optOut } from "@/lib/analytics/destinations/posthog";
import {
  grantConsent as grantMetaConsent,
  initMetaPixel,
  revokeConsent as revokeMetaConsent,
} from "@/lib/analytics/destinations/meta";
import { captureUtmFromCurrentUrl, track } from "@/lib/analytics/track";
import { setGA4UserSegment } from "@/lib/analytics/destinations/ga4";
import { ANALYTICS_SEGMENT } from "@/lib/analytics/segment";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import { useScrollToSection } from "@/hooks/useScrollToSection";
import { useTimeOnPage } from "@/hooks/useTimeOnPage";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function updateGoogleConsent(analytics: boolean, marketing: boolean): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: marketing ? "granted" : "denied",
    ad_user_data: marketing ? "granted" : "denied",
    ad_personalization: marketing ? "granted" : "denied",
  });
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevAnalyticsConsentRef = useRef<boolean | undefined>(undefined);
  const prevMarketingConsentRef = useRef<boolean | undefined>(undefined);
  const lastReferralRef = useRef<string | null>(null);

  const safePath = pathname ?? "/";
  useScrollDepth(safePath);
  useScrollToSection(safePath);
  useTimeOnPage(safePath);

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    // Delay 0 — PostHog i Pixel ładują się lazy, nie blokują LCP.
    // Opóźnienie > 0 powoduje utratę eventów powracających userów (opt_out_capturing_by_default).
    const timeoutId = setTimeout(() => {
      initPostHog();
      initMetaPixel();
      // Segment jako GA4 user property — wymiar dla wszystkich eventów.
      setGA4UserSegment(ANALYTICS_SEGMENT);

      const applyConsent = () => {
        const consent = getConsent();
        const analytics = !!consent?.analytics;
        const marketing = !!consent?.marketing;
        const wasAnalyticsDeclined = prevAnalyticsConsentRef.current === false;

        updateGoogleConsent(analytics, marketing);

        if (analytics) {
          optIn();
          if (wasAnalyticsDeclined) {
            captureUtmFromCurrentUrl();
            track("page_view", {
              full_url: `${window.location.pathname}${window.location.search}`,
              title: document.title,
            });
          }
        } else {
          optOut();
        }

        if (marketing) {
          grantMetaConsent();
        } else {
          revokeMetaConsent();
        }

        prevAnalyticsConsentRef.current = analytics;
        prevMarketingConsentRef.current = marketing;
      };

      applyConsent();
      const onConsent = () => applyConsent();
      window.addEventListener(CONSENT_EVENT, onConsent);
      cleanupFn = () => window.removeEventListener(CONSENT_EVENT, onConsent);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      cleanupFn?.();
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    captureUtmFromCurrentUrl();

    const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    track("page_view", {
      page_path: pathname,
      full_url: url,
      title: typeof document !== "undefined" ? document.title : "",
    });

    const ref = searchParams?.get("ref")?.trim();
    if (ref && ref !== lastReferralRef.current) {
      lastReferralRef.current = ref;
      track("referral_code_used", { referral_code: ref });
      try {
        localStorage.setItem("lumine_referral", ref);
      } catch {
        /* private mode */
      }
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
