import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import type {
  IOrderModuleService,
  MedusaContainer,
} from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { captureError } from "../lib/sentry";
import { renderOrderShippedEmail } from "../lib/email-templates";
import {
  buildOrderEmailPayload,
  sendTransactionalEmail,
} from "../lib/send-email";

type ShipmentEventData = {
  order_id?: string;
  id?: string;
  tracking_numbers?: string[];
  labels?: Array<{ tracking_number?: string; tracking_url?: string }>;
};

/**
 * Mail wysyłany gdy Medusa stworzy shipment dla zamówienia (zmiana statusu na
 * "wysłane"). Event: `shipment.created` przychodzi z Order modułu i zawiera
 * ID zamówienia oraz ID fulfillmentu.
 *
 * W Medusa v2 nie każda wersja emituje `shipment.created` tą samą nazwą —
 * próbujemy obu popularnych wariantów. Duplikat jest zabezpieczony przez
 * `idempotency_key` w naszym mailerze (po orderId + event name).
 */
async function sendShipmentEmail(
  container: MedusaContainer,
  orderId: string,
  fulfillmentData?: ShipmentEventData,
) {
  const orderService: IOrderModuleService = container.resolve(Modules.ORDER);

  let order: Awaited<ReturnType<typeof orderService.retrieveOrder>>;
  try {
    order = await orderService.retrieveOrder(orderId, {
      relations: [
        "items",
        "shipping_address",
        "shipping_methods",
      ],
    });
  } catch (e) {
    console.error("[shipment] retrieveOrder failed", e);
    captureError(e, { subscriber: "shipment", step: "retrieveOrder", orderId });
    return;
  }

  if (!order?.email) {
    console.warn(`[shipment] order ${orderId} bez emaila — pomijam`);
    return;
  }

  const trackingNumber =
    fulfillmentData?.tracking_numbers?.[0] ??
    fulfillmentData?.labels?.[0]?.tracking_number ??
    null;
  const trackingUrl = fulfillmentData?.labels?.[0]?.tracking_url ?? null;

  const payload = buildOrderEmailPayload(
    order as unknown as Record<string, unknown>,
    { trackingNumber, trackingUrl },
  );
  const { subject, html, text } = renderOrderShippedEmail(payload);

  await sendTransactionalEmail(container, {
    to: order.email,
    subject,
    html,
    text,
    context: "order-shipped",
    orderId: order.id,
  });
}

export default async function orderShippedHandler({
  event,
  container,
}: SubscriberArgs<ShipmentEventData>) {
  const orderId = event.data.order_id ?? event.data.id;
  if (!orderId) {
    console.warn("[shipment] brak order_id w evencie", event.data);
    return;
  }
  await sendShipmentEmail(container, orderId, event.data);
}

export const config: SubscriberConfig = {
  event: ["shipment.created", "order.shipment_created"],
};
