import { NextResponse } from "next/server";

export const maxDuration = 15;
export const dynamic = "force-dynamic";

/**
 * Weryfikacja Turnstile po stronie storefrontu (Vercel).
 * Site Key + Secret Key trzymamy razem na Vercel — bez polegania na Railway.
 */
export async function POST(request: Request) {
  let token: string | undefined;
  try {
    const body = (await request.json()) as { token?: string };
    token = body.token?.trim();
  } catch {
    return NextResponse.json({ success: false, message: "invalid_json" }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ success: false, message: "Token wymagany" }, { status: 400 });
  }

  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    console.error("[Turnstile] Brak CLOUDFLARE_TURNSTILE_SECRET_KEY na storefront");
    return NextResponse.json({ success: false, message: "Błąd konfiguracji" }, { status: 500 });
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  if (ip) formData.append("remoteip", ip);

  try {
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await result.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (json.success) {
      return NextResponse.json({ success: true });
    }

    console.warn("[Turnstile] Weryfikacja failed:", json["error-codes"]);
    return NextResponse.json(
      { success: false, errors: json["error-codes"] },
      { status: 400 },
    );
  } catch (error: unknown) {
    console.error(
      "[Turnstile] Błąd API:",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json({ success: false, message: "Błąd weryfikacji" }, { status: 500 });
  }
}
