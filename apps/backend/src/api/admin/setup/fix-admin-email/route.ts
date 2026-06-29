import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ADMIN_EMAIL_FIX, fixAdminEmail } from "../../../../lib/fix-admin-email";

const HEADER = "x-lumine-setup-secret";

/**
 * POST /admin/setup/fix-admin-email — korekta emaila admina (lumie → lumine).
 *
 * Autoryzacja (jedna z):
 * - Bearer JWT admina (zalogowany użytkownik z błędnym lub poprawnym emailem),
 * - Bearer JWT + body.recovery=true (gdy auth jest na lumine, ale brak powiązania z userem),
 * - nagłówek x-lumine-setup-secret = LUMINE_SETUP_SECRET (opcjonalnie na Railway).
 *
 * Body (opcjonalnie): { "dryRun": true, "recovery": true }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
	const body =
		req.body && typeof req.body === "object" && !Array.isArray(req.body)
			? (req.body as { dryRun?: boolean; recovery?: boolean })
			: {};
	const dryRun = body.dryRun === true;
	const recovery = body.recovery === true;

	const expected = process.env.LUMINE_SETUP_SECRET;
	const providedSecret =
		typeof req.headers[HEADER] === "string" ? req.headers[HEADER] : "";

	const secretOk = Boolean(expected && expected.length >= 8 && providedSecret === expected);

	const bearer =
		typeof req.headers.authorization === "string"
			? req.headers.authorization.replace(/^Bearer\s+/i, "").trim()
			: "";

	let adminOk = false;
	if (bearer) {
		try {
			const backendUrl =
				process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, "") ??
				`${req.protocol}://${req.get("host")}`;
			const meRes = await fetch(`${backendUrl}/admin/users/me?fields=id,email`, {
				headers: { Authorization: `Bearer ${bearer}` },
				signal: AbortSignal.timeout(10_000),
			});
			if (meRes.ok) {
				const meData = (await meRes.json()) as { user?: { email?: string } };
				const email = meData.user?.email?.trim().toLowerCase() ?? "";
				adminOk =
					email === ADMIN_EMAIL_FIX.oldEmail.toLowerCase() ||
					email === ADMIN_EMAIL_FIX.newEmail.toLowerCase();
			}
		} catch {
			adminOk = false;
		}
	}

	if (!secretOk && !adminOk && !(recovery && bearer)) {
		return res.status(401).json({
			message: "Wymagany token admina (Bearer), recovery=true lub x-lumine-setup-secret.",
		});
	}

	try {
		const result = await fixAdminEmail(req.scope, { dryRun, recovery });
		return res.status(result.ok ? 200 : 422).json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Nie udało się zmienić emaila admina.";
		return res.status(422).json({ ok: false, message });
	}
}

export const AUTHENTICATE = false;
