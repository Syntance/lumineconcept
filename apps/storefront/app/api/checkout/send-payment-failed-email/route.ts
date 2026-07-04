import { NextResponse } from "next/server";
import { z } from "zod";
import { dispatchPaymentFailedEmail } from "@/lib/email/dispatch-payment-failed-email";
import { rateLimitApiRequest } from "@/lib/security/api-rate-limit";

export const maxDuration = 30;

const bodySchema = z.object({
	cart_id: z.string().min(1),
	// `retry_url` bywa jeszcze wysyłane przez starszych klientów — akceptujemy w
	// schemacie, ale IGNORUJEMY. Link budujemy serwerowo z cart_id (anti-phishing).
	retry_url: z.string().optional(),
	p24_session_id: z.string().min(1).optional(),
});

/** Wysyłka maila o nieudanej płatności P24 — fallback z klienta (główna ścieżka: backend). */
export async function POST(request: Request) {
	const limit = await rateLimitApiRequest(request, {
		prefix: "checkout:payment-failed",
		limit: 10,
		windowSeconds: 60,
	});
	if (!limit.ok) {
		return NextResponse.json(
			{ ok: false, error: "rate_limited" },
			{ status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } },
		);
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
