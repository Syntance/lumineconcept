import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { token } = req.body as { token?: string };

  if (!token) {
    return res.status(400).json({ success: false, message: "Token wymagany" });
  }

  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[Turnstile] Brak CLOUDFLARE_TURNSTILE_SECRET_KEY");
    return res.status(500).json({ success: false, message: "Błąd konfiguracji" });
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);

  const xForwardedFor = req.headers["x-forwarded-for"];
  const ip = (typeof xForwardedFor === "string" ? xForwardedFor : xForwardedFor?.[0])?.split(",")[0]?.trim();
  if (ip) formData.append("remoteip", ip);

  try {
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(10_000),
    });
    const json = await result.json() as { success: boolean; "error-codes"?: string[] };

    if (json.success) {
      return res.status(200).json({ success: true });
    } else {
      console.warn("[Turnstile] Weryfikacja failed:", json["error-codes"]);
      return res.status(400).json({ success: false, errors: json["error-codes"] });
    }
  } catch (error: unknown) {
    console.error("[Turnstile] Błąd API:", error instanceof Error ? error.message : String(error));
    return res.status(500).json({ success: false, message: "Błąd weryfikacji" });
  }
}
