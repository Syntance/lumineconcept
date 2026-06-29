"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_EVENT, getConsent } from "@/lib/consent/consent";
import { optIn, optOut } from "@/lib/analytics/destinations/posthog";
import {
	grantConsent as grantMetaConsent,
	initMetaPixel,
	revokeConsent as revokeMetaConsent,
} from "@/lib/analytics/destinations/meta";
import { setGA4UserSegment, updateGA4Consent } from "@/lib/analytics/destinations/ga4";
import { captureUtmFromCurrentUrl, track } from "@/lib/analytics/track";
import { ANALYTICS_SEGMENT } from "@/lib/analytics/segment";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import { useScrollToSection } from "@/hooks/useScrollToSection";
import { useTimeOnPage } from "@/hooks/useTimeOnPage";

/**
 * Side-effect-only analytics — NIE owija `{children}`.
 *
 * `useSearchParams()` w komponencie rodzica wymusza CSR całego drzewa potomków
 * (Next.js bailout). Hero i reszta strony muszą zostać w SSR HTML, żeby LCP
 * liczył się od pierwszego paintu, a nie od hydratacji JS (~10 s na mobile).
 */
export function AnalyticsEffects() {
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

		const timeoutId = setTimeout(() => {
			const applyConsent = () => {
				const consent = getConsent();
				const analytics = !!consent?.analytics;
				const marketing = !!consent?.marketing;
				const wasAnalyticsDeclined = prevAnalyticsConsentRef.current === false;

				updateGA4Consent(analytics, marketing);

				if (analytics) {
					setGA4UserSegment(ANALYTICS_SEGMENT);
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
					initMetaPixel();
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

	return null;
}
