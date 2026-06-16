"use client";

import { useEffect, useRef } from "react";
import {
  clearCheckoutAnalyticsContext,
  readCheckoutAnalyticsContext,
} from "@/lib/analytics/checkout-analytics-context";
import { cartLineToItem } from "@/lib/analytics/medusa-items";
import { track } from "@/lib/analytics/track";
import { markPurchaseCustomer } from "@/lib/analytics/useAnalytics";
import type { EcommerceItem } from "@/lib/analytics/events/registry";

const STORAGE_PREFIX = "lumine.purchase_tracked.";

export type PurchaseTrackingOrder = {
  orderId: string;
  displayId?: number;
  total: number;
  currency: string;
  email?: string;
  paymentMethod?: string;
  items: Array<{
    id: string;
    variant_id?: string;
    title: string;
    quantity: number;
    unit_price: number;
  }>;
};

type Props = {
  order: PurchaseTrackingOrder;
};

/**
 * Jednorazowy purchase (GA4 + PostHog + Meta Pixel) na stronie potwierdzenia.
 * Idempotentny per orderId (sessionStorage).
 */
export function PurchaseTracking({ order }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;

    const storageKey = `${STORAGE_PREFIX}${order.orderId}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
    } catch {
      /* prywatny tryb */
    }

    firedRef.current = true;

    const ecommerceItems: EcommerceItem[] = order.items.map((line) =>
      cartLineToItem({
        id: line.id,
        variant_id: line.variant_id,
        title: line.title,
        quantity: line.quantity,
        unit_price: line.unit_price,
      }),
    );

    const checkoutCtx = readCheckoutAnalyticsContext();
    const checkoutDurationSeconds =
      checkoutCtx?.startedAt != null
        ? Math.round((Date.now() - checkoutCtx.startedAt) / 1000)
        : undefined;
    const paymentMethod =
      checkoutCtx?.paymentMethod ?? order.paymentMethod;
    const shippingMethod = checkoutCtx?.shippingMethod;

    track("purchase", {
      transaction_id: order.orderId,
      value: order.total,
      currency: order.currency,
      items: ecommerceItems,
      items_count: ecommerceItems.reduce((sum, item) => sum + item.quantity, 0),
      ...(paymentMethod ? { payment_method: paymentMethod } : {}),
      ...(shippingMethod ? { shipping_method: shippingMethod } : {}),
      ...(checkoutDurationSeconds != null && checkoutDurationSeconds >= 0
        ? { checkout_duration_seconds: checkoutDurationSeconds }
        : {}),
      ...(order.email ? { email: order.email } : {}),
    });

    markPurchaseCustomer({
      email: order.email,
      order_id: order.orderId,
      value: order.total,
    });

    clearCheckoutAnalyticsContext();

    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* prywatny tryb */
    }
  }, [order]);

  return null;
}
