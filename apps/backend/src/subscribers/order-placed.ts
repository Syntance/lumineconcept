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

/**
 * Subscriber „order.placed" — defensywny, drugorzędny kanał wysyłki maila
 * potwierdzającego. Główny kanał to endpoint `/store/custom/notify-order-placed`
 * wołany ze storefrontu tuż po `completeCart` (local event bus pod Railway
 * potrafi zgubić event — stąd oba tory).
 *
 * Idempotency (`order-placed:<order_id>` w `sendTransactionalEmail`) gwarantuje,
 * że nawet jeśli oba tory zadziałają, klient dostanie tylko JEDEN mail.
 *
 * Side-channels (Meta CAPI, PostHog) też są idempotentne na poziomie
 * zewnętrznych API (dedup po order_id) więc ich dublowanie jest OK.
 */

export default async function orderPlacedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = (() => {
    try {
      return container.resolve("logger") as {
        info: (msg: string) => void;
      };
    } catch {
      return { info: (msg: string) => console.info(msg) };
    }
  })();
  logger.info(`[order-placed] start id=${event.data.id}`);

  const orderService: IOrderModuleService =
    container.resolve(Modules.ORDER);

  let order: Awaited<ReturnType<typeof orderService.retrieveOrder>>;
  try {
    // Bez `items.variant` — cross-module relation, powoduje błąd „strategy".
    // Wystarczą pola z samego `items` do renderu maila; Meta CAPI i PostHog
    // poniżej mają własną ścieżkę fallbacku na brak `variant`.
    order = await orderService.retrieveOrder(event.data.id, {
      relations: ["items", "shipping_address", "shipping_methods"],
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
          currency: (order.currency_code ?? "PLN").toUpperCase(),
          value: Number(order.total ?? 0) / 100,
          // `variant_id` jest na line itemie — nie potrzebujemy dodatkowego
          // joina na `items.variant` (który wywala retrieveOrder na cross-module
          // relacji).
          content_ids: order.items.map(
            (i: any) => i.variant_id ?? i.product_id ?? i.id,
          ),
          content_type: "product",
          contents: order.items.map((i: any) => ({
            id: i.variant_id ?? i.product_id ?? i.id,
            quantity: i.quantity,
            item_price: Number(i.unit_price ?? 0) / 100,
          })),
          num_items: order.items.reduce(
            (sum: number, i: any) => sum + Number(i.quantity ?? 0),
            0,
          ),
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
