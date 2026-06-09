/** Wykrywa zamówienie oczekujące na przelew tradycyjny (provider system / manual). */
export const SYSTEM_PAYMENT_PROVIDER_ID = "pp_system_default";

type PaymentLike = { provider_id?: string | null; captured_at?: string | null };

type OrderLike = {
	payment_status?: string | null;
	payment_collections?: Array<{ payments?: PaymentLike[] | null }> | null;
};

function getPrimaryProviderId(order: OrderLike): string | null {
	for (const col of order.payment_collections ?? []) {
		for (const p of col.payments ?? []) {
			if (p?.provider_id) return p.provider_id;
		}
	}
	return null;
}

export function orderAwaitingBankTransfer(order: OrderLike): boolean {
	if (getPrimaryProviderId(order) !== SYSTEM_PAYMENT_PROVIDER_ID) return false;

	const status = order.payment_status ?? "";
	return status !== "captured" && status !== "partially_captured";
}
