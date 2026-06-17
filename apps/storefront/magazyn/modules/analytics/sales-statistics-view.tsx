"use client";

import type { ReactNode } from "react";
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatPrice } from "@magazyn/core/lib/format";
import type { SalesStatistics } from "./sales-types";

const CHART_STROKE = "oklch(0.58 0.08 55)";

const chartTooltipStyle = {
	background: "var(--card)",
	border: "1px solid var(--border)",
	borderRadius: 10,
	fontSize: 13,
	color: "var(--foreground)",
} as const;

export function SalesStatisticsView({ data }: { data: SalesStatistics }) {
	const chartData = data.monthly.map((point) => ({
		miesiac: point.month,
		przychod: point.revenueMinor / 100,
		zamowienia: point.orderCount,
	}));

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard label="Przychód" value={formatPrice(data.totals.revenueMinor, data.currencyCode)} />
				<StatCard label="Zamówienia" value={data.totals.orderCount.toLocaleString("pl-PL")} />
				<StatCard label="Klienci" value={data.totals.uniqueCustomers.toLocaleString("pl-PL")} />
				<StatCard
					label="Śr. wartość koszyka"
					value={formatPrice(data.totals.averageOrderMinor, data.currencyCode)}
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card title="Przychód miesięczny" subtitle={data.rangeLabel}>
					<ResponsiveContainer width="100%" height={200}>
						<AreaChart data={chartData} margin={{ left: -20 }}>
							<defs>
								<linearGradient id="sales-revenue-grad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor={CHART_STROKE} stopOpacity={0.3} />
									<stop offset="95%" stopColor={CHART_STROKE} stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
							<XAxis
								dataKey="miesiac"
								tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
								axisLine={false}
								tickLine={false}
							/>
							<YAxis
								tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
								axisLine={false}
								tickLine={false}
								tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
							/>
							<Tooltip
								contentStyle={chartTooltipStyle}
								formatter={(v) => {
									if (typeof v !== "number") return ["—"];
									return [formatPrice(Math.round(v * 100), data.currencyCode)];
								}}
							/>
							<Area
								type="monotone"
								dataKey="przychod"
								stroke={CHART_STROKE}
								strokeWidth={2}
								fill="url(#sales-revenue-grad)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</Card>

				<Card title="Liczba zamówień" subtitle={data.rangeLabel}>
					<ResponsiveContainer width="100%" height={200}>
						<BarChart data={chartData} margin={{ left: -20 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
							<XAxis
								dataKey="miesiac"
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
							<Bar dataKey="zamowienia" fill={CHART_STROKE} radius={[6, 6, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</Card>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card title="Metody dostawy">
					{data.shippingMethods.length > 0 ? (
						<>
							<ResponsiveContainer width="100%" height={170}>
								<PieChart>
									<Pie
										data={data.shippingMethods}
										cx="50%"
										cy="50%"
										innerRadius={50}
										outerRadius={75}
										dataKey="value"
										paddingAngle={2}
									>
										{data.shippingMethods.map((row) => (
											<Cell key={row.name} fill={row.color} />
										))}
									</Pie>
									<Tooltip
										contentStyle={chartTooltipStyle}
										formatter={(v) => (typeof v === "number" ? [`${v} zam.`] : ["—"])}
									/>
								</PieChart>
							</ResponsiveContainer>
							<ul className="mt-3 space-y-1.5">
								{data.shippingMethods.map((row) => (
									<li key={row.name} className="flex items-center justify-between text-xs">
										<span className="flex items-center gap-2 text-muted-foreground">
											<span
												className="inline-block size-2 rounded-full"
												style={{ background: row.color }}
											/>
											{row.name}
										</span>
										<span className="font-medium text-foreground">{row.share}%</span>
									</li>
								))}
							</ul>
						</>
					) : (
						<p className="text-sm text-muted-foreground">Brak danych o dostawie.</p>
					)}
				</Card>

				<Card title="Metody płatności">
					{data.paymentMethods.length > 0 ? (
						<ResponsiveContainer width="100%" height={180}>
							<BarChart data={data.paymentMethods} layout="vertical" margin={{ left: 0, right: 20 }}>
								<XAxis
									type="number"
									tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									type="category"
									dataKey="name"
									tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
									axisLine={false}
									tickLine={false}
									width={96}
								/>
								<Tooltip
									contentStyle={chartTooltipStyle}
									formatter={(v) => (typeof v === "number" ? [`${v} zam.`] : ["—"])}
								/>
								<Bar dataKey="value" fill={CHART_STROKE} radius={[0, 6, 6, 0]} />
							</BarChart>
						</ResponsiveContainer>
					) : (
						<p className="text-sm text-muted-foreground">Brak danych o płatnościach.</p>
					)}
				</Card>

				<Card title="Zamówienia wg statusu">
					<div className="space-y-3">
						{data.statusBreakdown.map((row) => (
							<div key={row.label}>
								<div className="mb-1 flex justify-between text-sm">
									<span className="text-foreground">{row.label}</span>
									<span className="font-medium text-foreground">
										{row.count.toLocaleString("pl-PL")} ({row.share}%)
									</span>
								</div>
								<div className="h-2 rounded-full bg-muted">
									<div
										className="h-2 rounded-full"
										style={{ width: `${row.share}%`, background: row.color }}
									/>
								</div>
							</div>
						))}
					</div>
				</Card>
			</div>

			<Card title="Top 5 produktów">
				{data.topProducts.length > 0 ? (
					<ol className="space-y-3">
						{data.topProducts.map((product, index) => (
							<li key={product.title} className="flex items-center gap-4">
								<span className="w-5 shrink-0 text-center font-serif text-base text-muted-foreground">
									{index + 1}
								</span>
								<div className="flex-1">
									<div className="mb-1 flex justify-between gap-3">
										<span className="text-sm font-medium text-foreground">{product.title}</span>
										<span className="text-sm font-medium text-foreground">
											{formatPrice(product.revenueMinor, data.currencyCode)}
										</span>
									</div>
									<div className="flex items-center gap-3">
										<div className="h-1.5 flex-1 rounded-full bg-muted">
											<div
												className="h-1.5 rounded-full bg-primary"
												style={{
													width: `${data.topProducts[0] ? (product.revenueMinor / data.topProducts[0].revenueMinor) * 100 : 0}%`,
												}}
											/>
										</div>
										<span className="shrink-0 text-xs text-muted-foreground">
											{product.quantity} szt.
										</span>
									</div>
								</div>
							</li>
						))}
					</ol>
				) : (
					<p className="text-sm text-muted-foreground">Brak sprzedanych produktów w tym okresie.</p>
				)}
			</Card>
		</div>
	);
}

function StatCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl border border-border bg-card p-5">
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
			<p className="mt-1 font-serif text-2xl tabular-nums text-foreground">{value}</p>
		</div>
	);
}

function Card({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle?: string;
	children: ReactNode;
}) {
	return (
		<article className="rounded-xl border border-border bg-card p-5">
			<h2 className="font-serif text-lg text-foreground">{title}</h2>
			{subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
			<div className="mt-4">{children}</div>
		</article>
	);
}
