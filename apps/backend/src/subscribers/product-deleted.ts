import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import type MeilisearchService from "../modules/meilisearch/service";
import { captureError } from "../lib/sentry";

/**
 * Usuwa produkt z indeksu Meilisearch po `product.deleted`.
 *
 * Bez tego usunięte produkty zostawały w wynikach wyszukiwania jako „martwe"
 * rekordy (klik → 404). Subscriber jest izolowany i nieblokujący — błąd nie
 * wywraca innych handlerów `product.deleted`.
 */
export default async function productDeletedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const meilisearch = container.resolve("meilisearch") as MeilisearchService;
    await meilisearch.deleteProduct(event.data.id);
  } catch (e) {
    console.error("[product-deleted] meilisearch.deleteProduct", e);
    captureError(e, { subscriber: "product-deleted", productId: event.data.id });
  }
}

export const config: SubscriberConfig = {
  event: "product.deleted",
};
