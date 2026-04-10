"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, optInPostHog, optOutPostHog } from "@/lib/analytics/posthog";
import { initMetaPixel } from "@/lib/analytics/meta-pixel";
import { trackMetaPageViewOnly, trackPageView } from "@/lib/analytics/events";

declare global {
  interface Window {
    CookieYes?: {
      getConsent: () => Record<string, boolean>;
    };
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathnameRef = useRef(pathname);
  const searchParamsRef = useRef(searchParams);
  const prevAnalyticsConsentRef = useRef<boolean | undefined>(undefined);

  pathnameRef.current = pathname;
  searchParamsRef.current = searchParams;

  useEffect(() => {
    initPostHog();

    const checkConsent = () => {
      const consent = window.CookieYes?.getConsent();
      const analytics = !!consent?.analytics;

      if (analytics) {
        optInPostHog();
        initMetaPixel();
        // Pierwsze załadowanie przy zapisanej zgodzie: PageView idzie z efektu pathname.
        // Zgoda udzielona później (wcześniej false): jeden PageView dla bieżącego URL po init pixela.
        if (prevAnalyticsConsentRef.current === false) {
          trackMetaPageViewOnly();
        }
      } else {
        optOutPostHog();
      }

      prevAnalyticsConsentRef.current = analytics;
    };

    checkConsent();
    document.addEventListener("cookieyes_consent_update", checkConsent);

    return () => {
      document.removeEventListener("cookieyes_consent_update", checkConsent);
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
