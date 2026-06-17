import { Suspense } from "react";
import { loadAdmin } from "@magazyn/core/auth/load";
import { fetchAnalyticsDashboard } from "./fetch-analytics";
import { parseSalesPeriod, salesPeriodToRangeDays } from "./sales-period";
import { getSalesStatistics } from "./sales-store";
import { StatisticsPeriodSelector } from "./statistics-period-selector";
import { StatisticsTabs } from "./statistics-tabs";

export const dynamic = "force-dynamic";

type PageProps = {
	searchParams: Promise<{
		okres?: string;
		rok?: string;
		miesiac?: string;
		od?: string;
		do?: string;
	}>;
};

export default async function AnalyticsStatisticsPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const period = parseSalesPeriod(params);
	const rangeDays = salesPeriodToRangeDays(period);

	const [sales, analytics] = await loadAdmin(async () =>
		Promise.all([
			getSalesStatistics(period),
			fetchAnalyticsDashboard({ rangeDays }),
		]),
	);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="font-serif text-2xl text-foreground">Statystyki</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Sprzedaż sklepu oraz ruch i konwersja z Google Analytics 4 i PostHog.
				</p>
			</header>

			<Suspense fallback={null}>
				<StatisticsPeriodSelector />
			</Suspense>

			<StatisticsTabs sales={sales} analytics={analytics} />
		</div>
	);
}
