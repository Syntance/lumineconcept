import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import type MeilisearchService from "../modules/meilisearch/service";

export default async function productUpsertedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const meilisearch = container.resolve("meilisearch") as MeilisearchService;
  const productService = container.resolve("product") as {
    retrieve: (
      id: string,
      config: { relations: string[] },
    ) => Promise<{
      id: string;
      title: string;
      handle: string;
      description: string;
      thumbnail: string | null;
      categories: Array<{ name: string }>;
      tags: Array<{ value: string }>;
      variants: Array<{
        prices: Array<{ amount: number }>;
      }>;
      created_at: string;
      updated_at: string;
    }>;
  };

  const product = await productService.retrieve(event.data.id, {
    relations: ["variants", "variants.prices", "categories", "tags"],
  });

  await meilisearch.upsertProduct({
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: product.description ?? "",
    thumbnail: product.thumbnail,
    categories: product.categories?.map((c) => c.name) ?? [],
    tags: product.tags?.map((t) => t.value) ?? [],
    variant_prices: product.variants?.flatMap((v) =>
      v.prices?.map((p) => p.amount) ?? [],
    ) ?? [],
    created_at: product.created_at,
    updated_at: product.updated_at,
  });
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
};
