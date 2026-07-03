import "server-only";

import { unstable_cache } from "next/cache";
import { analyticsEnv } from "./env";
import { fetchGa4Analytics } from "./ga4/client";
import { fetchPosthogAnalytics } from "./posthog/client";
import type { SalesPeriod } from "./sales-period";
import { salesPeriodToIsoRange } from "./sales-period";
import type { AnalyticsSourceState, Ga4AnalyticsSlice, PosthogAnalyticsSlice, AnalyticsDashboardData } from "./types";

const CACHE_SKIP_MARKER = "__ANALYTICS_CACHE_SKIP__";

async function cachedOrFresh<T extends AnalyticsSourceState>(
	key: string[],
	fetcher: () => Promise<T>,
): Promise<T> {
	let freshResult: T | null = null;

	const cached = unstable_cache(
		async () => {
			const result = await fetcher();
			freshResult = result;
			if (result.status !== "connected") {
				throw new Error(CACHE_SKIP_MARKER);
			}
			return result;
		},
		key,
		{ revalidate: 900 },
	);

	try {
		return await cached();
	} catch {
		return freshResult ?? (await fetcher());
	}
}

async function fetchAnalyticsDashboardUncached(
	period: SalesPeriod,
): Promise<AnalyticsDashboardData> {
	const { from, to } = salesPeriodToIsoRange(period);

	if (!analyticsEnv.panelEnabled) {
		return {
			fetchedAt: new Date().toISOString(),
			rangeFrom: from,
			rangeTo: to,
			ga4: {
				status: "disconnected",
				reason: "Panel analityki wyłączony (FEATURE_ANALYTICS_PANEL=0).",
			},
			posthog: {
				status: "disconnected",
				reason: "Panel analityki wyłączony (FEATURE_ANALYTICS_PANEL=0).",
			},
		};
	}

	const rangeKey = `${from}_${to}`;

	const [ga4, posthog] = await Promise.all([
		cachedOrFresh<Ga4AnalyticsSlice>(["magazyn-analytics-ga4", rangeKey], () =>
			fetchGa4Analytics({ from, to }),
		),
		cachedOrFresh<PosthogAnalyticsSlice>(["magazyn-analytics-posthog", rangeKey], () =>
			fetchPosthogAnalytics({ from, to }),
		),
	]);

	return {
		fetchedAt: new Date().toISOString(),
		rangeFrom: from,
		rangeTo: to,
		ga4,
		posthog,
	};
}

/** Pobiera dane GA4 + PostHog dla wybranego okresu kalendarzowego. Sukcesy cache 15 min. */
export async function fetchAnalyticsDashboard(options: {
	period: SalesPeriod;
}): Promise<AnalyticsDashboardData> {
	return fetchAnalyticsDashboardUncached(options.period);
}
