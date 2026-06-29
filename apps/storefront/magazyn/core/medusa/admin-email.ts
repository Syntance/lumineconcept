/**
 * Konto admina w produkcyjnej Medusie zostało utworzone z literówką (lumie).
 * Do czasu migracji w bazie akceptujemy poprawny adres i logujemy na istniejące konto.
 */
export function resolveMedusaAdminEmail(email: string): string {
	const normalized = email.trim().toLowerCase();
	if (normalized === "lumine.strona@gmail.com") {
		return "lumie.strona@gmail.com";
	}
	return email.trim();
}
