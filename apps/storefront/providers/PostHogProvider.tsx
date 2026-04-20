"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { capturePostHogEvent, initPostHog, optInPostHog, optOutPostHog } from "@/lib/analytics/posthog";
import { initMetaPixel } from "@/lib/analytics/meta-pixel";
import { trackMetaPageViewOnly, trackPageView } from "@/lib/analytics/events";
import { CONSENT_EVENT, getConsent } from "@/lib/consent/consent";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevAnalyticsConsentRef = useRef<boolean | undefined>(undefined);
  const prevMarketingConsentRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    initPostHog();

    const applyConsent = () => {
      const consent = getConsent();
      const analytics = !!consent?.analytics;
      const marketing = !!consent?.marketing;
      const wasAnalyticsDeclined = prevAnalyticsConsentRef.current === false;

      if (analytics) {
        optInPostHog();
        /**
         * Pierwszy useEffect z trackPageView odpala się przy montowaniu, gdy opt_out jest aktywne —
         * PostHog nie zapisuje $pageview. Po kliknięciu „Akceptuj” ścieżka się nie zmienia,
         * więc trzeba wysłać $pageview ręcznie.
         */
        if (wasAnalyticsDeclined) {
          const u = `${window.location.pathname}${window.location.search}`;
          capturePostHogEvent("$pageview", {
            $current_url: u,
            $title: document.title,
          });
        }
      } else {
        optOutPostHog();
      }

      if (marketing) {
        initMetaPixel();
        // Zgoda udzielona później (wcześniej false): jeden PageView dla bieżącego URL po init pixela.
        if (prevMarketingConsentRef.current === false) {
          trackMetaPageViewOnly();
        }
      }

      prevAnalyticsConsentRef.current = analytics;
      prevMarketingConsentRef.current = marketing;
    };

    applyConsent();
    window.addEventListener(CONSENT_EVENT, applyConsent);

    return () => {
      window.removeEventListener(CONSENT_EVENT, applyConsent);
    };
  }, []);

  useEffect(() => {
    if (pathname) {
      const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
      trackPageView(url, document.title);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
