/**
 * Normalizuje URL mediów z Medusa. Względne ścieżki prefiksuje backendem,
 * pełne URL-e zwraca bez zmian. Puste wartości odfiltrowuje.
 */
function backendBase(): string {
	const url = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "";
	return url.replace(/\/$/, "");
}

export function resolveMedusaMediaUrl(url: string | null | undefined): string | null {
	if (!url) return null;
	if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
	const base = backendBase();
	if (!base) return url;
	return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function resolveMedusaMediaUrls(urls: Array<string | null | undefined>): string[] {
	return urls.map((u) => resolveMedusaMediaUrl(u)).filter((u): u is string => Boolean(u));
}
