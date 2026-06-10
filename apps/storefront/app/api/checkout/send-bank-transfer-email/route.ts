import { NextResponse } from "next/server";
import { z } from "zod";
import { dispatchMagazynOrderEmail } from "@/lib/email/dispatch-magazyn-order-email";
import { SYSTEM_PAYMENT_PROVIDER_ID } from "@/lib/medusa/checkout";

export const maxDuration = 30;

const itemSchema = z.object({
	title: z.string(),
	quantity: z.number().int().positive(),
	total: z.number().nonnegative(),
	thumbnail: z.string().nullable().optional(),
});

const bodySchema = z.object({
	order_id: z.string().min(1),
	email: z.string().email(),
	display_id: z.number().int().positive(),
	total: z.number().nonnegative(),
	item_total: z.number().nonnegative().optional(),
	shipping_total: z.number().nonnegative().optional(),
	currency_code: z.string().default("PLN"),
	customer_name: z.string().optional(),
	address: z.string().optional(),
	phone: z.string().optional(),
	shipping_method_name: z.string().nullable().optional(),
	payment_provider_id: z.string().optional(),
	items: z.array(itemSchema).optional(),
});

/**
 * Wysyłka maila przelewu — szablon `bank_transfer_pending` z magazynu.
 * Wołane z checkoutu po completeCart.
 */
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

	const data = parsed.data;
	if (
		data.payment_provider_id &&
		data.payment_provider_id !== SYSTEM_PAYMENT_PROVIDER_ID
	) {
		return NextResponse.json({ ok: false, error: "not_bank_transfer" }, { status: 422 });
	}

	const result = await dispatchMagazynOrderEmail({
		orderId: data.order_id,
		type: "bank_transfer_pending",
		snapshot: {
			email: data.email,
			displayId: data.display_id,
			total: data.total,
			itemTotal: data.item_total,
			shippingTotal: data.shipping_total,
			currencyCode: data.currency_code,
			customerName: data.customer_name,
			address: data.address,
			phone: data.phone,
			shippingMethodName: data.shipping_method_name,
			items: data.items,
		},
	});

	if (!result.ok) {
		const status = result.step === "no-order-source" ? 404 : 502;
		return NextResponse.json(result, { status });
	}

	return NextResponse.json({
		ok: true,
		skipped: result.skipped ?? false,
		order_id: data.order_id,
		source: "magazyn",
	});
}
