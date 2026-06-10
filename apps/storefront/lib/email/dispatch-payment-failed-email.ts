import "server-only";

import { formatPrice } from "@magazyn/core/lib/format";
import type { OrderRenderSource } from "@magazyn/modules/emails/render-template";
import { sendPaymentFailedEmail } from "@magazyn/modules/emails/send-payment-failed-email";
import { getCart, updateCartMetadata } from "@/lib/medusa/cart";

const LEGACY_EMAIL_SENT_KEY = "email_sent_payment-failed";

export function paymentFailedEmailMetadataKey(p24SessionId?: string): string {
	if (p24SessionId?.trim()) {
		return `email_sent_payment-failed_${p24SessionId.trim()}`;
	}
	return LEGACY_EMAIL_SENT_KEY;
}

function cartReference(cartId: string): string {
	const tail = cartId.replace(/^cart_/, "").slice(-6).toUpperCase();
	return tail || cartId.slice(-6).toUpperCase();
}

function cartToEmailSource(cart: Record<string, unknown>): OrderRenderSource | null {
	const email = typeof cart.email === "string" ? cart.email.trim() : "";
	if (!email) return null;

	const currency = (
		(typeof cart.currency_code === "string" ? cart.currency_code : "PLN") as string
	).toUpperCase();

	const shippingAddress = cart.shipping_address as
		| {
				first_name?: string;
				last_name?: string;
				address_1?: string;
				postal_code?: string;
				city?: string;
				phone?: string;
		  }
		| undefined;

	const customerName = [shippingAddress?.first_name, shippingAddress?.last_name]
		.filter(Boolean)
		.join(" ")
		.trim();

	const addressParts = [
		shippingAddress?.address_1,
		[shippingAddress?.postal_code, shippingAddress?.city].filter(Boolean).join(" "),
	].filter(Boolean);

	const itemsRaw = Array.isArray(cart.items) ? cart.items : [];
	const items = itemsRaw.map((row) => {
		const item = row as {
			title?: string;
			quantity?: number;
			total?: number;
			thumbnail?: string | null;
			product_title?: string;
		};
		const title = item.title ?? item.product_title ?? "Produkt";
		const quantity = item.quantity ?? 1;
		const totalMinor = typeof item.total === "number" ? item.total : 0;
		return {
			title,
			quantity,
			total: formatPrice(totalMinor, currency),
			thumbnail: item.thumbnail ?? null,
		};
	});

	const total =
		typeof cart.total === "number"
			? cart.total
			: itemsRaw.reduce((sum, row) => {
					const t = (row as { total?: number }).total;
					return sum + (typeof t === "number" ? t : 0);
				}, 0);

	const itemTotal =
		typeof cart.item_total === "number"
			? cart.item_total
			: itemsRaw.reduce((sum, row) => {
					const t = (row as { total?: number }).total;
					return sum + (typeof t === "number" ? t : 0);
				}, 0);

	const shippingTotal =
		typeof cart.shipping_total === "number" ? cart.shipping_total : 0;

	const shippingMethods = Array.isArray(cart.shipping_methods) ? cart.shipping_methods : [];
	const shippingMethodName =
		(shippingMethods[0] as { name?: string } | undefined)?.name ?? null;

	return {
		displayId: 0,
		email,
		phone: shippingAddress?.phone ?? "",
		currencyCode: currency,
		total,
		itemTotal,
		shippingTotal,
		shippingMethodName,
		customerName: customerName || email.split("@")[0] || "Kliencie",
		address: addressParts.join(", ") || "—",
		items,
	};
}

export type PaymentFailedEmailResult =
	| { ok: true; skipped?: boolean; source: "magazyn" }
	| { ok: false; step: string; message?: string };

/** Wysyła mail payment_failed z deduplikacją per sesja P24 (nowa próba = nowy mail). */
export async function dispatchPaymentFailedEmail(params: {
	cartId: string;
	retryUrl: string;
	p24SessionId?: string;
}): Promise<PaymentFailedEmailResult> {
	const cart = await getCart(params.cartId).catch(() => null);
	if (!cart) {
		return { ok: false, step: "cart_not_found" };
	}

	const metadata = (cart.metadata ?? {}) as Record<string, string>;
	const dedupeKey = paymentFailedEmailMetadataKey(params.p24SessionId);

	if (metadata[dedupeKey]?.trim()) {
		return { ok: true, skipped: true, source: "magazyn" };
	}

	const source = cartToEmailSource(cart);
	if (!source?.email) {
		return { ok: false, step: "no_email" };
	}

	const result = await sendPaymentFailedEmail(
		source,
		params.retryUrl,
		cartReference(params.cartId),
	);

	if (!result.ok) {
		return { ok: false, step: "resend", message: result.message };
	}
	if (result.skipped) {
		return { ok: true, skipped: true, source: "magazyn" };
	}

	void updateCartMetadata(params.cartId, {
		...metadata,
		[dedupeKey]: new Date().toISOString(),
	});

	return { ok: true, source: "magazyn" };
}
