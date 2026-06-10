import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { IOrderModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { renderBankTransferPendingEmail } from "../../../../lib/email-templates";
import { orderAwaitingBankTransfer } from "../../../../lib/order-payment-method";
import {
  buildOrderEmailPayload,
  sendTransactionalEmail,
} from "../../../../lib/send-email";

/**
 * POST /store/custom/notify-bank-transfer
 *
 * Wysyła mail z danymi do przelewu tradycyjnego. Storefront woła
 * fire-and-forget po completeCart (przelew tradycyjny). Idempotency:
 * `bank-transfer-pending:<order_id>`.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as { order_id?: string };
  const orderId =
    body.order_id ?? (req.query.order_id as string | undefined) ?? "";

  if (!orderId) {
    return res.status(400).json({ ok: false, error: "missing order_id" });
  }

  let orderService: IOrderModuleService;
  try {
    orderService = req.scope.resolve(Modules.ORDER);
  } catch (e) {
    return res.status(500).json({
      ok: false,
      step: "resolve-order",
      error: e instanceof Error ? e.message : String(e),
    });
  }

  let order: Record<string, unknown>;
  try {
    order = (await orderService.retrieveOrder(orderId, {
      relations: [
        "items",
        "shipping_address",
        "shipping_methods",
        "payment_collections",
        "payment_collections.payments",
      ],
    })) as unknown as Record<string, unknown>;
  } catch (e) {
    return res.status(404).json({
      ok: false,
      step: "retrieve-order",
      error: e instanceof Error ? e.message : String(e),
    });
  }

  const email = (order.email as string | undefined) ?? "";
  if (!email) {
    return res.status(422).json({ ok: false, error: "order has no email" });
  }

  if (!orderAwaitingBankTransfer(order as Parameters<typeof orderAwaitingBankTransfer>[0])) {
    return res.status(422).json({ ok: false, error: "not_bank_transfer" });
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
