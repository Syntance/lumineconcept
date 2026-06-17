"use client";

import { useMemo } from "react";
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
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@magazyn/core/lib/cn";
import type { AnalyticsDashboardData, AnalyticsKpi, AnalyticsSourceState, ChannelRow, FunnelStep, TopPageRow } from "./types";

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

function pickPrimarySource(data: AnalyticsDashboardData): "posthog" | "ga4" | null {
	if (data.posthog.status === "connected") return "posthog";
	if (data.ga4.status === "connected") return "ga4";
	return null;
}

function pickKpi(data: AnalyticsDashboardData): AnalyticsKpi | null {
	const source = pickPrimarySource(data);
	if (source === "posthog") return data.posthog.kpi ?? null;
	if (source === "ga4") return data.ga4.kpi ?? null;
	return null;
}

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

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
	return (
		<div className="rounded-xl border border-border bg-card p-5">
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
			<p className="mt-1 font-serif text-2xl tabular-nums text-foreground">{value}</p>
			{sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
		</div>
	);
}

function KpiGrid({
	kpi,
	periodLabel,
	storeOrders,
}: {
	kpi: AnalyticsKpi;
	periodLabel: string;
	storeOrders?: number;
}) {
	return (
		<section className="flex flex-col gap-4">
			<h2 className="font-serif text-lg text-foreground">Ruch na stronie ({periodLabel})</h2>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard label="Użytkownicy" value={(kpi.users ?? 0).toLocaleString("pl-PL")} />
				<StatCard label="Sesje" value={(kpi.sessions ?? 0).toLocaleString("pl-PL")} />
				<StatCard label="Odsłony" value={(kpi.pageviews ?? 0).toLocaleString("pl-PL")} />
				<StatCard
					label="Konwersja"
					value={kpi.conversionRate != null ? `${kpi.conversionRate}%` : "—"}
					sub={
						storeOrders != null
							? `${(kpi.purchases ?? 0).toLocaleString("pl-PL")} zakupów (śledzenie) · ${storeOrders.toLocaleString("pl-PL")} zamówień (sklep)`
							: kpi.purchases != null
								? `${kpi.purchases.toLocaleString("pl-PL")} zakupów`
								: undefined
					}
				/>
			</div>
		</section>
	);
}

function TrafficChart({
	title,
	points,
}: {
	title: string;
	points: Array<{ label: string; value: number }>;
}) {
	if (points.length === 0) return null;
	return (
		<article className="rounded-xl border border-border bg-card p-5">
			<h2 className="font-serif text-lg text-foreground">{title}</h2>
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

function ChannelsSection({ channels, sourceLabel }: { channels: ChannelRow[]; sourceLabel: string }) {
	if (channels.length === 0) return null;
	return (
		<article className="rounded-xl border border-border bg-card p-5">
			<h2 className="font-serif text-lg text-foreground">Skąd przyszli ({sourceLabel})</h2>
			<div className="mt-4">
				<ResponsiveContainer width="100%" height={Math.max(160, channels.length * 36)}>
					<BarChart data={channels} layout="vertical" margin={{ left: 0, right: 16 }}>
						<XAxis type="number" hide />
						<YAxis
							type="category"
							dataKey="channel"
							width={130}
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
		</article>
	);
}

function TopPagesSection({ pages, sourceLabel }: { pages: TopPageRow[]; sourceLabel: string }) {
	if (pages.length === 0) return null;
	return (
		<article className="rounded-xl border border-border bg-card p-5">
			<h2 className="font-serif text-lg text-foreground">Najpopularniejsze podstrony ({sourceLabel})</h2>
			<ol className="mt-4 space-y-2">
				{pages.map((page, index) => (
					<li key={page.path} className="flex items-center gap-3 text-sm">
						<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
							{index + 1}
						</span>
						<span className="min-w-0 flex-1 truncate font-mono text-foreground">{page.path}</span>
						<span className="shrink-0 tabular-nums text-muted-foreground">
							{page.views.toLocaleString("pl-PL")} · {page.share}%
						</span>
					</li>
				))}
			</ol>
		</article>
	);
}

function FunnelSection({ funnel }: { funnel: FunnelStep[] }) {
	if (funnel.length === 0) return null;
	return (
		<article className="rounded-xl border border-border bg-card p-5">
			<h2 className="font-serif text-lg text-foreground">Lejek zakupowy</h2>
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

export type AnalyticsPanelProps = {
	data: AnalyticsDashboardData;
	periodLabel: string;
	storeOrders?: number;
};

export function AnalyticsPanel({
	data,
	periodLabel,
	storeOrders,
}: AnalyticsPanelProps) {
	const primary = pickPrimarySource(data);
	const kpi = pickKpi(data);

	const { channels, topPages, traffic, funnel, sourceLabel } = useMemo(() => {
		if (primary === "posthog") {
			return {
				channels: data.posthog.channels ?? [],
				topPages: data.posthog.topPages ?? [],
				traffic: data.posthog.traffic ?? [],
				funnel: data.posthog.funnel ?? [],
				sourceLabel: "PostHog",
			};
		}
		if (primary === "ga4") {
			return {
				channels: data.ga4.channels ?? [],
				topPages: data.ga4.topPages ?? [],
				traffic: data.ga4.traffic ?? [],
				funnel: [],
				sourceLabel: "GA4",
			};
		}
		return { channels: [], topPages: [], traffic: [], funnel: [], sourceLabel: "" };
	}, [primary, data]);

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

			{primary === null ? (
				<div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground">
					<p className="font-medium">Brak połączenia z analityką ruchu.</p>
					<ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
						<li>PostHog: {getSourceMessage(data.posthog)}</li>
						<li>GA4: {getSourceMessage(data.ga4)}</li>
					</ul>
				</div>
			) : null}

			{kpi ? <KpiGrid kpi={kpi} periodLabel={periodLabel} storeOrders={storeOrders} /> : null}

			<TrafficChart
				title="Sesje dzienne"
				points={traffic.map((p) => ({ label: p.label, value: p.value }))}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<ChannelsSection channels={channels} sourceLabel={sourceLabel} />
				<TopPagesSection pages={topPages} sourceLabel={sourceLabel} />
			</div>

			{primary === "posthog" && funnel.length > 0 ? <FunnelSection funnel={funnel} /> : null}
		</div>
	);
}
