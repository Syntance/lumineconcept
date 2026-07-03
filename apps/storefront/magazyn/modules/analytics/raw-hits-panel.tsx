"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Info } from "lucide-react";
import type { RawHitsData } from "./types";

const CHART_STROKE = "oklch(0.58 0.08 55)";

const chartTooltipStyle = {
	background: "var(--card)",
	border: "1px solid var(--border)",
	borderRadius: 10,
	fontSize: 13,
	color: "var(--foreground)",
} as const;

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
	return (
		<div className="rounded-xl border border-border bg-card p-5">
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
			<p className="mt-1 font-serif text-2xl tabular-nums text-foreground">{value}</p>
			{sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
		</div>
	);
}

export type RawHitsPanelProps = {
	data: RawHitsData;
	periodLabel: string;
};

export function RawHitsPanel({ data, periodLabel }: RawHitsPanelProps) {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-sm text-foreground">
				<Info className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
				<div>
					<p className="font-medium">Surowe wejścia — niezależne od zgody na cookies.</p>
					<p className="mt-1 text-muted-foreground">
						Ta zakładka liczy każde żądanie strony na poziomie serwera, zanim użytkownik w ogóle
						zobaczy baner cookies — dlatego liczby są wyższe niż w GA4/PostHog (te wymagają
						zgody). To surowe liczniki: <strong>nie rozróżniają osób</strong> — jedna osoba
						odświeżająca stronę kilka razy liczy się kilka razy. Boty i crawlery nie są
						odfiltrowane — to najbardziej surowy z dostępnych obrazów ruchu. Wejścia
						właściciela/administratora (zalogowanego w tym panelu w tej samej przeglądarce oraz
						z adresów IP na liście wykluczeń) są pomijane.
					</p>
				</div>
			</div>

			{data.status === "error" ? (
				<div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground">
					<p className="font-medium">Nie udało się pobrać surowych wejść.</p>
					<p className="mt-1 text-muted-foreground">{data.reason}</p>
				</div>
			) : (
				<>
					<section className="flex flex-col gap-4">
						<h2 className="font-serif text-lg text-foreground">
							Surowe wejścia na stronę ({periodLabel})
						</h2>
						<div className="grid gap-4 sm:grid-cols-2">
							<StatCard
								label="Łącznie żądań stron"
								value={data.totalHits.toLocaleString("pl-PL")}
								sub="Bez deduplikacji osób, bez wymogu zgody na cookies"
							/>
							<StatCard
								label="Śr. dziennie"
								value={
									data.daily.length > 0
										? Math.round(data.totalHits / data.daily.length).toLocaleString("pl-PL")
										: "0"
								}
							/>
						</div>
					</section>

					{data.daily.length > 0 ? (
						<article className="rounded-xl border border-border bg-card p-5">
							<h2 className="font-serif text-lg text-foreground">Wejścia dziennie (surowe)</h2>
							<div className="mt-4">
								<ResponsiveContainer width="100%" height={220}>
									<AreaChart data={data.daily} margin={{ left: -20 }}>
										<defs>
											<linearGradient id="raw-hits-grad" x1="0" y1="0" x2="0" y2="1">
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
											dataKey="hits"
											stroke={CHART_STROKE}
											strokeWidth={2}
											fill="url(#raw-hits-grad)"
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						</article>
					) : null}

					{data.topPaths.length > 0 ? (
						<article className="rounded-xl border border-border bg-card p-5">
							<h2 className="font-serif text-lg text-foreground">
								Najczęściej odwiedzane podstrony (surowe)
							</h2>
							<ol className="mt-4 space-y-2">
								{data.topPaths.map((page, index) => (
									<li key={page.path} className="flex items-center gap-3 text-sm">
										<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
											{index + 1}
										</span>
										<span className="min-w-0 flex-1 truncate font-mono text-foreground">
											{page.path}
										</span>
										<span className="shrink-0 tabular-nums text-muted-foreground">
											{page.hits.toLocaleString("pl-PL")}
										</span>
									</li>
								))}
							</ol>
						</article>
					) : null}
				</>
			)}
		</div>
	);
}
