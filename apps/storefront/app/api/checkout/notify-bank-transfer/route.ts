import { NextResponse } from "next/server";
import { z } from "zod";
import { dispatchMagazynOrderEmail } from "@/lib/email/dispatch-magazyn-order-email";
import { SYSTEM_PAYMENT_PROVIDER_ID } from "@/lib/medusa/checkout";

export const maxDuration = 30;

const bodySchema = z.object({
	order_id: z.string().min(1),
});

/**
 * POST /api/checkout/notify-bank-transfer
 *
 * Wysyła szablon `bank_transfer_pending` z magazynu (store.metadata.email_templates).
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

	const result = await dispatchMagazynOrderEmail({
		orderId: parsed.data.order_id,
		type: "bank_transfer_pending",
	});

	if (!result.ok) {
		const status = result.step === "no-order-source" ? 404 : 502;
		return NextResponse.json(result, { status });
	}

	return NextResponse.json({ ok: true, skipped: result.skipped ?? false, source: "magazyn" });
}
