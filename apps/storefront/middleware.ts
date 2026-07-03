import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
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
const RAW_HIT_TIMEOUT_MS = 3_000;
const STATIC_FILE_EXTENSION = /\.[a-z0-9]+$/i;

function applySecurityHeaders(response: NextResponse, nonce: string): void {
	response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(nonce));
	response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
}

/**
 * Surowy, anonimowy licznik wejść — niezależny od zgody na cookies. Wywoływany
 * dla realnych stron (nie API, nie panelu, nie assetów) na każdy GET, ZANIM
 * baner cookies w ogóle się załaduje po stronie klienta. Fire-and-forget przez
 * `event.waitUntil` — nigdy nie opóźnia ani nie blokuje odpowiedzi strony.
 */
function isTrackablePageRequest(request: NextRequest): boolean {
	if (request.method !== "GET") return false;
	const { pathname } = request.nextUrl;
	if (pathname.startsWith(magazynConfig.basePath)) return false;
	if (pathname.startsWith("/api/")) return false;
	if (pathname.startsWith("/ingest")) return false;
	if (STATIC_FILE_EXTENSION.test(pathname)) return false;
	return true;
}

async function recordRawHit(request: NextRequest): Promise<void> {
	// Admin/właściciel zalogowany w panelu w tej samej przeglądarce — nie licz jego wejść.
	if (request.cookies.get(SESSION_COOKIE)?.value) return;

	const backendUrl =
		process.env.MEDUSA_BACKEND_URL?.trim() || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.trim();
	const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.trim();
	if (!backendUrl || !publishableKey) return;

	try {
		await fetch(`${backendUrl}/store/custom/track-hit`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-publishable-api-key": publishableKey,
				"x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
			},
			body: JSON.stringify({ path: request.nextUrl.pathname }),
			signal: AbortSignal.timeout(RAW_HIT_TIMEOUT_MS),
		});
	} catch {
		// Best-effort — licznik nigdy nie może wpłynąć na ładowanie strony.
	}
}

export function middleware(request: NextRequest, event: NextFetchEvent): NextResponse {
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

	if (isTrackablePageRequest(request)) {
		event.waitUntil(recordRawHit(request));
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
