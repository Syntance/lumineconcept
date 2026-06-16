import { medusa } from "./client";

export type OrderLineForAnalytics = {
  id: string;
  variant_id?: string;
  title: string;
  quantity: number;
  unit_price: number;
};

export type OrderForConfirmation = {
  id: string;
  display_id?: number;
  total?: number;
  currency_code?: string;
  email?: string;
  items: OrderLineForAnalytics[];
};

/**
 * Pobiera zamówienie z Store API Medusy.
 * Używane na /checkout/potwierdzenie (kwota przelewu + purchase tracking).
 */
export async function getOrder(
  orderId: string,
): Promise<OrderForConfirmation | null> {
  try {
    const response = await medusa.store.order.retrieve(orderId, {
      fields:
        "+total,+currency_code,+display_id,+email,*items,+items.variant_id,+items.title,+items.quantity,+items.unit_price",
    });
    const order = response.order as {
      id: string;
      display_id?: number;
      total?: number;
      currency_code?: string;
      email?: string;
      items?: Array<{
        id: string;
        variant_id?: string;
        title?: string;
        product_title?: string;
        quantity?: number;
        unit_price?: number;
      }>;
    };

    const items: OrderLineForAnalytics[] = (order.items ?? []).map((item) => ({
      id: item.id,
      variant_id: item.variant_id,
      title: item.title ?? item.product_title ?? "Produkt",
      quantity: Number(item.quantity ?? 1),
      unit_price: Number(item.unit_price ?? 0),
    }));

    return {
      id: order.id,
      display_id: order.display_id,
      total: order.total,
      currency_code: order.currency_code,
      email: order.email,
      items,
    };
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status !== 404) {
      console.error("[order] getOrder failed", orderId, e);
    }
    return null;
  }
}
