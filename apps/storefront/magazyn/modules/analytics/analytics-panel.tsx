"use client";

import { useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";
import { cn } from "@magazyn/core/lib/cn";
import type {
	AnalyticsDashboardData,
	AnalyticsKpi,
	AnalyticsSourceState,
	ChannelRow,
	FunnelStep,
	TopPageRow,
} from "./types";

function getSourceMessage(slice: AnalyticsSourceState): string {
	return slice.status === "connected" ? slice.label : slice.reason;
}

const CHART_STROKE = "oklch(0.58 0.08 55)";

const chartTooltipStyle = {
	background: "var(--card)",
	border: "1px solid var(--border)",
	borderRadius: 10,
	fontSize: 13,
	color: "var(--foreground)",
} as const;

function SourceBadge({
	label,
	status,
	reason,
}: {
	label: string;
	status: "connected" | "disconnected" | "error";
	reason?: string;
}) {
	const connected = status === "connected";
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
				connected
					? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
					: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
			)}
			title={reason}
		>
			{connected ? (
				<CheckCircle2 className="size-3.5" aria-hidden />
			) : (
				<AlertCircle className="size-3.5" aria-hidden />
			)}
			{label}
		</span>
	);
}

function StatCard({
	label,
	value,
	sub,
	source,
}: {
	label: string;
	value: string;
	sub?: string;
	source?: string;
}) {
	return (
		<div className="rounded-xl border border-border bg-card p-5">
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
			<p className="mt-1 font-serif text-2xl tabular-nums text-foreground">{value}</p>
			{source ? <p className="mt-1 text-xs text-muted-foreground">Źródło: {source}</p> : null}
			{sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
		</div>
	);
}

function computeConversionRate(orders: number, sessions: number | null | undefined): number | null {
	if (sessions == null || sessions <= 0) return null;
	return Math.round((orders / sessions) * 10000) / 100;
}

function formatCompare(primary: number | null | undefined, secondary: number | null | undefined, secondaryLabel: string): string | undefined {
	if (secondary == null || primary == null) return undefined;
	if (secondary === primary) return undefined;
	return `${secondaryLabel}: ${secondary.toLocaleString("pl-PL")}`;
}

function KpiGrid({
	posthogKpi,
	ga4Kpi,
	posthogConnected,
	ga4Connected,
	periodLabel,
	storeOrders,
}: {
	posthogKpi: AnalyticsKpi | null;
	ga4Kpi: AnalyticsKpi | null;
	posthogConnected: boolean;
	ga4Connected: boolean;
	periodLabel: string;
	storeOrders?: number;
}) {
	const visitorsKpi = posthogConnected && posthogKpi ? posthogKpi : ga4Connected && ga4Kpi ? ga4Kpi : null;
	if (!visitorsKpi) return null;

	const sessions = visitorsKpi.sessions ?? 0;
	const trackingPurchases = visitorsKpi.purchases ?? 0;
	const conversionRate =
		storeOrders != null ? computeConversionRate(storeOrders, sessions) : visitorsKpi.conversionRate;

	const conversionSub =
		storeOrders != null
			? `${storeOrders.toLocaleString("pl-PL")} zamówień · ${sessions.toLocaleString("pl-PL")} sesji${
					trackingPurchases !== storeOrders
						? ` · ${trackingPurchases.toLocaleString("pl-PL")} w śledzeniu`
						: ""
				}`
			: undefined;

	const visitorSource = posthogConnected ? "PostHog" : "GA4";
	const compareGa4Users = posthogConnected && ga4Connected ? formatCompare(posthogKpi?.users, ga4Kpi?.users, "GA4") : undefined;
	const compareGa4Sessions =
		posthogConnected && ga4Connected ? formatCompare(posthogKpi?.sessions, ga4Kpi?.sessions, "GA4") : undefined;
	const compareGa4Pv =
		posthogConnected && ga4Connected ? formatCompare(posthogKpi?.pageviews, ga4Kpi?.pageviews, "GA4") : undefined;

	return (
		<section className="flex flex-col gap-4">
			<div>
				<h2 className="font-serif text-lg text-foreground">Ruch na stronie ({periodLabel})</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Odwiedziny ze zgody na cookies (PostHog / GA4). Konwersja z zamówień sklepu (Medusa).
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					label="Użytkownicy"
					value={(visitorsKpi.users ?? 0).toLocaleString("pl-PL")}
					source={visitorSource}
					sub={compareGa4Users}
				/>
				<StatCard
					label="Sesje"
					value={sessions.toLocaleString("pl-PL")}
					source={visitorSource}
					sub={compareGa4Sessions}
				/>
				<StatCard
					label="Odsłony"
					value={(visitorsKpi.pageviews ?? 0).toLocaleString("pl-PL")}
					source={visitorSource}
					sub={compareGa4Pv}
				/>
				<StatCard
					label="Konwersja"
					value={conversionRate != null ? `${conversionRate}%` : "—"}
					source="Medusa ÷ sesje PostHog"
					sub={conversionSub}
				/>
			</div>
		</section>
	);
}

function TrafficChart({
	title,
	points,
	sourceLabel,
}: {
	title: string;
	points: Array<{ label: string; value: number }>;
	sourceLabel: string;
}) {
	if (points.length === 0) return null;
	return (
		<article className="rounded-xl border border-border bg-card p-5">
			<h2 className="font-serif text-lg text-foreground">{title}</h2>
			<p className="mt-1 text-xs text-muted-foreground">Źródło: {sourceLabel}</p>
			<div className="mt-4">
				<ResponsiveContainer width="100%" height={220}>
					<AreaChart data={points} margin={{ left: -20 }}>
						<defs>
							<linearGradient id="analytics-traffic-grad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor={CHART_STROKE} stopOpacity={0.3} />
								<stop offset="95%" stopColor={CHART_STROKE} stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
						<XAxis
							dataKey="label"
							tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
							axisLine={false}
							tickLine={false}
						/>
						<YAxis
							tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
							axisLine={false}
							tickLine={false}
						/>
						<Tooltip contentStyle={chartTooltipStyle} />
						<Area
							type="monotone"
							dataKey="value"
							stroke={CHART_STROKE}
							strokeWidth={2}
							fill="url(#analytics-traffic-grad)"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</article>
	);
}

function ChannelsSection({
	channels,
	campaigns,
	sourceLabel,
	fallbackReason,
}: {
	channels: ChannelRow[];
	campaigns?: ChannelRow[];
	sourceLabel: string;
	fallbackReason?: string;
}) {
	if (channels.length === 0 && (!campaigns || campaigns.length === 0)) {
		if (!fallbackReason) return null;
		return (
			<article className="rounded-xl border border-border bg-card p-5">
				<h2 className="font-serif text-lg text-foreground">Skąd przyszli</h2>
				<p className="mt-2 text-sm text-muted-foreground">{fallbackReason}</p>
			</article>
		);
	}

	return (
		<article className="rounded-xl border border-border bg-card p-5">
			<h2 className="font-serif text-lg text-foreground">Skąd przyszli ({sourceLabel})</h2>
			<p className="mt-1 text-xs text-muted-foreground">
				Kanały akwizycji GA4 — wyszukiwarka, social, kampanie płatne, bezpośredni itd.
			</p>
			{channels.length > 0 ? (
				<>
					<div className="mt-4">
						<ResponsiveContainer width="100%" height={Math.max(160, channels.length * 36)}>
							<BarChart data={channels} layout="vertical" margin={{ left: 0, right: 16 }}>
								<XAxis type="number" hide />
								<YAxis
									type="category"
									dataKey="channel"
									width={150}
									tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
									axisLine={false}
									tickLine={false}
								/>
								<Tooltip contentStyle={chartTooltipStyle} />
								<Bar dataKey="sessions" fill={CHART_STROKE} radius={[0, 6, 6, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
					<ul className="mt-3 space-y-1 border-t border-border pt-3">
						{channels.map((row) => (
							<li key={row.channel} className="flex justify-between text-sm">
								<span className="text-foreground">{row.channel}</span>
								<span className="tabular-nums text-muted-foreground">
									{row.sessions.toLocaleString("pl-PL")} sesji · {row.share}%
								</span>
							</li>
						))}
					</ul>
				</>
			) : null}
			{campaigns && campaigns.length > 0 ? (
				<div className={channels.length > 0 ? "mt-5 border-t border-border pt-4" : "mt-4"}>
					<h3 className="text-sm font-medium text-foreground">Kampanie UTM (GA4)</h3>
					<ul className="mt-2 space-y-1">
						{campaigns.map((row) => (
							<li key={row.channel} className="flex justify-between text-sm">
								<span className="min-w-0 truncate font-mono text-foreground">{row.channel}</span>
								<span className="shrink-0 tabular-nums text-muted-foreground">
									{row.sessions.toLocaleString("pl-PL")} sesji · {row.share}%
								</span>
							</li>
						))}
					</ul>
				</div>
			) : null}
		</article>
	);
}

function TopPagesSection({ pages, sourceLabel }: { pages: TopPageRow[]; sourceLabel: string }) {
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return pages;
		return pages.filter((page) => page.path.toLowerCase().includes(q));
	}, [pages, query]);

	if (pages.length === 0) return null;

	return (
		<article className="rounded-xl border border-border bg-card p-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 className="font-serif text-lg text-foreground">Podstrony ({sourceLabel})</h2>
					<p className="mt-1 text-xs text-muted-foreground">
						{pages.length.toLocaleString("pl-PL")} ścieżek w okresie · wymaga zgody na cookies
					</p>
				</div>
				<label className="relative w-full sm:w-56">
					<span className="sr-only">Szukaj podstrony</span>
					<Search
						className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden
					/>
					<input
						type="search"
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
						}}
						placeholder="Szukaj ścieżki…"
						className="h-9 w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
					/>
				</label>
			</div>
			{filtered.length === 0 ? (
				<p className="mt-4 text-sm text-muted-foreground">Brak podstron pasujących do „{query}".</p>
			) : (
				<ol className="mt-4 max-h-[280px] space-y-2 overflow-y-auto pr-1">
					{filtered.map((page, index) => (
						<li key={page.path} className="flex items-center gap-3 text-sm">
							<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
								{index + 1}
							</span>
							<span className="min-w-0 flex-1 truncate font-mono text-foreground" title={page.path}>
								{page.path}
							</span>
							<span className="shrink-0 tabular-nums text-muted-foreground">
								{page.views.toLocaleString("pl-PL")} · {page.share}%
							</span>
						</li>
					))}
				</ol>
			)}
		</article>
	);
}

function FunnelSection({ funnel }: { funnel: FunnelStep[] }) {
	if (funnel.length === 0) return null;
	return (
		<article className="rounded-xl border border-border bg-card p-5">
			<h2 className="font-serif text-lg text-foreground">Lejek zakupowy (PostHog)</h2>
			<p className="mt-1 text-sm text-muted-foreground">
				Ile osób przeszło przez kolejne kroki przed zakupem.
			</p>
			<div className="mt-4 space-y-3">
				{funnel.map((step) => (
					<div key={step.event}>
						<div className="mb-1 flex justify-between text-sm">
							<span className="text-foreground">{step.label}</span>
							<span className="font-medium tabular-nums text-foreground">
								{step.count.toLocaleString("pl-PL")} · {step.rateFromTop}%
							</span>
						</div>
						<div className="h-2 rounded-full bg-muted">
							<div
								className="h-2 rounded-full bg-primary"
								style={{ width: `${Math.min(step.rateFromTop, 100)}%` }}
							/>
						</div>
					</div>
				))}
			</div>
		</article>
	);
}

/** Wykrywa nagły spadek użytkowników dziennych do zera — typowy objaw przerwy w ingest PostHog. */
function hasTrafficDataGap(points: Array<{ value: number }>): boolean {
	const nonZero = points.filter((p) => p.value > 0);
	if (nonZero.length < 3) return false;
	let lastNonZeroIdx = -1;
	for (let i = points.length - 1; i >= 0; i -= 1) {
		if (points[i]?.value !== 0) {
			lastNonZeroIdx = i;
			break;
		}
	}
	if (lastNonZeroIdx < 0 || lastNonZeroIdx >= points.length - 2) return false;
	const tail = points.slice(lastNonZeroIdx + 1);
	return tail.length >= 2 && tail.every((p) => p.value === 0);
}

export type AnalyticsPanelProps = {
	data: AnalyticsDashboardData;
	periodLabel: string;
	storeOrders?: number;
};

export function AnalyticsPanel({ data, periodLabel, storeOrders }: AnalyticsPanelProps) {
	const posthogConnected = data.posthog.status === "connected";
	const ga4Connected = data.ga4.status === "connected";
	const hasAnySource = posthogConnected || ga4Connected;

	const posthogKpi = posthogConnected ? (data.posthog.kpi ?? null) : null;
	const ga4Kpi = ga4Connected ? (data.ga4.kpi ?? null) : null;

	const traffic = posthogConnected
		? (data.posthog.traffic ?? [])
		: ga4Connected
			? (data.ga4.traffic ?? [])
			: [];
	const trafficSource = posthogConnected ? "PostHog" : "GA4";

	const channels = ga4Connected
		? (data.ga4.channels ?? [])
		: posthogConnected
			? (data.posthog.channels ?? [])
			: [];
	const campaigns = ga4Connected ? data.ga4.campaigns : undefined;
	const channelSource = ga4Connected ? "GA4" : posthogConnected ? "PostHog (zapas)" : "";
	const channelFallback =
		!ga4Connected && !posthogConnected
			? undefined
			: !ga4Connected && posthogConnected
				? "GA4 niedostępne — pokazano kanały z PostHog."
				: undefined;

	const topPages = posthogConnected
		? (data.posthog.topPages ?? [])
		: ga4Connected
			? (data.ga4.topPages ?? [])
			: [];
	const pagesSource = posthogConnected ? "PostHog" : "GA4";

	const funnel = posthogConnected ? (data.posthog.funnel ?? []) : [];
	const trafficGap = posthogConnected && hasTrafficDataGap(traffic);

	const ga4Label = data.ga4.status === "connected" ? data.ga4.label : "GA4";
	const posthogLabel = data.posthog.status === "connected" ? data.posthog.label : "PostHog";

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap gap-2">
					<SourceBadge
						label={posthogLabel}
						status={data.posthog.status}
						reason={data.posthog.status !== "connected" ? data.posthog.reason : undefined}
					/>
					<SourceBadge
						label={ga4Label}
						status={data.ga4.status}
						reason={data.ga4.status !== "connected" ? data.ga4.reason : undefined}
					/>
				</div>
				<p className="text-xs text-muted-foreground">
					Odświeżono:{" "}
					{new Date(data.fetchedAt).toLocaleString("pl-PL", {
						dateStyle: "short",
						timeStyle: "short",
					})}
					{" · "}
					cache 15 min
				</p>
			</div>

			{!hasAnySource ? (
				<div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground">
					<p className="font-medium">Brak połączenia z analityką ruchu.</p>
					<ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
						<li>PostHog: {getSourceMessage(data.posthog)}</li>
						<li>GA4: {getSourceMessage(data.ga4)}</li>
					</ul>
				</div>
			) : null}

			{trafficGap ? (
				<div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground">
					<p className="font-medium">Możliwa przerwa w zbieraniu danych PostHog</p>
					<p className="mt-1 text-muted-foreground">
						Wykres użytkowników dziennych spada do zera w końcówce okresu — to zwykle awaria ingestu, nie brak ruchu na
						stronie. Sprawdź też zakładkę „Wejścia na stronę" (surowy licznik serwera).
					</p>
				</div>
			) : null}

			<KpiGrid
				posthogKpi={posthogKpi}
				ga4Kpi={ga4Kpi}
				posthogConnected={posthogConnected}
				ga4Connected={ga4Connected}
				periodLabel={periodLabel}
				storeOrders={storeOrders}
			/>

			<TrafficChart
				title="Użytkownicy dziennie"
				points={traffic.map((p) => ({ label: p.label, value: p.value }))}
				sourceLabel={trafficSource}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<ChannelsSection
					channels={channels}
					campaigns={campaigns}
					sourceLabel={channelSource}
					fallbackReason={channelFallback}
				/>
				<TopPagesSection pages={topPages} sourceLabel={pagesSource} />
			</div>

			{funnel.length > 0 ? <FunnelSection funnel={funnel} /> : null}
		</div>
	);
}
