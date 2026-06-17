import Link from "next/link";
import { loadAdmin } from "@magazyn/core/auth/load";
import { magazynConfig } from "../../magazyn.config";
import { fetchAnalyticsDashboard } from "@magazyn/modules/analytics/fetch-analytics";
import { getSalesStatistics } from "@magazyn/modules/analytics/sales-store";
import { listAdminOrders } from "@magazyn/modules/orders/store";
import { OverviewDashboardCharts } from "./overview-dashboard-charts";
import { OverviewKpiSection } from "./overview-kpi-section";
import { OverviewRecentOrders } from "./overview-recent-orders";
import { buildNavItems } from "./nav-items";

export const dynamic = "force-dynamic";

/**
 * Pulpit panelu — KPI, wykresy, ostatnie zamówienia i kafle modułów.
 * Re-eksportuj w `app{basePath}/(panel)/page.tsx`:
 *   export { default } from "@magazyn/core/layout/overview-page";
 */
export default async function OverviewPage() {
	const panel = `${magazynConfig.basePath}/panel`;
	const tiles = buildNavItems().filter((item) => item.href !== panel);

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
				<p className="mt-1 text-sm text-muted-foreground">Wybierz moduł, którym chcesz zarządzać.</p>
			</header>

			{dashboardData ? (
				<>
					<OverviewKpiSection sales={dashboardData.sales} analytics={dashboardData.analytics} />
					<OverviewDashboardCharts sales={dashboardData.sales} />
					<OverviewRecentOrders orders={dashboardData.recentOrders} />
				</>
			) : null}

			<section className="flex flex-col gap-4">
				<h2 className="font-serif text-lg text-foreground">Moduły panelu</h2>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{tiles.map(({ href, label, icon: Icon }) => (
						<Link
							key={href}
							href={href}
							className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
						>
							<span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
								<Icon className="size-5" aria-hidden />
							</span>
							<span className="font-serif text-lg text-foreground">{label}</span>
						</Link>
					))}
				</div>
			</section>
		</div>
	);
}
