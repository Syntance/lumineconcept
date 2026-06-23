import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { hasValidInternalSecret } from "../../../../lib/internal-auth";
import { backfillAllP24PaymentDetails } from "../../../../lib/order-p24-metadata";

type Body = {
  force?: boolean;
  limit?: number;
};

/**
 * POST /store/custom/backfill-p24-methods
 *
 * Uzupełnia metadata zamówień P24 (BLIK, bank…). Server-to-server, sekret
 * `x-order-email-secret`. Wołane ręcznie lub z crona po deployu.
 */
export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  if (!hasValidInternalSecret(req)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const body = (req.body ?? {}) as Body;
  const force = body.force === true;
  const limit =
    typeof body.limit === "number" && Number.isFinite(body.limit)
      ? body.limit
      : undefined;

  try {
    const stats = await backfillAllP24PaymentDetails(req.scope, { force, limit });
    return res.status(200).json({ ok: true, ...stats });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : "backfill failed",
    });
  }
}
