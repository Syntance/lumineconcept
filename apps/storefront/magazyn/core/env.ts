import "server-only";

import { getResendConfig } from "@/lib/resend/config";

/**
 * Dostęp do zmiennych środowiskowych po stronie serwera. Lekka warstwa bez
 * dodatkowych zależności — waliduje obecność wymaganych wartości w miejscu użycia.
 *
 * NEXT_PUBLIC_* są wstrzykiwane przez bundler i dostępne również na kliencie.
 */

export const serverEnv = {
	get medusaBackendUrl(): string {
		const url =
			process.env.MEDUSA_BACKEND_URL?.trim() ||
			process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
		if (!url) {
			throw new Error(
				"Brak MEDUSA_BACKEND_URL / NEXT_PUBLIC_MEDUSA_BACKEND_URL w środowisku (patrz .env.example).",
			);
		}
		return url.replace(/\/$/, "");
	},
	get adminEmail(): string | undefined {
		const raw = process.env.MEDUSA_ADMIN_EMAIL?.trim();
		return raw || undefined;
	},
	get adminPassword(): string | undefined {
		const raw = process.env.MEDUSA_ADMIN_PASSWORD?.trim();
		return raw || undefined;
	},
	get resendApiKey(): string | undefined {
		return getResendConfig().apiKey;
	},
	/** Pełny nagłówek From, np. `Lumine Concept <kontakt@lumineconcept.pl>`. */
	get resendFrom(): string {
		return getResendConfig().from;
	},
	get resendReplyTo(): string {
		return getResendConfig().replyTo;
	},
	get resendConfigured(): boolean {
		return getResendConfig().configured;
	},
	get siteUrl(): string {
		return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
	},
};
