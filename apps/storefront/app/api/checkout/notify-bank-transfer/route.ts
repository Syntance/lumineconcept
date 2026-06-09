import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminOrderForEmail, orderToEmailSource } from "@magazyn/modules/orders/store";
import { sendBankTransferPendingEmail } from "@magazyn/modules/emails/send-bank-transfer-email";
import { SYSTEM_PAYMENT_PROVIDER_ID } from "@/lib/medusa/checkout";
import { primaryPaymentProviderId } from "@magazyn/modules/orders/order-payment-provider";

export const maxDuration = 30;

const bodySchema = z.object({
	order_id: z.string().min(1),
});

/**
 * Fire-and-forget z checkoutu po zamówieniu z przelewem tradycyjnym.
 * Wysyła szablon `bank_transfer_pending` z magazynu (Resend).
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
		return NextResponse.json({ ok: false, error: "missing order_id" }, { status: 400 });
	}

	const order = await getAdminOrderForEmail(parsed.data.order_id);
	if (!order) {
		return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
	}

	if (primaryPaymentProviderId(order) !== SYSTEM_PAYMENT_PROVIDER_ID) {
		return NextResponse.json({ ok: false, error: "not_bank_transfer" }, { status: 422 });
	}

	const result = await sendBankTransferPendingEmail(orderToEmailSource(order));
	if (!result.ok) {
		return NextResponse.json({ ok: false, error: result.message }, { status: 502 });
	}

	return NextResponse.json({ ok: true, skipped: result.skipped ?? false });
}
