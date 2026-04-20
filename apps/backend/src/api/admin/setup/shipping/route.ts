import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ensureLumineShipping } from "../../../../lib/ensure-lumine-shipping";

const HEADER = "x-lumine-setup-secret";

/**
 * POST /admin/setup/shipping — jednorazowy bootstrap dostawy (DPD w checkoutcie).
 * Wymaga nagłówka zgodnego z LUMINE_SETUP_SECRET (ustaw w .env na Railway).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const expected = process.env.LUMINE_SETUP_SECRET;
  if (!expected || expected.length < 8) {
    return res.status(503).json({
      message:
        "LUMINE_SETUP_SECRET nie jest ustawiony lub jest za krótki (min. 8 znaków). Użyj lokalnie: pnpm --filter @lumine/backend setup-shipping",
    });
  }

  const provided =
    (typeof req.headers[HEADER] === "string" && req.headers[HEADER]) ||
    (typeof req.headers.authorization === "string" &&
      req.headers.authorization.replace(/^Bearer\s+/i, "")) ||
    "";

  if (provided !== expected) {
    return res.status(401).json({ message: "Nieprawidłowy sekret setupu." });
  }

  const result = await ensureLumineShipping(req.scope);
  const status = result.ok ? 200 : 422;
  return res.status(status).json(result);
}
