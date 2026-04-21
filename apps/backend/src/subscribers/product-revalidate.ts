import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

/**
 * Po każdej mutacji produktu w Medusie uderzamy w webhook storefrontu,
 * który wywołuje `revalidateTag("medusa-products")` (oraz powiązane tagi).
 * Dzięki temu koniec z „zombie" 404 po zmianie produktu — `unstable_cache`
 * jest natychmiast inwalidowany.
 */
export default async function productRevalidateHandler({
  event,
}: SubscriberArgs<{ id: string }>) {
  const url = process.env.STOREFRONT_REVALIDATE_URL;
  const secret = process.env.MEDUSA_REVALIDATE_SECRET;

  if (!url || !secret) {
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify({
        tags: ["medusa-products", "medusa-categories", "global-product-config"],
        reason: event.name,
        id: event.data?.id,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(
        "[product-revalidate] storefront responded",
        res.status,
        await res.text().catch(() => ""),
      );
    }
  } catch (e) {
    console.error("[product-revalidate] fetch failed", e);
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
};
