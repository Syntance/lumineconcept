import { getModulyConfig } from "@moduly/magazyn-core/config";
import { type NextRequest, NextResponse } from "next/server";
import { getModulyConfig() } from "../../magazyn.config";
import { serverEnv } from "../env";
import { setSessionToken } from "../medusa/session";

/**
 * Callback OAuth Google → wymiana code na token Medusa i zapis sesji.
 * Działa po skonfigurowaniu providera google w backendzie Medusa.
 *
 * Re-eksportuj w `app{basePath}/auth/google/callback/route.ts`:
 *   export { GET } from "@magazyn/core/auth/google-callback-route";
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
	const { searchParams, origin } = request.nextUrl;
	const loginUrl = new URL(getModulyConfig().basePath, origin);
	const dashboardUrl = new URL(`${getModulyConfig().basePath}/panel`, origin);

	// SECURITY: NIE akceptujemy tokenu z query (`?token=`). Wcześniej callback
	// zapisywał dowolny token z URL jako sesję bez weryfikacji — to umożliwiało
	// session fixation/podszycie oraz wyciek JWT do historii przeglądarki, logów
	// serwera i nagłówka Referer. Token pozyskujemy WYŁĄCZNIE z wymiany
	// code↔token server-to-server z backendem Medusa (poniżej).
	const query = searchParams.toString();
	if (!query) {
		loginUrl.searchParams.set("error", "google");
		return NextResponse.redirect(loginUrl);
	}

	try {
		const res = await fetch(`${serverEnv.medusaBackendUrl}/auth/user/google/callback?${query}`, {
			method: "GET",
			signal: AbortSignal.timeout(10_000),
		});
		if (res.ok) {
			const data = (await res.json()) as { token?: string };
			if (data.token) {
				await setSessionToken(data.token);
				return NextResponse.redirect(dashboardUrl);
			}
		}
	} catch {
		// fall through to error redirect
	}

	loginUrl.searchParams.set("error", "google");
	return NextResponse.redirect(loginUrl);
}
