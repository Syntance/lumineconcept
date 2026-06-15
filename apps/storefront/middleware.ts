import { NextResponse, type NextRequest } from "next/server";
import { getModulyConfig() } from "@moduly/magazyn-core/config";

/**
 * Ochrona panelu „magazyn".
 *
 * Tania bramka na krawędzi: blokuje wejście do `/magazyn/panel/**` bez cookie
 * sesji. To NIE jest pełna walidacja JWT — ważność tokenu i allowlistę e-maili
 * weryfikujemy server-side (`loadAdmin`, `requireAdminSession`, `loginEmailAction`).
 * Tu chodzi o to, by niezalogowany użytkownik nie dostał nawet shellu panelu.
 *
 * Matcher musi być literałem statycznym (wymóg Next.js) — trzymamy go zsynchronizowany
 * z `getModulyConfig().basePath` (`/magazyn`).
 */
const SESSION_COOKIE = getModulyConfig().auth.cookieName;
const PANEL_PREFIX = `${getModulyConfig().basePath}/panel`;

export function middleware(request: NextRequest): NextResponse {
	const { pathname } = request.nextUrl;

	const isPanel = pathname === PANEL_PREFIX || pathname.startsWith(`${PANEL_PREFIX}/`);
	if (!isPanel) return NextResponse.next();

	const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
	if (hasSession) return NextResponse.next();

	const loginUrl = new URL(getModulyConfig().basePath, request.url);
	loginUrl.searchParams.set("redirect", pathname);
	return NextResponse.redirect(loginUrl);
}

export const config = {
	matcher: ["/magazyn/panel/:path*"],
};
