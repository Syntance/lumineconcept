import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import type { IProductModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Wszystkie warianty są traktowane jak produkcja na zamówienie — bez śledzenia stanu
 * magazynowego w Medusie (zawsze dostępne w sklepie).
 */
export default async function productOnDemandInventoryHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const productService = container.resolve(
    Modules.PRODUCT,
  ) as IProductModuleService;

  if (
    event.name === "product-variant.created" ||
    event.name === "product-variant.updated"
  ) {
    const variant = await productService.retrieveProductVariant(event.data.id);
    if (!variant || variant.manage_inventory === false) return;

    await updateProductVariantsWorkflow(container).run({
      input: {
        product_variants: [{ id: event.data.id, manage_inventory: false }],
      },
    });
    return;
  }

  const product = await productService.retrieveProduct(event.data.id, {
    relations: ["variants"],
  });
  const variants =
    (product as { variants?: { manage_inventory?: boolean }[] }).variants ?? [];
  if (variants.length === 0) return;
  if (!variants.some((v) => v.manage_inventory !== false)) return;

  await updateProductVariantsWorkflow(container).run({
    input: {
      selector: { product_id: event.data.id },
      update: { manage_inventory: false },
    },
  });
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product-variant.created",
    "product-variant.updated",
  ],
};
