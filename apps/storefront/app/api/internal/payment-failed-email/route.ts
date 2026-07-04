import { NextResponse } from "next/server";
import { z } from "zod";
import { dispatchPaymentFailedEmail } from "@/lib/email/dispatch-payment-failed-email";

export const maxDuration = 30;

const bodySchema = z.object({
	cart_id: z.string().min(1),
	p24_session_id: z.string().min(1).optional(),
});

function internalSecret(): string | undefined {
	return (
		process.env.ORDER_EMAIL_INTERNAL_SECRET?.replace(/\r\n/g, "").trim() ??
		process.env.MEDUSA_REVALIDATE_SECRET?.replace(/\r\n/g, "").trim()
	);
}

/**
 * POST /api/internal/payment-failed-email
 *
 * Wysyłka maila o nieudanej płatności P24 — wołane z backendu Medusa.
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

	const result = await dispatchPaymentFailedEmail({
		cartId: parsed.data.cart_id,
		p24SessionId: parsed.data.p24_session_id,
	});

	if (!result.ok) {
		const status =
			result.step === "cart_not_found"
				? 404
				: result.step === "no_email"
					? 422
					: result.step === "resend"
						? 502
						: 500;
		return NextResponse.json(result, { status });
	}

	return NextResponse.json(result);
}
