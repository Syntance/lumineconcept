/**
 * Migracja konta admina (lumie → lumine) w produkcyjnej Medusie zakończona.
 * Logujemy się bezpośrednio na adres z ENV bez żadnego mapowania.
 */
export function resolveMedusaAdminEmail(email: string): string {
	return email.trim();
}
