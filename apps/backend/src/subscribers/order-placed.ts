import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import crypto from "node:crypto";

interface OrderData {
  id: string;
  email: string;
  total: number;
  currency_code: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    variant: { id: string; title: string };
  }>;
}

export default async function orderPlacedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve("order") as {
    retrieve: (
      id: string,
      config: { relations: string[] },
    ) => Promise<OrderData>;
  };

  const order = await orderService.retrieve(event.data.id, {
    relations: ["items", "items.variant"],
  });

  await sendMetaCAPIEvent(order);
  await sendPostHogEvent(order);
}

async function sendMetaCAPIEvent(order: OrderData) {
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
          content_ids: order.items.map((i) => i.variant.id),
          content_type: "product",
          contents: order.items.map((i) => ({
            id: i.variant.id,
            quantity: i.quantity,
            item_price: i.unit_price / 100,
          })),
          num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
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

async function sendPostHogEvent(order: OrderData) {
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
          items: order.items.map((i) => ({
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
