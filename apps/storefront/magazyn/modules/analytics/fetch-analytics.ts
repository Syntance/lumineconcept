import "server-only";

import { unstable_cache } from "next/cache";
import { analyticsEnv } from "./env";
import { fetchGa4Analytics } from "./ga4/client";
import { fetchPosthogAnalytics } from "./posthog/client";
import type { AnalyticsSourceState, Ga4AnalyticsSlice, PosthogAnalyticsSlice, AnalyticsDashboardData } from "./types";

const CACHE_SKIP_MARKER = "__ANALYTICS_CACHE_SKIP__";

/**
 * Cache'uje TYLKO odpowiedzi "connected" (900s). Disconnected/error nigdy nie
 * trafiają do Next data cache — inaczej chwilowa awaria PostHog/GA4 (np. 503)
 * zostaje zamrożona na 15 min i panel pokazuje stary błąd długo po tym, jak
 * źródło już wróciło do normy.
 *
 * Next `unstable_cache` nie cache'uje rzuconych wyjątków — rzucamy dla
 * nie-connected, żeby wymusić pominięcie zapisu do cache.
 */
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
	rangeDays: number,
): Promise<AnalyticsDashboardData> {
	if (!analyticsEnv.panelEnabled) {
		return {
			fetchedAt: new Date().toISOString(),
			rangeDays,
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

	const [ga4, posthog] = await Promise.all([
		cachedOrFresh<Ga4AnalyticsSlice>(["magazyn-analytics-ga4", String(rangeDays)], () =>
			fetchGa4Analytics(rangeDays),
		),
		cachedOrFresh<PosthogAnalyticsSlice>(["magazyn-analytics-posthog", String(rangeDays)], () =>
			fetchPosthogAnalytics(rangeDays),
		),
	]);

	return {
		fetchedAt: new Date().toISOString(),
		rangeDays,
		ga4,
		posthog,
	};
}

/** Pobiera dane GA4 + PostHog. Sukcesy cache 15 min, błędy zawsze świeże (patrz cachedOrFresh). */
export async function fetchAnalyticsDashboard(options?: {
	rangeDays?: number;
}): Promise<AnalyticsDashboardData> {
	const rangeDays = options?.rangeDays ?? 30;
	return fetchAnalyticsDashboardUncached(rangeDays);
}
