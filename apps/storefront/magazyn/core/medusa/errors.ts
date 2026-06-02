/** Brak / wygasła sesja — strona ma przekierować na ekran logowania. */
export class AdminUnauthorizedError extends Error {
	constructor(message = "Sesja wygasła. Zaloguj się ponownie.") {
		super(message);
		this.name = "AdminUnauthorizedError";
	}
}

/** Błąd zwrócony przez Medusa Admin API (z czytelnym komunikatem gdy się da). */
export class AdminApiError extends Error {
	readonly status: number;
	constructor(message: string, status: number) {
		super(message);
		this.name = "AdminApiError";
		this.status = status;
	}
}

/** Wyciąga `message` z odpowiedzi błędu API, z bezpiecznym fallbackiem. */
export function extractMessage(raw: string, fallback: string): string {
	try {
		const parsed = JSON.parse(raw) as { message?: string };
		return parsed.message?.trim() || fallback;
	} catch {
		return fallback;
	}
}
