import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import type { IOrderModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { captureError } from "../lib/sentry";
import { renderOrderCanceledEmail } from "../lib/email-templates";
import {
  buildOrderEmailPayload,
  sendTransactionalEmail,
} from "../lib/send-email";

export default async function orderCanceledHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService: IOrderModuleService = container.resolve(Modules.ORDER);

  let order: Awaited<ReturnType<typeof orderService.retrieveOrder>>;
  try {
    order = await orderService.retrieveOrder(event.data.id, {
      relations: ["items", "shipping_address", "shipping_methods"],
    });
  } catch (e) {
    console.error("[order-canceled] retrieveOrder failed", e);
    captureError(e, {
      subscriber: "order-canceled",
      step: "retrieveOrder",
      orderId: event.data.id,
    });
    return;
  }

  if (!order?.email) {
    console.warn(`[order-canceled] order ${order?.id} bez emaila — pomijam`);
    return;
  }

  const payload = buildOrderEmailPayload(
    order as unknown as Record<string, unknown>,
  );
  const { subject, html, text } = renderOrderCanceledEmail(payload);

  await sendTransactionalEmail(container, {
    to: order.email,
    subject,
    html,
    text,
    context: "order-canceled",
    orderId: order.id,
  });
}

export const config: SubscriberConfig = {
  event: ["order.canceled", "order.cancelled"],
};
