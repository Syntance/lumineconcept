import { loadAdmin } from "@magazyn/core/auth/load";
import { magazynConfig } from "../../magazyn.config";
import { fetchAnalyticsDashboard } from "@magazyn/modules/analytics/fetch-analytics";
import { getSalesStatistics } from "@magazyn/modules/analytics/sales-store";
import { listAdminOrders } from "@magazyn/modules/orders/store";
import { OverviewDashboardCharts } from "./overview-dashboard-charts";
import { OverviewKpiSection } from "./overview-kpi-section";
import { OverviewRecentOrders } from "./overview-recent-orders";

export const dynamic = "force-dynamic";

/**
 * Pulpit panelu — KPI, wykresy i ostatnie zamówienia.
 */
export default async function OverviewPage() {
	const ordersEnabled = magazynConfig.modules.orders === true;

	const dashboardData = ordersEnabled
		? await loadAdmin(async () => {
				const [sales, orders, analytics] = await Promise.all([
					getSalesStatistics(),
					listAdminOrders(),
					fetchAnalyticsDashboard({ rangeDays: 30 }).catch(() => null),
				]);
				return { sales, recentOrders: orders.slice(0, 6), analytics };
			})
		: null;

	return (
		<div className="flex flex-col gap-8">
			<header>
				<h1 className="font-serif text-2xl text-foreground">Przegląd</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Podsumowanie sprzedaży i ostatnie zamówienia.
				</p>
			</header>

			{dashboardData ? (
				<>
					<OverviewKpiSection sales={dashboardData.sales} analytics={dashboardData.analytics} />
					<OverviewDashboardCharts sales={dashboardData.sales} />
					<OverviewRecentOrders orders={dashboardData.recentOrders} />
				</>
			) : null}
		</div>
	);
}
