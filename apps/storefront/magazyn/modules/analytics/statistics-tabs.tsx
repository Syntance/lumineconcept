"use client";

import { useState } from "react";
import { cn } from "@magazyn/core/lib/cn";
import { AnalyticsPanel } from "./analytics-panel";
import { SalesStatisticsView } from "./sales-statistics-view";
import type { AnalyticsDashboardData } from "./types";
import type { SalesStatistics } from "./sales-types";

type StatisticsTab = "sales" | "analytics";

const TABS: Array<{ id: StatisticsTab; label: string; description: string }> = [
	{
		id: "sales",
		label: "Statystyki sprzedażowe",
		description: "Przychód, zamówienia, dostawa i produkty ze sklepu (Medusa)",
	},
	{
		id: "analytics",
		label: "Analityka",
		description: "Ruch i konwersja z Google Analytics 4 oraz PostHog",
	},
];

type Props = {
	sales: SalesStatistics;
	analytics: AnalyticsDashboardData;
};

export function StatisticsTabs({ sales, analytics }: Props) {
	const [tab, setTab] = useState<StatisticsTab>("sales");
	const activeMeta = TABS.find((item) => item.id === tab) ?? TABS[0]!;

	return (
		<div className="flex flex-col gap-6">
			<div
				className="inline-flex w-fit shrink-0 flex-wrap gap-1 self-start rounded-xl border border-border bg-muted/40 p-1"
				role="tablist"
				aria-label="Sekcje statystyk"
			>
				{TABS.map(({ id, label }) => (
					<button
						key={id}
						type="button"
						role="tab"
						aria-selected={tab === id}
						onClick={() => {
							setTab(id);
						}}
						className={cn(
							"rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
							tab === id
								? "bg-card text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{label}
					</button>
				))}
			</div>

			<p className="text-sm text-muted-foreground">{activeMeta.description}</p>

			{tab === "sales" ? <SalesStatisticsView data={sales} /> : <AnalyticsPanel data={analytics} />}
		</div>
	);
}
