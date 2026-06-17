import { loadAdmin } from "@magazyn/core/auth/load";
import { fetchAnalyticsDashboard } from "./fetch-analytics";
import { getSalesStatistics } from "./sales-store";
import { StatisticsTabs } from "./statistics-tabs";

export const dynamic = "force-dynamic";

export default async function AnalyticsStatisticsPage() {
	const [sales, analytics] = await loadAdmin(async () =>
		Promise.all([getSalesStatistics(), fetchAnalyticsDashboard({ rangeDays: 30 })]),
	);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="font-serif text-2xl text-foreground">Statystyki</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Sprzedaż sklepu oraz ruch i konwersja z Google Analytics 4 i PostHog.
				</p>
			</header>
			<StatisticsTabs sales={sales} analytics={analytics} />
		</div>
	);
}
