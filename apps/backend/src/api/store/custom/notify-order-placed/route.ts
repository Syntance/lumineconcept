import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { IOrderModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { renderOrderPlacedEmail } from "../../../../lib/email-templates";
import {
  buildOrderEmailPayload,
  sendTransactionalEmail,
} from "../../../../lib/send-email";

/**
 * POST /store/custom/notify-order-placed
 *
 * Bezpośrednie wyzwolenie maila „potwierdzenie zamówienia" dla danego
 * `order_id`. Używamy jako awaryjnego kanału obok subscribera `order.placed`
 * (który w obecnej konfiguracji Medusa v2 + local event bus bywa zawodny
 * pod Railway). Storefront odpala ten endpoint zaraz po udanym
 * `completeCart`, więc klient dostaje mail nawet jeśli event bus milczy.
 *
 * Idempotencja: moduł Notification po stronie Medusy ma `idempotency_key =
 * order-placed:<order_id>`, więc wielokrotne wywołanie nie tworzy
 * duplikatów maili.
 *
 * Zabezpieczenia:
 * - wymagany ważny `x-publishable-api-key` (standard store-API)
 * - wymagany `order_id` z poprawnym zamówieniem w bazie
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
      relations: ["items", "shipping_address", "shipping_methods"],
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

  const payload = buildOrderEmailPayload(order);
  const { subject, html, text } = renderOrderPlacedEmail(payload);

  const ok = await sendTransactionalEmail(req.scope, {
    to: email,
    subject,
    html,
    text,
    context: "order-placed",
    orderId,
  });

  return res.status(ok ? 200 : 500).json({ ok, orderId, email });
}
