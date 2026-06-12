import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { hasValidInternalSecret } from "../../../../lib/internal-auth";
import { wipeAllOrders } from "../../../../lib/wipe-all-orders";

/**
 * POST /store/custom/wipe-orders — hard delete wszystkich zamówień (maintenance).
 * Nagłówek: x-order-email-secret = MEDUSA_REVALIDATE_SECRET lub ORDER_EMAIL_INTERNAL_SECRET.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!hasValidInternalSecret(req)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const result = await wipeAllOrders(req.scope);
  const status = result.ok ? 200 : 207;
  return res.status(status).json(result);
}
