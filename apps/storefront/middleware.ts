import { NextResponse, type NextRequest } from "next/server";
import { magazynConfig } from "@magazyn/magazyn.config";
import { buildContentSecurityPolicy } from "@/lib/security/csp";

/**
 * Ochrona panelu „magazyn" + nagłówki bezpieczeństwa (CSP nonce, COOP) dla całego storefrontu.
 *
 * CSP: nonce per request → Next.js automatycznie aplikuje na inline scripts (x-nonce).
 * COOP: same-origin (Lighthouse Best Practices).
 */
const SESSION_COOKIE = magazynConfig.auth.cookieName;
const PANEL_PREFIX = `${magazynConfig.basePath}/panel`;

function applySecurityHeaders(response: NextResponse, nonce: string): void {
	response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(nonce));
	response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
}

export function middleware(request: NextRequest): NextResponse {
	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-nonce", nonce);

	const { pathname } = request.nextUrl;

	const isPanel = pathname === PANEL_PREFIX || pathname.startsWith(`${PANEL_PREFIX}/`);
	if (isPanel) {
		const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
		if (!hasSession) {
			const loginUrl = new URL(magazynConfig.basePath, request.url);
			loginUrl.searchParams.set("redirect", pathname);
			const redirect = NextResponse.redirect(loginUrl);
			applySecurityHeaders(redirect, nonce);
			return redirect;
		}
	}

	const response = NextResponse.next({ request: { headers: requestHeaders } });
	applySecurityHeaders(response, nonce);
	return response;
}

export const config = {
	matcher: [
		{
			source: "/((?!_next/static|_next/image|favicon.ico|images/cms/).*)",
			missing: [
				{ type: "header", key: "next-router-prefetch" },
				{ type: "header", key: "purpose", value: "prefetch" },
			],
		},
	],
};
