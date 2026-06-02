import { type NextRequest, NextResponse } from "next/server";
import { magazynConfig } from "../../magazyn.config";
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
	const loginUrl = new URL(magazynConfig.basePath, origin);
	const dashboardUrl = new URL(`${magazynConfig.basePath}/panel`, origin);

	const directToken = searchParams.get("token");
	if (directToken) {
		await setSessionToken(directToken);
		return NextResponse.redirect(dashboardUrl);
	}

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
