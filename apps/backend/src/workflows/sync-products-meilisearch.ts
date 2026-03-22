import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import type { IProductModuleService } from "@medusajs/framework/types";
import type MeilisearchService from "../modules/meilisearch/service";

const fetchAllProductsStep = createStep(
  "fetch-all-products",
  async (_, { container }) => {
    const productService: IProductModuleService =
      container.resolve(Modules.PRODUCT);

    const products = await productService.listProducts(
      { status: "published" as const },
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
  async (products: any[], { container }) => {
    const meilisearch = container.resolve("meilisearch") as MeilisearchService;

    const documents = products.map((product: any) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.description ?? "",
      thumbnail: product.thumbnail,
      categories: product.categories?.map((c: any) => c.name) ?? [],
      tags: product.tags?.map((t: any) => t.value) ?? [],
      variant_prices:
        product.variants?.flatMap((v: any) => v.prices?.map((p: any) => p.amount) ?? []) ?? [],
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
    const result = indexProductsStep(products);
    return new WorkflowResponse(result);
  },
);
