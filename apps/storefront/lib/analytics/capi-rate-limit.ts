import "server-only";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 20;

export type CapiRateLimitResult = { ok: boolean; retryAfter?: number };

/**
 * Rate limit /api/capi — 20 req/min/IP (Upstash REST, fail-open bez konfiguracji).
 */
export async function checkCapiRateLimit(ip: string): Promise<CapiRateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return { ok: true };

  const bucket = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
  const key = `capi:browser:${ip}:${bucket}`;

  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(WINDOW_SECONDS)],
      ]),
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) return { ok: true };

    const data = (await res.json()) as Array<{ result?: number }>;
    const count = Number(data?.[0]?.result ?? 0);
    if (count > MAX_REQUESTS) {
      return { ok: false, retryAfter: WINDOW_SECONDS };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
