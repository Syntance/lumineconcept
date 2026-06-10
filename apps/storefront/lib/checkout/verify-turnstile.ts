import { resolveMedusaFetchBase } from "@/lib/medusa/resolve-fetch-base";

export type TurnstileVerifyResult =
  | { ok: true }
  | { ok: false; reason: "network" | "rejected" | "config" };

/**
 * Weryfikacja tokenu Turnstile — jedna próba (token CF jest jednorazowy).
 * Używa proxy `/api/medusa` — ten sam origin co reszta Store API.
 */
export async function verifyTurnstileToken(
  token: string,
): Promise<TurnstileVerifyResult> {
  const base = resolveMedusaFetchBase();

  try {
    const res = await fetch(`${base}/store/custom/verify-turnstile`, {
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
