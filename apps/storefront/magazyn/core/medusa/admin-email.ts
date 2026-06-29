/** Normalizuje email admina przed logowaniem do Medusa. */
export function resolveMedusaAdminEmail(email: string): string {
	return email.trim();
}
