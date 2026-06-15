import { NextResponse } from "next/server";
import { getModulyConfig() } from "@moduly/magazyn-core/config";

/**
 * Alias logowania pod `${basePath}/login`.
 *
 * Kanoniczny ekran logowania to `/magazyn` (patrz `app/magazyn/page.tsx`).
 * Server Actions oraz `loadAdmin` przekierowują na `${basePath}/login` przy
 * wygaśnięciu/utracie sesji — wcześniej ta trasa nie istniała (404).
 *
 * Route handler (a nie strona) jest tu celowy: czyścimy potencjalnie nieważne
 * cookie sesji i wracamy na ekran logowania. Dzięki temu unikamy pętli
 * redirectów w sytuacji „cookie obecne, ale JWT wygasły" (middleware przepuszcza
 * po obecności cookie → strona panelu dostaje 401 → znów redirect na login).
 */
export function GET(request: Request): NextResponse {
	const response = NextResponse.redirect(
		new URL(getModulyConfig().basePath, request.url),
	);
	response.cookies.delete(getModulyConfig().auth.cookieName);
	return response;
}
