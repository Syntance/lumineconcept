import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import type { IOrderModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import crypto from "node:crypto";

export default async function orderPlacedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService: IOrderModuleService =
    container.resolve(Modules.ORDER);

  const order = await orderService.retrieveOrder(event.data.id, {
    relations: ["items", "items.variant"],
  });

  await sendMetaCAPIEvent(order as any);
  await sendPostHogEvent(order as any);
}

async function sendMetaCAPIEvent(order: any) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) return;

  const hashedEmail = crypto
    .createHash("sha256")
    .update(order.email.toLowerCase().trim())
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

  try {
    await fetch("https://eu.posthog.com/capture/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: posthogKey,
        event: "purchase",
        distinct_id: order.email,
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
