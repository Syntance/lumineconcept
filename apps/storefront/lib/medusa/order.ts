import { medusa } from "./client";

/**
 * Pobiera zamówienie z Store API Medusy.
 * Używane na /checkout/potwierdzenie do weryfikacji kwoty przelewu.
 */
export async function getOrder(orderId: string) {
  try {
    const response = await medusa.store.order.retrieve(orderId, {
      fields: "+total,+currency_code,+display_id",
    });
    return response.order as {
      id: string;
      display_id?: number;
      total?: number;
      currency_code?: string;
    } | null;
  } catch (e) {
    const status = (e as { status?: number }).status;
    // 404 = zamówienie nie istnieje, inne błędy logujemy
    if (status !== 404) {
      console.error("[order] getOrder failed", orderId, e);
    }
    return null;
  }
}
