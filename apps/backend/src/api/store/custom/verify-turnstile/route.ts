import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { token } = req.body as { token?: string };
  
  if (!token) {
    return res.status(400).json({ success: false, message: "Token wymagany" });
  }

  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secret) {
    req.scope.resolve("logger").error("[Turnstile] Brak CLOUDFLARE_TURNSTILE_SECRET_KEY");
    return res.status(500).json({ success: false, message: "Błąd konfiguracji" });
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) formData.append("remoteip", ip);

  try {
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    const json = await result.json() as { success: boolean; "error-codes"?: string[] };

    if (json.success) {
      return res.status(200).json({ success: true });
    } else {
      req.scope.resolve("logger").warn("[Turnstile] Weryfikacja failed:", json["error-codes"]);
      return res.status(400).json({ success: false, errors: json["error-codes"] });
    }
  } catch (error) {
    req.scope.resolve("logger").error("[Turnstile] Błąd API:", error);
    return res.status(500).json({ success: false, message: "Błąd weryfikacji" });
  }
}
