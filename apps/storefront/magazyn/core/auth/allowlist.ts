import "server-only";

/**
 * Lista dozwolonych e-maili administratorów panelu (CSV w ENV
 * `MAGAZYN_ADMIN_ALLOWLIST`, np. "a@firma.pl,b@firma.pl").
 *
 * Pusta / nieustawiona = brak ograniczenia (zachowanie wsteczne — nie blokujemy
 * jedynego admina, gdy ktoś zapomni skonfigurować zmienną).
 */
export function getAdminAllowlist(): string[] {
	const raw = process.env.MAGAZYN_ADMIN_ALLOWLIST?.trim();
	if (!raw) return [];
	return raw
		.split(",")
		.map((entry) => entry.trim().toLowerCase())
		.filter(Boolean);
}

/**
 * Czy dany e-mail może korzystać z panelu „magazyn".
 *
 * - allowlista pusta → `true` (brak ograniczenia),
 * - allowlista ustawiona → tylko wymienione adresy.
 */
export function isAdminEmailAllowed(email: string | null | undefined): boolean {
	const allow = getAdminAllowlist();
	if (allow.length === 0) return true;
	if (!email) return false;
	return allow.includes(email.trim().toLowerCase());
}
