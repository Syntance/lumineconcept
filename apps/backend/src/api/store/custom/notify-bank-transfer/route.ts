import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { renderBankTransferPendingEmail } from "../../../../lib/email-templates";
import {
  buildOrderEmailPayload,
  retrieveOrderForEmail,
  sendTransactionalEmail,
} from "../../../../lib/send-email";

/**
 * POST /store/custom/notify-bank-transfer
 *
 * Wysyła mail z danymi do przelewu tradycyjnego. Storefront woła po completeCart
 * (przelew tradycyjny). Endpoint nie weryfikuje providera — wołany tylko
 * z checkoutu po wyborze pp_system_default.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as { order_id?: string };
  const orderId =
    body.order_id ?? (req.query.order_id as string | undefined) ?? "";

  if (!orderId) {
    return res.status(400).json({ ok: false, error: "missing order_id" });
  }

  const order = await retrieveOrderForEmail(req.scope, orderId);
  if (!order) {
    return res.status(404).json({
      ok: false,
      step: "retrieve-order",
      error: "order not found",
    });
  }

  const email = (order.email as string | undefined) ?? "";
  if (!email) {
    return res.status(422).json({ ok: false, error: "order has no email" });
  }

  const payload = buildOrderEmailPayload(order);
  const { subject, html, text } = renderBankTransferPendingEmail(payload);

  const ok = await sendTransactionalEmail(req.scope, {
    to: email,
    subject,
    html,
    text,
    context: "bank-transfer-pending",
    orderId,
  });

  return res.status(ok ? 200 : 500).json({ ok, orderId, email });
}
