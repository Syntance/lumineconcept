import { NextResponse } from "next/server";
import { z } from "zod";
import { formatPrice } from "@magazyn/core/lib/format";
import type { OrderRenderSource } from "@magazyn/modules/emails/render-template";
import { sendPaymentFailedEmail } from "@magazyn/modules/emails/send-payment-failed-email";
import { getCart, updateCartMetadata } from "@/lib/medusa/cart";

export const maxDuration = 30;

const EMAIL_SENT_KEY = "email_sent_payment-failed";

const bodySchema = z.object({
	cart_id: z.string().min(1),
	retry_url: z.string().url(),
});

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

/** Wysyłka maila o nieudanej płatności P24 — szablon `payment_failed` z magazynu. */
export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
	}

	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
	}

	const { cart_id: cartId, retry_url: retryUrl } = parsed.data;

	const cart = await getCart(cartId).catch(() => null);
	if (!cart) {
		return NextResponse.json({ ok: false, error: "cart_not_found" }, { status: 404 });
	}

	const metadata = (cart.metadata ?? {}) as Record<string, string>;
	if (metadata[EMAIL_SENT_KEY]?.trim()) {
		return NextResponse.json({ ok: true, skipped: true, source: "magazyn" });
	}

	const source = cartToEmailSource(cart);
	if (!source?.email) {
		return NextResponse.json({ ok: false, error: "no_email" }, { status: 422 });
	}

	const result = await sendPaymentFailedEmail(
		source,
		retryUrl,
		cartReference(cartId),
	);
	if (!result.ok) {
		return NextResponse.json(
			{ ok: false, step: "resend", message: result.message },
			{ status: 502 },
		);
	}
	if (result.skipped) {
		return NextResponse.json({ ok: true, skipped: true, source: "magazyn" });
	}

	void updateCartMetadata(cartId, { [EMAIL_SENT_KEY]: new Date().toISOString() });

	return NextResponse.json({ ok: true, source: "magazyn" });
}
