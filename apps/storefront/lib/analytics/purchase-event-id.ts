/** Klucz deduplikacji Meta: ten sam string w Pixel eventID i CAPI event_id (server). */
export function purchaseEventId(orderId: string): string {
  return `purchase_${orderId}`;
}
