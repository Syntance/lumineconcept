import "server-only";

import { Resend } from "resend";
import { getResendConfig } from "@/lib/resend/config";

const RESEND_TIMEOUT_MS = 10_000;

export type SendEmailInput = { to: string; subject: string; text: string; html: string };

export type SendEmailResult = { ok: true; skipped?: boolean } | { ok: false; message: string };

/**
 * Wysyłka maila transakcyjnego przez Resend.
 * Bez RESEND_API_KEY zwraca { ok: true, skipped: true } — wygodne w dev/CI.
 */
export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
	const { apiKey, from, replyTo, configured } = getResendConfig();
	if (!configured || !apiKey) return { ok: true, skipped: true };
	if (!input.to.trim()) return { ok: true, skipped: true };

	const resend = new Resend(apiKey);
	const sendPromise = resend.emails.send({
		from,
		to: [input.to.trim()],
		replyTo,
		subject: input.subject,
		text: input.text,
		html: input.html,
	});

	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => reject(new Error("Resend timeout")), RESEND_TIMEOUT_MS);
	});

	try {
		const { data, error } = await Promise.race([sendPromise, timeoutPromise]);
		if (error || !data?.id) {
			const detail = error?.message?.trim();
			return {
				ok: false,
				message: detail
					? `Resend: ${detail}`
					: "Nie udało się wysłać wiadomości e-mail.",
			};
		}
		return { ok: true };
	} catch {
		return { ok: false, message: "Przekroczono czas oczekiwania na wysyłkę e-maila." };
	} finally {
		if (timeoutId !== undefined) clearTimeout(timeoutId);
	}
}
