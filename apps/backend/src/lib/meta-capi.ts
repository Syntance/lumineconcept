import type { MedusaContainer } from "@medusajs/framework/types";
import crypto from "node:crypto";
import { captureError } from "./sentry";
import { persistOrderCheckoutMetadata } from "./order-checkout-metadata";
import { readAnalyticsConsent } from "./analytics-consent-metadata";

export const CAPI_PURCHASE_SENT_KEY = "capi_purchase_sent";

/** Klucz deduplikacji Meta: ten sam event_id w CAPI (server) i Pixel eventID (thank-you page). */
export function purchaseEventId(orderId: string): string {
  return `purchase_${orderId}`;
}

function sha256Normalized(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashEmail(email: string): string {
  return sha256Normalized(email.toLowerCase().trim());
}

function hashPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return sha256Normalized(digits);
}

function isCapiEnabled(): boolean {
  return process.env.CAPI_ENABLED === "true";
}

function resolvePixelId(): string | undefined {
  const id = process.env.META_PIXEL_ID?.trim();
  return id || undefined;
}

interface OrderItemLike {
  id?: string;
  variant_id?: string;
  product_id?: string;
  title?: string;
  product_title?: string;
  quantity?: number;
  unit_price?: number;
}

interface OrderLike {
  id: string;
  email?: string | null;
  currency_code?: string | null;
  total?: number | null;
  metadata?: Record<string, unknown> | null;
  items?: OrderItemLike[];
  shipping_address?: { phone?: string | null } | null;
}

function buildPurchaseCustomData(order: OrderLike): Record<string, unknown> {
  const items = order.items ?? [];
  const currency = (order.currency_code ?? "PLN").toUpperCase();
  // Medusa v2 backend zwraca kwoty jako PLN float (np. 150.00), nie grosze.
  // Potwierdzenie: order-email-dispatch.ts używa * 100 do konwersji na grosze.
  const value = Number(order.total ?? 0);

  return {
    currency,
    value,
    order_id: order.id,
    content_type: "product",
    content_ids: items.map(
      (i) => i.variant_id ?? i.product_id ?? i.id ?? "unknown",
    ),
    contents: items.map((i) => ({
      id: i.variant_id ?? i.product_id ?? i.id ?? "unknown",
      quantity: Number(i.quantity ?? 1),
      item_price: Number(i.unit_price ?? 0),
    })),
    num_items: items.reduce(
      (sum, i) => sum + Number(i.quantity ?? 0),
      0,
    ),
  };
}

function wasCapiPurchaseSent(order: OrderLike): boolean {
  const meta = order.metadata;
  if (!meta || typeof meta !== "object") return false;
  return (meta as Record<string, unknown>)[CAPI_PURCHASE_SENT_KEY] === "true";
}

/**
 * Wysyła Purchase do Meta Conversions API (server-side).
 * Idempotentny — ponowne order.placed nie duplikuje konwersji.
 */
export async function sendPurchaseCAPI(
  scope: MedusaContainer,
  order: OrderLike,
  options?: { fbp?: string; fbc?: string },
): Promise<void> {
  if (!isCapiEnabled()) return;

  const pixelId = resolvePixelId();
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!pixelId || !accessToken) return;

  if (!order.email?.trim()) return;
  if (wasCapiPurchaseSent(order)) return;

  // RODO defense-in-depth: Meta to współadministrator danych reklamowych —
  // bez zgody marketingowej NIE wysyłamy (subscriber też bramkuje, to drugi
  // bezpiecznik na wypadek wywołania CAPI z innego miejsca).
  if (readAnalyticsConsent(order).marketing !== true) return;

  const eventId = purchaseEventId(order.id);
  const hashedEmail = hashEmail(order.email);
  const phone = order.shipping_address?.phone?.trim();
  const hashedPhone = phone ? hashPhone(phone) : undefined;

  const userData: Record<string, unknown> = {
    em: [hashedEmail],
  };
  if (hashedPhone) userData.ph = [hashedPhone];
  if (options?.fbp) userData.fbp = options.fbp;
  if (options?.fbc) userData.fbc = options.fbc;

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        user_data: userData,
        custom_data: buildPurchaseCustomData(order),
      },
    ],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[meta-capi] Graph API error", response.status, body.slice(0, 200));
      captureError(new Error(`Meta CAPI Purchase failed: ${response.status}`), {
        orderId: order.id,
        step: "meta-capi-purchase",
      });
      return;
    }

    await persistOrderCheckoutMetadata(scope, order.id, {
      [CAPI_PURCHASE_SENT_KEY]: "true",
      capi_purchase_event_id: eventId,
    });
  } catch (e) {
    console.error("[meta-capi] sendPurchaseCAPI failed", e);
    captureError(e, {
      orderId: order.id,
      step: "meta-capi-purchase",
    });
  }
}
