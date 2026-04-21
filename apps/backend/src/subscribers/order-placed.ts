import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import type { IOrderModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import crypto from "node:crypto";
import { captureError } from "../lib/sentry";
import { renderOrderPlacedEmail } from "../lib/email-templates";
import {
  buildOrderEmailPayload,
  sendTransactionalEmail,
} from "../lib/send-email";

export default async function orderPlacedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  // Diagnostyka: jeśli ten log nie pojawia się na Railway po utworzeniu
  // zamówienia, znaczy że event „order.placed" nie dociera do subscribera
  // (np. build nie dołącza pliku, workerMode pomija subskrybery, event bus
  // nie został podpięty).
  try {
    const logger = container.resolve("logger") as {
      info: (msg: string) => void;
    };
    logger.info(`[order-placed] start id=${event.data.id}`);
  } catch {
    console.info(`[order-placed] start id=${event.data.id}`);
  }

  const orderService: IOrderModuleService =
    container.resolve(Modules.ORDER);

  let order: Awaited<ReturnType<typeof orderService.retrieveOrder>>;
  try {
    order = await orderService.retrieveOrder(event.data.id, {
      relations: [
        "items",
        "items.variant",
        "shipping_address",
        "shipping_methods",
      ],
    });
  } catch (e) {
    console.error("[order-placed] retrieveOrder failed", e);
    captureError(e, {
      subscriber: "order-placed",
      step: "retrieveOrder",
      orderId: event.data.id,
    });
    return;
  }

  // Mail potwierdzający — najważniejsze dla klienta, puszczamy pierwsze.
  if (order?.email) {
    try {
      const payload = buildOrderEmailPayload(
        order as unknown as Record<string, unknown>,
      );
      const { subject, html, text } = renderOrderPlacedEmail(payload);
      await sendTransactionalEmail(container, {
        to: order.email,
        subject,
        html,
        text,
        context: "order-placed",
        orderId: order.id,
      });
    } catch (e) {
      console.error("[order-placed] email render/send failed", e);
      captureError(e, {
        subscriber: "order-placed",
        step: "email",
        orderId: order.id,
      });
    }
  } else {
    console.warn(
      `[order-placed] order ${order?.id} nie ma emaila — pomijam wysyłkę potwierdzenia`,
    );
  }

  // Każdy zewnętrzny sink izolujemy — błąd PostHog nie może zatrzymać Meta
  // CAPI ani zablokować kolejki workera.
  await sendMetaCAPIEvent(order as any).catch((e) => {
    console.error("[order-placed] sendMetaCAPIEvent", e);
    captureError(e, { subscriber: "order-placed", step: "metaCAPI", orderId: order?.id });
  });
  await sendPostHogEvent(order as any).catch((e) => {
    console.error("[order-placed] sendPostHogEvent", e);
    captureError(e, { subscriber: "order-placed", step: "posthog", orderId: order?.id });
  });
}

async function sendMetaCAPIEvent(order: any) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) return;

  // Zamówienie gościnne może nie mieć emaila — bez guarda hash crashuje.
  const email: string | undefined = order?.email;
  if (!email) return;

  const hashedEmail = crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex");

  const eventData = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        user_data: {
          em: [hashedEmail],
        },
        custom_data: {
          currency: order.currency_code.toUpperCase(),
          value: order.total / 100,
          content_ids: order.items.map((i: any) => i.variant.id),
          content_type: "product",
          contents: order.items.map((i: any) => ({
            id: i.variant.id,
            quantity: i.quantity,
            item_price: i.unit_price / 100,
          })),
          num_items: order.items.reduce((sum: number, i: any) => sum + i.quantity, 0),
          order_id: order.id,
        },
      },
    ],
  };

  try {
    await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      },
    );
  } catch (error) {
    console.error("Meta CAPI error:", error);
  }
}

async function sendPostHogEvent(order: any) {
  const posthogKey = process.env.POSTHOG_API_KEY;
  if (!posthogKey) return;

  const distinctId: string = order?.email ?? order?.id ?? "anonymous";

  try {
    await fetch("https://eu.posthog.com/capture/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: posthogKey,
        event: "purchase",
        distinct_id: distinctId,
        properties: {
          order_id: order.id,
          total: order.total / 100,
          currency: order.currency_code,
          items_count: order.items.length,
          items: order.items.map((i: any) => ({
            title: i.title,
            quantity: i.quantity,
            price: i.unit_price / 100,
          })),
        },
      }),
    });
  } catch (error) {
    console.error("PostHog event error:", error);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
