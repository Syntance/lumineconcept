import { getModulyConfig } from "@moduly/magazyn-core/config";
"use server";

import { redirect } from "next/navigation";
import { getModulyConfig() } from "../../magazyn.config";
import { serverEnv } from "../env";
import { AdminApiError, AdminUnauthorizedError } from "../medusa/errors";
import { loginWithEmailPassword } from "../medusa/client";
import { clearSessionToken, setSessionToken } from "../medusa/session";
import { isAdminEmailAllowed } from "./allowlist";
import { checkLoginRateLimit } from "./login-rate-limit";

export type LoginState = { error: string | null };

export async function loginEmailAction(
	_prev: LoginState,
	formData: FormData,
): Promise<LoginState> {
	const email = String(formData.get("email") ?? "").trim();
	const password = String(formData.get("password") ?? "");

	if (!email || !password) return { error: "Podaj email i hasło." };

	// Rate-limit logowania (brute-force) — per IP, fail-open bez Upstash.
	const rl = await checkLoginRateLimit();
	if (!rl.ok) {
		return { error: "Za dużo prób logowania. Odczekaj chwilę i spróbuj ponownie." };
	}

	// Allowlista e-maili (MAGAZYN_ADMIN_ALLOWLIST) — gdy ustawiona, tylko wskazane
	// konta mogą wejść do panelu, nawet z poprawnymi danymi Medusa Admin.
	if (!isAdminEmailAllowed(email)) {
		return { error: "To konto nie ma dostępu do panelu." };
	}

	try {
		const token = await loginWithEmailPassword(email, password);
		await setSessionToken(token);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) return { error: error.message };
		if (error instanceof AdminApiError) return { error: error.message };
		return { error: "Nie udało się połączyć z serwerem. Spróbuj ponownie." };
	}

	redirect(`${getModulyConfig().basePath}/panel`);
}

export async function logoutAction(): Promise<void> {
	await clearSessionToken();
	redirect(getModulyConfig().basePath);
}

/**
 * Start logowania Google przez provider auth w Medusa.
 * Wymaga skonfigurowanego providera google w backendzie. Zwraca błąd gdy niedostępny.
 */
export async function googleStartAction(): Promise<LoginState> {
	const callbackUrl = `${serverEnv.siteUrl}${getModulyConfig().basePath}/auth/google/callback`;

	let location: string | null = null;
	try {
		const res = await fetch(`${serverEnv.medusaBackendUrl}/auth/user/google`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ callback_url: callbackUrl }),
			signal: AbortSignal.timeout(10_000),
		});
		if (res.ok) {
			const data = (await res.json()) as { location?: string };
			location = data.location ?? null;
		}
	} catch {
		location = null;
	}

	if (!location) {
		return { error: "Logowanie Google nie jest skonfigurowane w backendzie. Użyj logowania email." };
	}

	redirect(location);
}
