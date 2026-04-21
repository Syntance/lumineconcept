import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import type { IProductModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import type MeilisearchService from "../modules/meilisearch/service";
import { captureError } from "../lib/sentry";

export default async function productUpsertedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const productService: IProductModuleService =
    container.resolve(Modules.PRODUCT);

  let product: any;
  try {
    product = await productService.retrieveProduct(event.data.id, {
      relations: ["variants", "variants.prices", "categories", "tags"],
    });
  } catch (e) {
    console.error("[product-upserted] retrieveProduct failed", e);
    captureError(e, { subscriber: "product-upserted", step: "retrieveProduct", productId: event.data.id });
    return;
  }

  try {
    const meilisearch = container.resolve("meilisearch") as MeilisearchService;
    await meilisearch.upsertProduct({
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.description ?? "",
      thumbnail: product.thumbnail,
      categories: product.categories?.map((c: any) => c.name) ?? [],
      tags: product.tags?.map((t: any) => t.value) ?? [],
      variant_prices: product.variants?.flatMap((v: any) =>
        v.prices?.map((p: any) => p.amount) ?? [],
      ) ?? [],
      created_at: product.created_at,
      updated_at: product.updated_at,
    });
  } catch (e) {
    console.error("[product-upserted] meilisearch.upsertProduct", e);
    captureError(e, { subscriber: "product-upserted", step: "meilisearch", productId: product?.id });
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
};
