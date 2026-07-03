import "server-only";

import { fillDailyRange } from "../raw-hits-utils";
import { analyticsEnv } from "../env";
import { resolvePosthogProjectId } from "./resolve-project";
import type {
	AnalyticsKpi,
	ChannelRow,
	DailyPoint,
	FunnelStep,
	PosthogAnalyticsSlice,
	TopPageRow,
} from "../types";

const FETCH_TIMEOUT_MS = 30_000;
const MAX_PAGE_PATHS = 500;

type DateRange = { from: string; to: string };

/** Ruch panelu admina nie wchodzi w metryki sklepu. */
function storefrontWhere(range: DateRange): string {
	return `timestamp >= toDateTime('${range.from}') AND timestamp < toDateTime('${range.to}') + INTERVAL 1 DAY AND (properties.$pathname IS NULL OR properties.$pathname NOT LIKE '/magazyn%')`;
}

/** Zgodne z rejestrem eventów Syntance / Lumine (`lib/analytics/events/registry.ts`). */
const ECOMMERCE_FUNNEL: Array<{ event: string; label: string }> = [
	{ event: "product_view", label: "Wyświetlenie produktu" },
	{ event: "add_to_cart", label: "Dodanie do koszyka" },
	{ event: "begin_checkout", label: "Rozpoczęcie checkoutu" },
	{ event: "purchase", label: "Zakup" },
];

const CHANNEL_LABELS: Record<string, string> = {
	Direct: "Bezpośredni",
	"Organic Search": "Wyszukiwarka",
	"Organic Social": "Social (organiczny)",
	"Paid Search": "Płatne wyszukiwanie",
	"Paid Social": "Social (płatny)",
	Referral: "Polecenia",
	Email: "E-mail",
};

type PosthogQueryResponse = {
	results?: unknown;
	columns?: string[];
};

function translateChannel(raw: string): string {
	if (raw === "$direct" || raw === "") return "Bezpośredni";
	return CHANNEL_LABELS[raw] ?? raw;
}

function toPercent(part: number, total: number): number {
	if (total <= 0) return 0;
	return Math.round((part / total) * 1000) / 10;
}

async function posthogQuery(
	projectId: string,
	body: Record<string, unknown>,
): Promise<PosthogQueryResponse> {
	const apiKey = analyticsEnv.posthogApiKey;
	if (!apiKey) {
		throw new Error("Brak konfiguracji PostHog.");
	}

	const response = await fetch(`${analyticsEnv.posthogHost}/api/projects/${projectId}/query/`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`PostHog API ${response.status}: ${text.slice(0, 240)}`);
	}

	return (await response.json()) as PosthogQueryResponse;
}

function parseHogqlCount(response: PosthogQueryResponse): number {
	const results = response.results;
	if (!Array.isArray(results) || results.length === 0) return 0;
	const row = results[0];
	if (!Array.isArray(row)) return 0;
	const value = row[0];
	if (typeof value === "number") return value;
	if (typeof value === "string") return Number(value) || 0;
	return 0;
}

function parseHogqlDailySeries(response: PosthogQueryResponse): DailyPoint[] {
	const results = response.results;
	if (!Array.isArray(results)) return [];

	return results
		.filter((row): row is [string, number] => Array.isArray(row) && row.length >= 2)
		.map(([date, value]) => {
			const iso = String(date).slice(0, 10);
			return {
				date: iso,
				label: new Date(`${iso}T12:00:00`).toLocaleDateString("pl-PL", {
					day: "numeric",
					month: "short",
				}),
				value: typeof value === "number" ? value : Number(value) || 0,
			};
		});
}

function parseChannelRows(response: PosthogQueryResponse): ChannelRow[] {
	const results = response.results;
	if (!Array.isArray(results)) return [];

	const rows = results
		.filter((row): row is [string, number] => Array.isArray(row) && row.length >= 2)
		.map(([channel, sessions]) => ({
			channel: translateChannel(String(channel)),
			sessions: typeof sessions === "number" ? sessions : Number(sessions) || 0,
		}))
		.filter((row) => row.sessions > 0);

	const total = rows.reduce((sum, row) => sum + row.sessions, 0);
	return rows.map((row) => ({
		...row,
		share: toPercent(row.sessions, total),
	}));
}

function parseTopPageRows(response: PosthogQueryResponse): TopPageRow[] {
	const results = response.results;
	if (!Array.isArray(results)) return [];

	const rows = results
		.filter((row): row is [string, number] => Array.isArray(row) && row.length >= 2)
		.map(([path, views]) => ({
			path: String(path) || "/",
			views: typeof views === "number" ? views : Number(views) || 0,
		}))
		.filter((row) => row.views > 0);

	const total = rows.reduce((sum, row) => sum + row.views, 0);
	return rows.map((row) => ({
		...row,
		share: toPercent(row.views, total),
	}));
}

function buildKpi(metrics: {
	sessions: number;
	users: number;
	pageviews: number;
	purchases: number;
	revenueMinor: number;
}): AnalyticsKpi {
	const conversionRate =
		metrics.sessions > 0
			? Math.round((metrics.purchases / metrics.sessions) * 10000) / 100
			: null;
	return {
		sessions: metrics.sessions,
		users: metrics.users,
		pageviews: metrics.pageviews,
		purchases: metrics.purchases,
		revenueMinor: metrics.revenueMinor,
		conversionRate,
	};
}

const POSTHOG_DISCONNECTED_REASON =
	"Brak klucza PostHog. Panel próbuje: POSTHOG_PERSONAL_API_KEY → POSTHOG_API_KEY → NEXT_PUBLIC_POSTHOG_KEY.";

export async function fetchPosthogAnalytics(range: DateRange): Promise<PosthogAnalyticsSlice> {
	if (!analyticsEnv.posthogConfigured) {
		return {
			status: "disconnected",
			reason: POSTHOG_DISCONNECTED_REASON,
		};
	}

	const projectId = await resolvePosthogProjectId();
	if (!projectId) {
		return {
			status: "disconnected",
			reason:
				"Nie udało się ustalić POSTHOG_PROJECT_ID. Ustaw ID ręcznie lub dodaj POSTHOG_PERSONAL_API_KEY (project key phc_ zwykle nie ma dostępu do Query API).",
		};
	}

	try {
		const where = storefrontWhere(range);

		const [
			sessionsResponse,
			usersResponse,
			pageviewsResponse,
			purchasesResponse,
			revenueResponse,
			trafficResponse,
			channelsResponse,
			pagesResponse,
		] = await Promise.all([
			posthogQuery(projectId, {
				query: {
					kind: "HogQLQuery",
					query: `SELECT uniq(properties.$session_id) AS sessions FROM events WHERE ${where}`,
				},
			}),
			posthogQuery(projectId, {
				query: {
					kind: "HogQLQuery",
					query: `SELECT uniq(person_id) AS users FROM events WHERE ${where}`,
				},
			}),
			posthogQuery(projectId, {
				query: {
					kind: "HogQLQuery",
					query: `SELECT count() AS pageviews FROM events WHERE event = '$pageview' AND ${where}`,
				},
			}),
			posthogQuery(projectId, {
				query: {
					kind: "HogQLQuery",
					query: `SELECT count() AS purchases FROM events WHERE event = 'purchase' AND ${where}`,
				},
			}),
			posthogQuery(projectId, {
				query: {
					kind: "HogQLQuery",
					query: `SELECT sum(toFloat(coalesce(properties.value, properties['$value']))) AS revenue FROM events WHERE event = 'purchase' AND ${where}`,
				},
			}),
			posthogQuery(projectId, {
				query: {
					kind: "HogQLQuery",
					query: `SELECT toDate(timestamp) AS day, uniq(person_id) AS users FROM events WHERE ${where} GROUP BY day ORDER BY day`,
				},
			}),
			posthogQuery(projectId, {
				query: {
					kind: "HogQLQuery",
					query: `SELECT ifNull(nullIf(properties.$channel_type, ''), 'Direct') AS channel, uniq(properties.$session_id) AS sessions FROM events WHERE ${where} GROUP BY channel ORDER BY sessions DESC LIMIT 12`,
				},
			}),
			posthogQuery(projectId, {
				query: {
					kind: "HogQLQuery",
					query: `SELECT properties.$pathname AS path, count() AS views FROM events WHERE event = '$pageview' AND properties.$pathname IS NOT NULL AND properties.$pathname NOT LIKE '/magazyn%' AND ${where} GROUP BY path ORDER BY views DESC LIMIT ${MAX_PAGE_PATHS}`,
				},
			}),
		]);

		const funnelCounts = await Promise.all(
			ECOMMERCE_FUNNEL.map(async ({ event }) => {
				const response = await posthogQuery(projectId, {
					query: {
						kind: "HogQLQuery",
						query: `SELECT count() AS c FROM events WHERE event = '${event}' AND ${where}`,
					},
				});
				return parseHogqlCount(response);
			}),
		);

		const sessions = parseHogqlCount(sessionsResponse);
		const users = parseHogqlCount(usersResponse);
		const pageviews = parseHogqlCount(pageviewsResponse);
		const purchases = parseHogqlCount(purchasesResponse);
		const revenueRaw = parseHogqlCount(revenueResponse);
		const trafficRaw = parseHogqlDailySeries(trafficResponse);
		let channels = parseChannelRows(channelsResponse);
		const topPages = parseTopPageRows(pagesResponse);

		if (channels.length === 0) {
			const fallbackChannels = await posthogQuery(projectId, {
				query: {
					kind: "HogQLQuery",
					query: `SELECT multiIf(properties.$referring_domain = '' OR properties.$referring_domain IS NULL, 'Direct', properties.$referring_domain = '$direct', 'Direct', properties.$referring_domain) AS channel, uniq(properties.$session_id) AS sessions FROM events WHERE ${where} GROUP BY channel ORDER BY sessions DESC LIMIT 12`,
				},
			});
			channels = parseChannelRows(fallbackChannels);
		}

		const traffic = fillDailyRange(
			range.from,
			range.to,
			trafficRaw.map((p) => ({ date: p.date, hits: p.value })),
		).map((p) => ({ date: p.date, label: p.label, value: p.hits }));

		const topFunnel = funnelCounts[0] ?? 0;
		const funnel: FunnelStep[] = ECOMMERCE_FUNNEL.map(({ event, label }, index) => {
			const count = funnelCounts[index] ?? 0;
			return {
				event,
				label,
				count,
				rateFromTop: topFunnel > 0 ? Math.round((count / topFunnel) * 1000) / 10 : 0,
			};
		});

		return {
			status: "connected",
			label: `PostHog · projekt ${projectId}`,
			kpi: buildKpi({
				sessions,
				users,
				pageviews,
				purchases,
				revenueMinor: Math.round(revenueRaw * 100),
			}),
			traffic,
			channels,
			topPages,
			funnel,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : "Nieznany błąd PostHog";
		return { status: "error", reason: message };
	}
}
