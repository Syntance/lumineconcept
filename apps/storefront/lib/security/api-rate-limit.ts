import "server-only";

/**
 * Rate-limit publicznych route handlerów storefrontu (anti-abuse).
 *
 * Upstash Redis REST bez SDK (czysty fetch) — spójnie z `login-rate-limit`,
 * bez dokładania zależności. Fixed-window per IP. Fail-open: brak konfiguracji
 * Upstash lub błąd sieci → przepuszczamy (nie blokujemy checkoutu przez infra).
 */

export type ApiRateLimitOptions = {
	/** Prefiks kubełka (oddziela budżety per endpoint). */
	prefix: string;
	/** Maks. liczba żądań na okno. */
	limit: number;
	/** Długość okna w sekundach. */
	windowSeconds: number;
};

export type ApiRateLimitResult = { ok: boolean; retryAfter?: number };

function clientIp(request: Request): string {
	const xff = request.headers.get("x-forwarded-for");
	return (
		xff?.split(",")[0]?.trim() ||
		request.headers.get("x-real-ip")?.trim() ||
		"anonymous"
	);
}

export async function rateLimitApiRequest(
	request: Request,
	options: ApiRateLimitOptions,
): Promise<ApiRateLimitResult> {
	const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
	const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
	if (!url || !token) return { ok: true }; // fail-open — brak Upstash

	const ip = clientIp(request);
	const bucket = Math.floor(Date.now() / 1000 / options.windowSeconds);
	const key = `${options.prefix}:${ip}:${bucket}`;

	try {
		const res = await fetch(`${url}/pipeline`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify([
				["INCR", key],
				["EXPIRE", key, String(options.windowSeconds)],
			]),
			signal: AbortSignal.timeout(3000),
			cache: "no-store",
		});
		if (!res.ok) return { ok: true };
		const data = (await res.json()) as Array<{ result?: number }>;
		const count = Number(data?.[0]?.result ?? 0);
		if (count > options.limit) {
			return { ok: false, retryAfter: options.windowSeconds };
		}
		return { ok: true };
	} catch {
		return { ok: true }; // fail-open
	}
}
