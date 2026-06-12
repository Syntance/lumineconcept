import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { hasValidInternalSecret } from "../../../../lib/internal-auth";
import { resetOrderDisplayIdSequence } from "../../../../lib/reset-order-display-sequence";

/**
 * POST /store/custom/reset-order-sequence — następne zamówienie = #1.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!hasValidInternalSecret(req)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const result = await resetOrderDisplayIdSequence(req.scope);
  return res.status(200).json(result);
}
