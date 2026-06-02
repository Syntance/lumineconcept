import "server-only";

/**
 * Dostęp do zmiennych środowiskowych po stronie serwera. Lekka warstwa bez
 * dodatkowych zależności — waliduje obecność wymaganych wartości w miejscu użycia.
 *
 * NEXT_PUBLIC_* są wstrzykiwane przez bundler i dostępne również na kliencie.
 */

export const serverEnv = {
	get medusaBackendUrl(): string {
		const url = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
		if (!url) {
			throw new Error("Brak NEXT_PUBLIC_MEDUSA_BACKEND_URL w środowisku (patrz .env.example).");
		}
		return url.replace(/\/$/, "");
	},
	get adminEmail(): string | undefined {
		return process.env.MEDUSA_ADMIN_EMAIL || undefined;
	},
	get adminPassword(): string | undefined {
		return process.env.MEDUSA_ADMIN_PASSWORD || undefined;
	},
	get resendApiKey(): string | undefined {
		return process.env.RESEND_API_KEY || undefined;
	},
	get resendFromEmail(): string | undefined {
		return process.env.RESEND_FROM_EMAIL || undefined;
	},
	get siteUrl(): string {
		return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
	},
};
