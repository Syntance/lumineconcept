import { Plus } from "lucide-react";
import Link from "next/link";
import { loadAdmin } from "@magazyn/core/auth/load";
import { magazynConfig } from "@magazyn/magazyn.config";
import { listAdminOrders } from "./store";
import { OrdersList } from "./orders-list";

/**
 * Lista zamówień. Re-eksportuj w `app{basePath}/(panel)/zamowienia/page.tsx`:
 *   export { default, dynamic } from "@magazyn/modules/orders/page";
 */
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
	const orders = await loadAdmin(listAdminOrders);
	const base = `${magazynConfig.basePath}/panel/zamowienia`;

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="font-serif text-2xl text-foreground">Zamówienia</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Wszystkie zamówienia ze sklepu, w tym anulowane — kliknij, aby zarządzać.
					</p>
				</div>
				<Link
					href={`${base}/nowe`}
					className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					<Plus className="size-4" aria-hidden />
					Nowe zamówienie
				</Link>
			</header>

			<OrdersList orders={orders} />
		</div>
	);
}
