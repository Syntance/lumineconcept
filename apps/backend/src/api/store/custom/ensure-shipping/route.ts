import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ensureLumineShipping } from "../../../../lib/ensure-lumine-shipping";

/**
 * POST /store/custom/ensure-shipping
 * Idempotentnie tworzy opcję „Kurier DPD” w strefie PL (gdy brak w Adminie).
 * Wyłącz: LUMINE_DISABLE_PUBLIC_ENSURE_SHIPPING=true
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (process.env.LUMINE_DISABLE_PUBLIC_ENSURE_SHIPPING === "true") {
    return res.status(403).json({
      message: "Publiczny bootstrap dostawy jest wyłączony.",
    });
  }

  const result = await ensureLumineShipping(req.scope);
  const status = result.ok ? 200 : 422;
  return res.status(status).json(result);
}
