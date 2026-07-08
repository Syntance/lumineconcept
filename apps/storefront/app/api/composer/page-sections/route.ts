import { NextResponse } from "next/server";
import { requireAdminSession } from "@magazyn/core/auth/require-session";
import { AdminUnauthorizedError } from "@magazyn/core/medusa/errors";

/** Sonda: draft sekcji — tylko z sesją admina (401 bez niej). */
export async function GET() {
	try {
		await requireAdminSession();
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		throw error;
	}
	return NextResponse.json({ ok: true });
}

export async function POST() {
	return GET();
}
