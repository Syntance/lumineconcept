export type TurnstileVerifyResult =
  | { ok: true }
  | { ok: false; reason: "network" | "rejected" | "config" };

/**
 * Weryfikacja tokenu Turnstile — jedna próba (token CF jest jednorazowy).
 * Storefront API na Vercel (site + secret w jednym miejscu).
 */
export async function verifyTurnstileToken(
  token: string,
): Promise<TurnstileVerifyResult> {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

  try {
    const res = await fetch(`${base}/api/checkout/verify-turnstile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = (await res.json()) as { success?: boolean };

    if (res.ok && data.success) {
      return { ok: true };
    }

    if (res.status >= 500) {
      return { ok: false, reason: "config" };
    }

    return { ok: false, reason: "rejected" };
  } catch {
    return { ok: false, reason: "network" };
  }
}
