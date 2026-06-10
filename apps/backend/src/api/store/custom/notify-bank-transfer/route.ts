import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { dispatchBankTransferPendingEmail } from "../../../../lib/order-email-dispatch";

type Body = {
  order_id?: string;
  email?: string;
  payment_provider_id?: string;
};

/**
 * POST /store/custom/notify-bank-transfer
 *
 * Wysyła mail z danymi do przelewu tradycyjnego. Storefront woła po completeCart.
 * Akceptuje `email` z checkoutu jako fallback, gdy Medusa jeszcze nie ma go na order.
 */
export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const body = (req.body ?? {}) as Body;
  const orderId =
    body.order_id?.trim() ??
    (req.query.order_id as string | undefined)?.trim() ??
    "";

  if (!orderId) {
    return res.status(400).json({ ok: false, error: "missing order_id" });
  }

  const result = await dispatchBankTransferPendingEmail(req.scope, {
    orderId,
    fallbackEmail: body.email,
    paymentProviderId: body.payment_provider_id,
  });

  if (result.step === "retrieve-order") {
    return res.status(404).json({
      ok: false,
      step: "retrieve-order",
      error: "order not found",
    });
  }
  if (result.step === "no-email") {
    return res.status(422).json({ ok: false, error: "order has no email" });
  }
  if (!result.ok) {
    return res.status(500).json({
      ok: false,
      step: result.step ?? "send",
      orderId,
      email: result.email,
    });
  }

  return res.status(200).json({
    ok: true,
    orderId,
    email: result.email,
    step: result.step,
  });
}
