import { getModulyConfig } from "@moduly/magazyn-core/config";
import { type NextRequest, NextResponse } from "next/server";
import { getModulyConfig() } from "../../magazyn.config";
import { clearSessionToken } from "../medusa/session";

/**
 * Czyści sesję i wraca na login. Re-eksportuj w `app{basePath}/auth/logout/route.ts`:
 *   export { GET } from "@magazyn/core/auth/logout-route";
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
	await clearSessionToken();
	return NextResponse.redirect(new URL(`${getModulyConfig().basePath}/login`, request.nextUrl.origin));
}
