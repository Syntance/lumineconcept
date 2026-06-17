import Link from "next/link";
import { magazynConfig } from "@magazyn/magazyn.config";
import { formatPrice } from "@magazyn/core/lib/format";
import { cn } from "@magazyn/core/lib/cn";
import type { AdminOrderRow } from "@magazyn/modules/orders/order-types";
import { BADGE_TONE_CLASS, orderStatusBadge } from "@magazyn/modules/orders/order-status";

const DATE_FMT = new Intl.DateTimeFormat(magazynConfig.locale, {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
});

export function OverviewRecentOrders({ orders }: { orders: AdminOrderRow[] }) {
	const base = `${magazynConfig.basePath}/panel/zamowienia`;

	if (orders.length === 0) {
		return (
			<p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
				Brak zamówień do wyświetlenia.
			</p>
		);
	}

	return (
		<section className="flex flex-col gap-4">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<h2 className="font-serif text-lg text-foreground">Ostatnie zamówienia</h2>
				<Link
					href={base}
					className="text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					Zobacz wszystkie →
				</Link>
			</div>

			<div className="overflow-x-auto rounded-xl border border-border">
				<table className="w-full border-collapse text-left">
					<thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
						<tr>
							{["Zamówienie", "Klient", "Wartość", "Status"].map((heading) => (
								<th key={heading} className="px-4 py-3 font-medium">
									{heading}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{orders.map((order) => {
							const status = orderStatusBadge(order.status);
							return (
								<tr key={order.id} className="transition-colors hover:bg-muted/30">
									<td className="px-4 py-3">
										<Link
											href={`${base}/${order.id}`}
											className="block text-sm font-semibold text-foreground hover:text-primary"
										>
											#{order.displayId}
										</Link>
										<span className="block text-xs text-muted-foreground">
											{DATE_FMT.format(new Date(order.createdAt))}
										</span>
									</td>
									<td className="px-4 py-3">
										<span className="block text-sm font-medium text-foreground">
											{order.customerName || "—"}
										</span>
										<span className="block text-xs text-muted-foreground">{order.email}</span>
									</td>
									<td className="px-4 py-3 text-sm font-medium text-foreground">
										{formatPrice(order.total, order.currencyCode)}
									</td>
									<td className="px-4 py-3">
										<span
											className={cn(
												"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
												BADGE_TONE_CLASS[status.tone],
											)}
										>
											{status.label}
										</span>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</section>
	);
}
