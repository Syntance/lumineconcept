import "server-only";
import { headers } from "next/headers";

/**
 * Rate-limit logowania do panelu (brute-force protection).
 *
 * Używa Upstash Redis REST bez SDK (czysty fetch), więc nie dokładamy zależności
 * do storefrontu. Fixed-window per IP. Fail-open: brak konfiguracji Upstash lub
 * błąd sieci → przepuszczamy (nie blokujemy logowania przez infrastrukturę).
 */

const WINDOW_SECONDS = 60;
const MAX_ATTEMPTS = 10;

async function clientIp(): Promise<string> {
	const h = await headers();
	const xff = h.get("x-forwarded-for");
	return xff?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "anonymous";
}

export type LoginRateLimitResult = { ok: boolean; retryAfter?: number };

export async function checkLoginRateLimit(): Promise<LoginRateLimitResult> {
	const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
	const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
	if (!url || !token) return { ok: true }; // fail-open — brak Upstash

	const ip = await clientIp();
	const bucket = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
	const key = `magazyn:login:${ip}:${bucket}`;

	try {
		// Pipeline Upstash REST: INCR + EXPIRE w jednym round-tripie.
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
		if (count > MAX_ATTEMPTS) {
			return { ok: false, retryAfter: WINDOW_SECONDS };
		}
		return { ok: true };
	} catch {
		return { ok: true }; // fail-open
	}
}
