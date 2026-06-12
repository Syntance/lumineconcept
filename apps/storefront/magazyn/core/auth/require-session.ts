import "server-only";
import { adminFetch } from "../medusa/client";
import { AdminUnauthorizedError } from "../medusa/errors";
import { isAdminEmailAllowed } from "./allowlist";

/**
 * Twardo weryfikuje, że bieżąca sesja panelu jest WAŻNA (nie tylko obecne cookie)
 * ORAZ że e-mail administratora jest na allowliście (`MAGAZYN_ADMIN_ALLOWLIST`).
 *
 * Lekki call do Admin API `/admin/users/me`:
 *   - brak tokenu / wygasły JWT → `AdminUnauthorizedError`,
 *   - konto spoza allowlisty → `AdminUnauthorizedError`,
 *   - sukces → `void`.
 *
 * Błąd jest łapany przez `handleError`/`catch` akcji → redirect na login.
 * Używane w Server Actions, które wykonują uprzywilejowane operacje POZA
 * `adminFetch` (upload do R2, wysyłka maila przez Resend) i bez tego byłyby
 * wywoływalne bez ważnej sesji administratora.
 */
export async function requireAdminSession(): Promise<void> {
	const data = await adminFetch<{ user?: { email?: string } }>(
		"/admin/users/me?fields=id,email",
	);
	if (!isAdminEmailAllowed(data?.user?.email)) {
		throw new AdminUnauthorizedError("Konto nie ma dostępu do panelu.");
	}
}
