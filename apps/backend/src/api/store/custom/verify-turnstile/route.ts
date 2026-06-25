import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

type Body = { token?: string };

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * POST /store/custom/verify-turnstile
 *
 * Backendowa walidacja tokenu Cloudflare Turnstile. Captcha jest OPCJONALNA:
 * gdy brak `TURNSTILE_SECRET_KEY`, endpoint zwraca `ok: true` (no-op), żeby
 * checkout nigdy nie wywrócił się o niewłączoną captchę. Włącz dopiero przy
 * realnym abuse — rate-limit per IP jest pierwszą linią obrony.
 */
export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return res.status(200).json({ ok: true, skipped: "disabled" });
  }

  const token = (req.body ?? {}).token?.trim();
  if (!token) {
    return res.status(400).json({ ok: false, error: "missing token" });
  }

  const remoteip =
    (req.headers["x-real-ip"] as string | undefined) ??
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();

  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    if (remoteip) form.set("remoteip", remoteip);

    const verifyRes = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(10_000),
    });

    const data = (await verifyRes.json()) as { success?: boolean };
    if (data.success === true) {
      return res.status(200).json({ ok: true });
    }
    return res.status(403).json({ ok: false, error: "verification failed" });
  } catch {
    // Cloudflare niedostępne → nie blokuj zakupu (fail-open dla konwersji).
    return res.status(200).json({ ok: true, skipped: "verify-unavailable" });
  }
}
