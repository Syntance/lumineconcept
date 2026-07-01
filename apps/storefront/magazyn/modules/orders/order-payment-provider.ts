import type { AdminOrderDetail } from "./order-types";

/** Pełny id providera Przelewy24 w Medusie. */
export const PRZELEWY24_PROVIDER_ID = "pp_przelewy24_przelewy24";

/** Provider przelewu tradycyjnego (manual). */
export const SYSTEM_PAYMENT_PROVIDER_ID = "pp_system_default";

function activePayments(order: AdminOrderDetail) {
	return order.payments.filter((p) => !p.canceledAt);
}

/** Provider pierwszej aktywnej płatności zamówienia. */
export function primaryPaymentProviderId(order: AdminOrderDetail): string | null {
	const active = activePayments(order);
	return active[0]?.providerId ?? order.payments[0]?.providerId ?? null;
}

/** Czytelna nazwa providera płatności (checkout / Medusa). */
export function paymentProviderLabel(providerId: string | null | undefined): string {
	if (!providerId) return "—";
	if (providerId === PRZELEWY24_PROVIDER_ID) return "Przelewy24";
	if (providerId === SYSTEM_PAYMENT_PROVIDER_ID) return "Przelew tradycyjny";
	if (providerId.includes("paypo")) return "PayPo";
	if (providerId.includes("blik")) return "BLIK";
	return providerId.replace(/^pp_/, "").replace(/_/g, " ");
}

/**
 * Nazwy metod P24 bez rozpoznawalnego BLIK/karty/portfela to pay-by-link
 * banków — oznaczamy jawnie „przelew”, żeby obsługa magazynu od razu
 * wiedziała, że klient płacił przelewem (przez bramkę P24).
 * Lustrzana logika: backend `formatP24PaymentLabel` (p24-payment-methods.ts).
 */
function formatP24MethodLabel(methodName: string): string {
	const name = methodName.toLowerCase();
	const isTransfer =
		!name.includes("blik") &&
		!/karta|card|visa|mastercard/.test(name) &&
		!/google\s*pay|apple\s*pay|paypal/.test(name);
	return isTransfer
		? `Przelewy24 (przelew — ${methodName})`
		: `Przelewy24 (${methodName})`;
}

/** Metoda płatności zamówienia — metadata sklepu lub provider z Medusy. */
export function orderPaymentMethodLabel(order: AdminOrderDetail): string {
	const metaLabel = order.metadata.payment?.trim();
	if (metaLabel) return metaLabel;

	const methodName =
		order.metadata.p24_method_name?.trim() ||
		order.p24MethodName?.trim() ||
		"";
	if (methodName) {
		const providerId =
			order.metadata.payment_provider_id?.trim() ?? primaryPaymentProviderId(order);
		if (providerId === PRZELEWY24_PROVIDER_ID) {
			return formatP24MethodLabel(methodName);
		}
		return methodName;
	}

	const methodIdRaw =
		order.metadata.p24_method_id?.trim() || order.p24MethodId?.trim() || "";
	const methodId = Number(methodIdRaw);
	const providerId =
		order.metadata.payment_provider_id?.trim() ?? primaryPaymentProviderId(order);
	if (providerId === PRZELEWY24_PROVIDER_ID && Number.isFinite(methodId) && methodId > 0) {
		return `Przelewy24 (metoda #${methodId})`;
	}

	return paymentProviderLabel(providerId);
}

/**
 * „Rozpocznij realizację” tylko gdy płatność poszła przez P24 i jest
 * potwierdzona (captured). Przelew tradycyjny — zawsze „Zaksięguj płatność”.
 */
export function isP24PaymentConfirmed(order: AdminOrderDetail): boolean {
	const provider = primaryPaymentProviderId(order);
	if (provider !== PRZELEWY24_PROVIDER_ID) return false;

	const p24Payments = activePayments(order).filter(
		(p) => p.providerId === PRZELEWY24_PROVIDER_ID,
	);

	return (
		order.paymentStatus === "captured" ||
		order.paymentStatus === "partially_captured" ||
		p24Payments.some((p) => p.capturedAt)
	);
}
