import type { SubscriberArgs } from "@medusajs/framework";
import type { IProductModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Jednorazowa migracja: ustawia manage_inventory: false dla wszystkich wariantów.
 * Uruchom: pnpm --filter @lumine/backend variants:on-demand
 */
export default async function migrateVariantsOnDemand({
  container,
}: Pick<SubscriberArgs, "container">) {
  const productService = container.resolve(
    Modules.PRODUCT,
  ) as IProductModuleService;

  const take = 80;
  let skip = 0;
  let updated = 0;

  for (;;) {
    const [products] = await productService.listAndCountProducts(
      {},
      { take, skip, relations: ["variants"] },
    );
    if (products.length === 0) break;

    for (const p of products) {
      const variants =
        (p as { variants?: { manage_inventory?: boolean }[] }).variants ?? [];
      if (variants.length === 0) continue;
      if (!variants.some((v) => v.manage_inventory !== false)) continue;

      await updateProductVariantsWorkflow(container).run({
        input: {
          selector: { product_id: p.id },
          update: { manage_inventory: false },
        },
      });
      updated += 1;
    }

    if (products.length < take) break;
    skip += take;
  }

  console.log(
    `[migrate-variants-on-demand] Zaktualizowano produkty (warianty bez stanu): ${updated}`,
  );
}
