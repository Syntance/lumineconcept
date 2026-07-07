import { NextResponse, type NextRequest } from "next/server";
import { getSessionToken } from "@magazyn/core/medusa/session";
import { themeTokensSchema } from "@/lib/composer/theme";

/**
 * Bramka zapisu tokenów motywu — wymaga sesji admina magazynu.
 * Logika zapisu pozostaje w server action; endpoint służy sondom bezpieczeństwa
 * (401 bez cookie) i ewentualnej integracji zewnętrznej.
 */
export async function POST(req: NextRequest) {
	const token = await getSessionToken();
	if (!token) {
		return NextResponse.json({ message: "Wymagane zalogowanie do panelu magazynu." }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ message: "Nieprawidłowy JSON." }, { status: 400 });
	}

	const parsed = themeTokensSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ message: parsed.error.issues[0]?.message ?? "Błędne tokeny motywu." },
			{ status: 400 },
		);
	}

	return NextResponse.json(
		{ message: "Walidacja OK — użyj saveThemeTokensAction w panelu." },
		{ status: 200 },
	);
}
