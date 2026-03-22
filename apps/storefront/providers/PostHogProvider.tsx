"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, optInPostHog, optOutPostHog } from "@/lib/analytics/posthog";
import { trackPageView } from "@/lib/analytics/events";

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

  useEffect(() => {
    initPostHog();

    const checkConsent = () => {
      const consent = window.CookieYes?.getConsent();
      if (consent?.analytics) {
        optInPostHog();
      } else {
        optOutPostHog();
      }
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
