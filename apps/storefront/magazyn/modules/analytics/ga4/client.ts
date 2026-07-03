import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { fillDailyRange } from "../raw-hits-utils";
import { analyticsEnv } from "../env";
import type {
	AnalyticsKpi,
	ChannelRow,
	DailyPoint,
	Ga4AnalyticsSlice,
	TopPageRow,
} from "../types";

const FETCH_TIMEOUT_MS = 30_000;
const MAX_PAGE_PATHS = 500;

const GA4_CHANNEL_LABELS: Record<string, string> = {
	Direct: "Bezpośredni",
	"Organic Search": "Wyszukiwarka (organic)",
	"Paid Search": "Wyszukiwarka (płatne)",
	"Organic Social": "Social (organic)",
	"Paid Social": "Social (płatne)",
	Referral: "Polecenia",
	Email: "E-mail",
	Unassigned: "Nieprzypisane",
	Display: "Display",
	"Cross-network": "Cross-network",
	"Organic Video": "Wideo (organic)",
	"Paid Video": "Wideo (płatne)",
	"Organic Shopping": "Shopping (organic)",
	"Paid Shopping": "Shopping (płatne)",
	SMS: "SMS",
	Affiliates: "Afiliacja",
	Audio: "Audio",
};

type DateRange = { from: string; to: string };

function ga4DateRange(range: DateRange): { startDate: string; endDate: string } {
	return { startDate: range.from, endDate: range.to };
}

function formatGa4Date(raw: string): { date: string; label: string } {
	if (raw.length !== 8) return { date: raw, label: raw };
	const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
	const label = new Date(`${iso}T12:00:00`).toLocaleDateString("pl-PL", {
		day: "numeric",
		month: "short",
	});
	return { date: iso, label };
}

function toPercent(part: number, total: number): number {
	if (total <= 0) return 0;
	return Math.round((part / total) * 1000) / 10;
}

function translateGa4Channel(raw: string): string {
	return GA4_CHANNEL_LABELS[raw] ?? raw;
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

function formatGa4Error(error: unknown): string {
	const message = error instanceof Error ? error.message : "Nieznany błąd GA4";
	if (message.includes("analyticsdata.googleapis.com") && message.includes("disabled")) {
		return "Włącz Google Analytics Data API w Google Cloud (projekt lumineconcept), poczekaj 2–5 min i odśwież panel.";
	}
	if (
		message.includes("PERMISSION_DENIED") ||
		message.includes("User does not have sufficient permissions")
	) {
		return "Dodaj service account ga4-analytics-panel@lumineconcept.iam.gserviceaccount.com jako Viewer w GA4 (Admin → Dostęp do konta/usługi).";
	}
	return message;
}

function parseChannelReport(
	rows: Array<{
		dimensionValues?: Array<{ value?: string | null } | null> | null;
		metricValues?: Array<{ value?: string | null } | null> | null;
	}> | null | undefined,
	translate: (raw: string) => string,
): ChannelRow[] {
	const parsed =
		rows?.map((row) => {
			const sessionsCount = Number(row.metricValues?.[0]?.value ?? 0);
			return {
				channel: translate(row.dimensionValues?.[0]?.value ?? "—"),
				sessions: sessionsCount,
			};
		}) ?? [];

	const filtered = parsed.filter((row) => row.sessions > 0);
	const total = filtered.reduce((sum, row) => sum + row.sessions, 0);
	return filtered.map((row) => ({
		...row,
		share: toPercent(row.sessions, total),
	}));
}

export async function fetchGa4Analytics(range: DateRange): Promise<Ga4AnalyticsSlice> {
	if (!analyticsEnv.ga4Configured) {
		const measurementHint = analyticsEnv.ga4MeasurementId
			? ` (storefront ma ${analyticsEnv.ga4MeasurementId} — to nie wystarczy do Data API)`
			: "";
		return {
			status: "disconnected",
			reason: `Uzupełnij GA4_PROPERTY_ID i GA4_SERVICE_ACCOUNT_JSON${measurementHint}.`,
		};
	}

	const propertyId = analyticsEnv.ga4PropertyId;
	const credentials = analyticsEnv.ga4Credentials;
	if (!propertyId || !credentials) {
		return { status: "disconnected", reason: "Brak konfiguracji GA4." };
	}

	try {
		const client = new BetaAnalyticsDataClient({ credentials });
		const property = `properties/${propertyId}`;
		const dateRanges = [ga4DateRange(range)];

		const [baseOverviewReport, purchaseReport, trafficReport, channelsReport, campaignsReport, pagesReport] =
			await Promise.all([
				client.runReport(
					{
						property,
						dateRanges,
						metrics: [
							{ name: "sessions" },
							{ name: "activeUsers" },
							{ name: "screenPageViews" },
							{ name: "purchaseRevenue" },
						],
					},
					{ timeout: FETCH_TIMEOUT_MS },
				),
				client.runReport(
					{
						property,
						dateRanges,
						metrics: [{ name: "eventCount" }],
						dimensionFilter: {
							filter: {
								fieldName: "eventName",
								stringFilter: { matchType: "EXACT", value: "purchase" },
							},
						},
					},
					{ timeout: FETCH_TIMEOUT_MS },
				),
				client.runReport(
					{
						property,
						dateRanges,
						dimensions: [{ name: "date" }],
						metrics: [{ name: "activeUsers" }],
						orderBys: [{ dimension: { dimensionName: "date" } }],
					},
					{ timeout: FETCH_TIMEOUT_MS },
				),
				client.runReport(
					{
						property,
						dateRanges,
						dimensions: [{ name: "sessionDefaultChannelGroup" }],
						metrics: [{ name: "sessions" }],
						orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
						limit: 12,
					},
					{ timeout: FETCH_TIMEOUT_MS },
				),
				client.runReport(
					{
						property,
						dateRanges,
						dimensions: [{ name: "sessionCampaignName" }],
						metrics: [{ name: "sessions" }],
						orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
						limit: 15,
					},
					{ timeout: FETCH_TIMEOUT_MS },
				),
				client.runReport(
					{
						property,
						dateRanges,
						dimensions: [{ name: "pagePath" }],
						metrics: [{ name: "screenPageViews" }],
						orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
						limit: MAX_PAGE_PATHS,
					},
					{ timeout: FETCH_TIMEOUT_MS },
				),
			]);

		const baseRow = baseOverviewReport[0]?.rows?.[0];
		const purchaseRow = purchaseReport[0]?.rows?.[0];

		const sessions = Number(baseRow?.metricValues?.[0]?.value ?? 0);
		const users = Number(baseRow?.metricValues?.[1]?.value ?? 0);
		const pageviews = Number(baseRow?.metricValues?.[2]?.value ?? 0);
		const revenuePln = Number(baseRow?.metricValues?.[3]?.value ?? 0);
		const purchases = Number(purchaseRow?.metricValues?.[0]?.value ?? 0);

		const trafficRaw: DailyPoint[] =
			trafficReport[0]?.rows?.map((row) => {
				const rawDate = row.dimensionValues?.[0]?.value ?? "";
				const { date, label } = formatGa4Date(rawDate);
				return {
					date,
					label,
					value: Number(row.metricValues?.[0]?.value ?? 0),
				};
			}) ?? [];

		const traffic = fillDailyRange(
			range.from,
			range.to,
			trafficRaw.map((p) => ({ date: p.date, hits: p.value })),
		).map((p) => ({ date: p.date, label: p.label, value: p.hits }));

		const channels = parseChannelReport(channelsReport[0]?.rows, translateGa4Channel);

		const campaigns = parseChannelReport(
			campaignsReport[0]?.rows,
			(raw) => raw,
		).filter((row) => {
			const lower = row.channel.toLowerCase();
			return lower !== "(not set)" && lower !== "(none)" && lower !== "not set" && row.channel.trim() !== "";
		});

		const pageTotal =
			pagesReport[0]?.rows?.reduce(
				(sum, row) => sum + Number(row.metricValues?.[0]?.value ?? 0),
				0,
			) ?? 0;

		const topPages: TopPageRow[] =
			pagesReport[0]?.rows?.map((row) => {
				const views = Number(row.metricValues?.[0]?.value ?? 0);
				return {
					path: row.dimensionValues?.[0]?.value ?? "/",
					views,
					share: toPercent(views, pageTotal),
				};
			}) ?? [];

		return {
			status: "connected",
			label: `GA4 · ${propertyId}`,
			kpi: buildKpi({
				sessions,
				users,
				pageviews,
				purchases,
				revenueMinor: Math.round(revenuePln * 100),
			}),
			traffic,
			channels,
			campaigns,
			topPages,
		};
	} catch (error) {
		return { status: "error", reason: formatGa4Error(error) };
	}
}
