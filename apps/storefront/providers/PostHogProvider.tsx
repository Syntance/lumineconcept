"use client";

/**
 * Globalna otoczka analityki — Notion "User flows i analityka" + "Analityka i konwersje".
 *
 * Co robi:
 *  1. Inicjalizuje PostHog (lazy) i Meta Pixel po wyrażeniu zgody.
 *  2. Zbiera UTM-y first-touch z URL i wysyła `page_view` (snake_case) zgodnie
 *     z konwencją Notion (sekcja 1️⃣ — eventy core).
 *  3. Mountuje globalne trackery: `scroll_depth`, `scroll_to_section`, `time_on_page`.
 *  4. Synchronizuje zgody Pixela (`fbq('consent', 'grant'|'revoke')`).
 *  5. Łapie `?ref=` → `referral_code_used`.
 */
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  capturePostHogEvent,
  initPostHog,
  optInPostHog,
  optOutPostHog,
} from "@/lib/analytics/posthog";
import {
  grantMetaConsent,
  initMetaPixel,
  revokeMetaConsent,
} from "@/lib/analytics/meta-pixel";
import {
  trackPageView,
  trackPixelPageView,
  trackReferralCodeUsed,
} from "@/lib/analytics/events";
import { captureUtmFromCurrentUrl } from "@/lib/analytics/page-context";
import { CONSENT_EVENT, getConsent } from "@/lib/consent/consent";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import { useScrollToSection } from "@/hooks/useScrollToSection";
import { useTimeOnPage } from "@/hooks/useTimeOnPage";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevAnalyticsConsentRef = useRef<boolean | undefined>(undefined);
  const prevMarketingConsentRef = useRef<boolean | undefined>(undefined);
  const lastReferralRef = useRef<string | null>(null);

  // Globalne trackery (Notion: scroll_depth + scroll_to_section + time_on_page).
  // Reset przy zmianie ścieżki wewnątrz hooków.
  const safePath = pathname ?? "/";
  useScrollDepth(safePath);
  useScrollToSection(safePath);
  useTimeOnPage(safePath);

  // Inicjalizacja + reakcja na zmianę zgody.
  // Opóźniona o 5s po mount, żeby nie blokować LCP (mobile 4G).
  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    // Czekamy ~5s (po LCP) zanim zainicjalizujemy PostHog
    const timeoutId = setTimeout(() => {
      initPostHog();

      const applyConsent = () => {
        const consent = getConsent();
        const analytics = !!consent?.analytics;
        const marketing = !!consent?.marketing;
        const wasAnalyticsDeclined = prevAnalyticsConsentRef.current === false;

        if (analytics) {
          optInPostHog();
          // Po pierwszym "Akceptuj" emitujemy page_view, bo wcześniejszy hit
          // został zignorowany przez opt-out PostHoga.
          if (wasAnalyticsDeclined) {
            captureUtmFromCurrentUrl();
            trackPageView({
              url: `${window.location.pathname}${window.location.search}`,
              title: document.title,
            });
            // PostHog UI funnels → zostawiamy też klasyczny $pageview.
            capturePostHogEvent("$pageview", {
              $current_url: `${window.location.pathname}${window.location.search}`,
              $title: document.title,
            });
          }
        } else {
          optOutPostHog();
        }

        if (marketing) {
          initMetaPixel();
          grantMetaConsent();
          if (prevMarketingConsentRef.current === false) {
            trackPixelPageView();
          }
        } else {
          revokeMetaConsent();
        }

        prevAnalyticsConsentRef.current = analytics;
        prevMarketingConsentRef.current = marketing;
      };

      applyConsent();
      window.addEventListener(CONSENT_EVENT, applyConsent);
      
      cleanupFn = () => {
        window.removeEventListener(CONSENT_EVENT, applyConsent);
      };
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      cleanupFn?.();
    };
  }, []);

  // Page view + UTM capture przy każdej zmianie URL.
  useEffect(() => {
    if (!pathname) return;
    captureUtmFromCurrentUrl();

    const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    trackPageView({ url, title: typeof document !== "undefined" ? document.title : "" });
    // PostHog Web Analytics potrzebuje też $pageview do swoich wbudowanych
    // dashboardów (Bounce rate / Sessions per source). Mamy obie wersje.
    capturePostHogEvent("$pageview", { $current_url: url, $title: typeof document !== "undefined" ? document.title : "" });
    trackPixelPageView();

    // referral code (`?ref=...`) — odpalamy raz per kod w sesji.
    const ref = searchParams?.get("ref")?.trim();
    if (ref && ref !== lastReferralRef.current) {
      lastReferralRef.current = ref;
      trackReferralCodeUsed(ref);
      try {
        localStorage.setItem("lumine_referral", ref);
      } catch {
        /* tryb prywatny */
      }
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
