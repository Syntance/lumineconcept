import { NextResponse } from "next/server";
import { z } from "zod";
import {
	dispatchMagazynOrderEmail,
	type CheckoutOrderSnapshot,
} from "@/lib/email/dispatch-magazyn-order-email";
import type { OrderEmailTemplateType } from "@magazyn/modules/emails/template-types";

export const maxDuration = 30;

const orderEmailTypes = [
	"placed",
	"bank_transfer_pending",
	"shipped",
	"cancelled",
	"confirmation",
] as const satisfies readonly OrderEmailTemplateType[];

const snapshotSchema = z.object({
	email: z.string().email(),
	displayId: z.number().int().positive(),
	total: z.number().nonnegative(),
	itemTotal: z.number().nonnegative().optional(),
	shippingTotal: z.number().nonnegative().optional(),
	currencyCode: z.string().optional(),
	customerName: z.string().optional(),
	address: z.string().optional(),
	phone: z.string().optional(),
	shippingMethodName: z.string().nullable().optional(),
	items: z
		.array(
			z.object({
				title: z.string(),
				quantity: z.number().int().positive(),
				total: z.number().nonnegative(),
				thumbnail: z.string().nullable().optional(),
			}),
		)
		.optional(),
});

const bodySchema = z.object({
	order_id: z.string().min(1),
	type: z.enum(orderEmailTypes),
	snapshot: snapshotSchema.optional(),
	skip_shop_copy: z.boolean().optional(),
});

function internalSecret(): string | undefined {
	return (
		process.env.ORDER_EMAIL_INTERNAL_SECRET?.replace(/\r\n/g, "").trim() ??
		process.env.MEDUSA_REVALIDATE_SECRET?.replace(/\r\n/g, "").trim()
	);
}

/**
 * POST /api/internal/order-email
 *
 * Wysyłka maili zamówieniowych szablonami z magazynu.
 * Wołane z backendu Medusa (subscriber / notify-*).
 */
export async function POST(request: Request) {
	const expected = internalSecret();
	const provided = request.headers.get("x-order-email-secret")?.trim();
	if (!expected || !provided || provided !== expected) {
		return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
	}

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

	const result = await dispatchMagazynOrderEmail({
		orderId: parsed.data.order_id,
		type: parsed.data.type,
		snapshot: parsed.data.snapshot as CheckoutOrderSnapshot | undefined,
		skipShopCopy: parsed.data.skip_shop_copy,
	});

	if (!result.ok) {
		const status =
			result.step === "no-order-source" ? 404 : result.step === "resend" ? 502 : 500;
		return NextResponse.json(result, { status });
	}

	return NextResponse.json(result);
}
