import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import type { IProductModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import type MeilisearchService from "../modules/meilisearch/service";

export default async function productUpsertedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const meilisearch = container.resolve("meilisearch") as MeilisearchService;
  const productService: IProductModuleService =
    container.resolve(Modules.PRODUCT);

  const product = await productService.retrieveProduct(event.data.id, {
    relations: ["variants", "variants.prices", "categories", "tags"],
  }) as any;

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
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
};
