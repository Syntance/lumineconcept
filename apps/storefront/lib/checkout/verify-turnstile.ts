import { resolveMedusaFetchBase } from "@/lib/medusa/resolve-fetch-base";

const RETRY_DELAYS_MS = [0, 500, 1000];

/**
 * Weryfikacja tokenu Turnstile z 1 retry (exponential backoff).
 * Używa proxy `/api/medusa` — ten sam origin co reszta Store API.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const base = resolveMedusaFetchBase();

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    const delay = RETRY_DELAYS_MS[attempt] ?? 0;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const res = await fetch(`${base}/store/custom/verify-turnstile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) continue;

      const data = (await res.json()) as { success?: boolean };
      if (data.success) return true;
    } catch {
      /* retry na kolejnej próbie */
    }
  }

  return false;
}
