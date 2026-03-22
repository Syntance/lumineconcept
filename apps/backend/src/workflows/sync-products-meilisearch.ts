import {
  createStep,
  createWorkflow,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import type MeilisearchService from "../modules/meilisearch/service";

const fetchAllProductsStep = createStep(
  "fetch-all-products",
  async (_, { container }) => {
    const productService = container.resolve("product") as {
      list: (
        filters: Record<string, unknown>,
        config: { relations: string[]; take: number },
      ) => Promise<
        Array<{
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
        }>
      >;
    };

    const products = await productService.list(
      { status: "published" },
      {
        relations: ["variants", "variants.prices", "categories", "tags"],
        take: 10000,
      },
    );

    return new StepResponse(products);
  },
);

const indexProductsStep = createStep(
  "index-products-to-meilisearch",
  async (
    products: Array<{
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
    }>,
    { container },
  ) => {
    const meilisearch = container.resolve("meilisearch") as MeilisearchService;

    const documents = products.map((product) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.description ?? "",
      thumbnail: product.thumbnail,
      categories: product.categories?.map((c) => c.name) ?? [],
      tags: product.tags?.map((t) => t.value) ?? [],
      variant_prices:
        product.variants?.flatMap((v) => v.prices?.map((p) => p.amount) ?? []) ?? [],
      created_at: product.created_at,
      updated_at: product.updated_at,
    }));

    await meilisearch.upsertProducts(documents);

    return new StepResponse({ indexed: documents.length });
  },
);

export const syncProductsMeilisearchWorkflow = createWorkflow(
  "sync-products-meilisearch",
  () => {
    const products = fetchAllProductsStep();
    return indexProductsStep(products);
  },
);
