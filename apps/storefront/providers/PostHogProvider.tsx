"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, optInPostHog, optOutPostHog } from "@/lib/analytics/posthog";
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

      if (analytics) {
        optInPostHog();
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
