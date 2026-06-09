import { ArrowLeft, Mail, MapPin, Phone, Receipt } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { magazynConfig } from "@magazyn/magazyn.config";
import { loadAdmin } from "@magazyn/core/auth/load";
import { formatPrice } from "@magazyn/core/lib/format";
import { cn } from "@magazyn/core/lib/cn";
import { type AdminOrderDetail, getAdminOrder, type OrderAddress } from "./store";
import { BADGE_TONE_CLASS, fulfillmentStatusBadge, orderStatusBadge, paymentStatusBadge } from "./order-status";
import { OrderActions } from "./order-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DATE_TIME = new Intl.DateTimeFormat(magazynConfig.locale, {
	day: "2-digit",
	month: "long",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

/** Klucze metadanych zamówienia pokazywane w panelu (dostosuj pod swój checkout). */
const META_LABELS: Record<string, string> = {
	shipping: "Metoda dostawy (sklep)",
	payment: "Metoda płatności (sklep)",
	nip: "NIP",
	companyName: "Nazwa firmy",
	invoice: "Faktura VAT",
};

function Badge({ label, tone }: { label: string; tone: keyof typeof BADGE_TONE_CLASS }) {
	return (
		<span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", BADGE_TONE_CLASS[tone])}>
			{label}
		</span>
	);
}

function AddressBlock({ address }: { address: OrderAddress }) {
	const name = [address.firstName, address.lastName].filter(Boolean).join(" ");
	return (
		<address className="not-italic text-sm leading-relaxed text-foreground">
			{name ? <p className="font-medium">{name}</p> : null}
			{address.company ? <p className="text-muted-foreground">{address.company}</p> : null}
			<p>{address.address1}</p>
			{address.address2 ? <p>{address.address2}</p> : null}
			<p>{address.postalCode} {address.city}</p>
			{address.province ? <p>{address.province}</p> : null}
			<p className="uppercase text-muted-foreground">{address.countryCode}</p>
		</address>
	);
}

function actionFlags(order: AdminOrderDetail) {
	const closed = ["canceled", "completed", "archived"].includes(order.status);
	const shipped = ["shipped", "partially_shipped", "delivered", "partially_delivered"].includes(order.fulfillmentStatus);
	const inRealization = ["fulfilled", "partially_fulfilled"].includes(order.fulfillmentStatus);

	const isPaid =
		order.paymentStatus === "captured" ||
		order.paymentStatus === "partially_captured" ||
		order.paymentStatus === "authorized" ||
		order.paymentStatus === "partially_authorized" ||
		order.payments.some((p) => p.capturedAt && !p.canceledAt);

	return {
		canCapture:
			!closed && !shipped && !inRealization && ["not_fulfilled", "partially_fulfilled"].includes(order.fulfillmentStatus),
		isPaid,
		canShip: !closed && !shipped && (inRealization || order.fulfillments.some((f) => !f.canceledAt && !f.shippedAt)),
		canComplete: !closed && shipped,
		canCancel: !closed,
	};
}

/**
 * Szczegóły zamówienia. Re-eksportuj w `app{basePath}/(panel)/zamowienia/[id]/page.tsx`:
 *   export { default, dynamic, revalidate } from "@magazyn/modules/orders/order-detail-page";
 */
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const order = await loadAdmin(() => getAdminOrder(id));
	if (!order) notFound();

	const status = orderStatusBadge(order.status);
	const payment = paymentStatusBadge(order.paymentStatus);
	const fulfillment = fulfillmentStatusBadge(order.fulfillmentStatus, order.status);
	const flags = actionFlags(order);
	const metaEntries = Object.entries(order.metadata).filter(([key]) => key in META_LABELS);
	const ordersHref = `${magazynConfig.basePath}/panel/zamowienia`;

	return (
		<div className="flex flex-col gap-6">
			<div>
				<Link href={ordersHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
					<ArrowLeft className="size-4" aria-hidden />
					Zamówienia
				</Link>
				<div className="mt-2 flex flex-wrap items-center gap-3">
					<h1 className="font-serif text-2xl text-foreground">Zamówienie #{order.displayId || "—"}</h1>
					<Badge label={status.label} tone={status.tone} />
				</div>
				<p className="mt-1 text-sm text-muted-foreground">
					Złożone {order.createdAt ? DATE_TIME.format(new Date(order.createdAt)) : "—"}
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1fr_320px]">
				<div className="flex flex-col gap-6">
					<section className="rounded-xl border border-border bg-card p-5">
						<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
							<h2 className="font-serif text-lg text-foreground">Pozycje</h2>
							<div className="flex gap-2">
								<Badge label={`Płatność: ${payment.label}`} tone={payment.tone} />
								<Badge label={`Wysyłka: ${fulfillment.label}`} tone={fulfillment.tone} />
							</div>
						</div>
						<ul className="divide-y divide-border">
							{order.items.map((item) => (
								<li key={item.id} className="flex items-center gap-3 py-3">
									<span className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
										{item.thumbnail ? <Image src={item.thumbnail} alt="" fill sizes="48px" className="object-cover" /> : null}
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-foreground">{item.title}</p>
										{item.subtitle ? <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p> : null}
									</div>
									<div className="text-right text-sm">
										<p className="text-muted-foreground">{item.quantity} × {formatPrice(item.unitPrice, order.currencyCode)}</p>
										<p className="font-medium text-foreground">{formatPrice(item.total, order.currencyCode)}</p>
									</div>
								</li>
							))}
						</ul>

						<dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Produkty</dt>
								<dd>{formatPrice(order.itemTotal, order.currencyCode)}</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Dostawa</dt>
								<dd>{formatPrice(order.shippingTotal, order.currencyCode)}</dd>
							</div>
							{order.discountTotal > 0 ? (
								<div className="flex justify-between text-emerald-600 dark:text-emerald-400">
									<dt>Rabat</dt>
									<dd>−{formatPrice(order.discountTotal, order.currencyCode)}</dd>
								</div>
							) : null}
							<div className="flex justify-between">
								<dt className="text-muted-foreground">W tym VAT</dt>
								<dd>{formatPrice(order.taxTotal, order.currencyCode)}</dd>
							</div>
							<div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
								<dt>Razem</dt>
								<dd>{formatPrice(order.total, order.currencyCode)}</dd>
							</div>
						</dl>
					</section>

					<section className="rounded-xl border border-border bg-card p-5">
						<h2 className="mb-3 font-serif text-lg text-foreground">Dane kupującego</h2>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2 text-sm">
								<span className="inline-flex items-center gap-2 text-foreground">
									<Mail className="size-4 text-muted-foreground" aria-hidden />
									{order.email ? <a href={`mailto:${order.email}`} className="hover:underline">{order.email}</a> : "—"}
								</span>
								<span className="inline-flex items-center gap-2 text-foreground">
									<Phone className="size-4 text-muted-foreground" aria-hidden />
									{order.phone ? <a href={`tel:${order.phone}`} className="hover:underline">{order.phone}</a> : "—"}
								</span>
								{order.shippingMethodName ? <span className="text-muted-foreground">Dostawa: {order.shippingMethodName}</span> : null}
							</div>
						</div>

						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							<div>
								<p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									<MapPin className="size-3.5" aria-hidden />
									Adres dostawy
								</p>
								{order.shippingAddress ? <AddressBlock address={order.shippingAddress} /> : <p className="text-sm text-muted-foreground">Brak — odbiór osobisty?</p>}
							</div>
							<div>
								<p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									<Receipt className="size-3.5" aria-hidden />
									Adres rozliczeniowy
								</p>
								{order.billingAddress ? <AddressBlock address={order.billingAddress} /> : <p className="text-sm text-muted-foreground">Taki sam jak dostawy</p>}
							</div>
						</div>

						{metaEntries.length > 0 ? (
							<dl className="mt-4 grid gap-x-4 gap-y-1.5 border-t border-border pt-4 text-sm sm:grid-cols-2">
								{metaEntries.map(([key, value]) => (
									<div key={key} className="flex justify-between gap-3">
										<dt className="text-muted-foreground">{META_LABELS[key]}</dt>
										<dd className="text-right font-medium text-foreground">{value}</dd>
									</div>
								))}
							</dl>
						) : null}
					</section>
				</div>

				<aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
					<section className="rounded-xl border border-border bg-card p-5">
						<h2 className="mb-4 font-serif text-lg text-foreground">Zarządzaj</h2>
						<OrderActions orderId={order.id} {...flags} />
					</section>

					<section className="rounded-xl border border-border bg-card p-5">
						<h2 className="mb-3 font-serif text-lg text-foreground">Status</h2>
						<dl className="space-y-2.5 text-sm">
							<div className="flex items-center justify-between">
								<dt className="text-muted-foreground">Realizacja</dt>
								<dd><Badge label={status.label} tone={status.tone} /></dd>
							</div>
							<div className="flex items-center justify-between">
								<dt className="text-muted-foreground">Płatność</dt>
								<dd><Badge label={payment.label} tone={payment.tone} /></dd>
							</div>
							<div className="flex items-center justify-between">
								<dt className="text-muted-foreground">Wysyłka</dt>
								<dd><Badge label={fulfillment.label} tone={fulfillment.tone} /></dd>
							</div>
						</dl>
					</section>
				</aside>
			</div>
		</div>
	);
}
