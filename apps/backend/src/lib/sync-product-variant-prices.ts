import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"

type Knex = {
  raw: (sql: string, bindings?: unknown[]) => Promise<unknown>
}

const BIG_NUMBER_PRECISION = 20

/**
 * Ustawia wszystkie ceny PLN wariantów produktu na tę samą kwotę co
 * `metadata.base_price`. Storefront bierze `calculated_amount` wariantu
 * z pierwszeństwem przed base_price — samo metadata nie wystarczy.
 */
export async function syncProductVariantPricesPln(
  container: MedusaContainer,
  productId: string,
  pricePln: number,
): Promise<number> {
  const productService = container.resolve(
    Modules.PRODUCT,
  ) as IProductModuleService
  const product = await productService.retrieveProduct(productId, {
    relations: ["variants"],
  })
  const variantIds =
    (
      product as { variants?: Array<{ id?: string }> }
    ).variants?.map((v) => v.id).filter(Boolean) ?? []

  if (variantIds.length === 0) return 0

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: unknown) => Promise<{ data: unknown[] }>
  }
  const { data } = await query.graph({
    entity: "variant",
    fields: ["id", "prices.id", "prices.currency_code"],
    filters: { id: variantIds },
  })

  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as Knex
  const rawAmount = {
    value: String(pricePln),
    precision: BIG_NUMBER_PRECISION,
  }
  let updated = 0

  for (const row of data as Array<{
    prices?: Array<{ id?: string; currency_code?: string | null }>
  }>) {
    for (const priceRow of row.prices ?? []) {
      if (!priceRow.id) continue
      if ((priceRow.currency_code ?? "").toLowerCase() !== "pln") continue

      await knex.raw(
        `UPDATE "price"
         SET amount = ?, raw_amount = ?::jsonb, updated_at = NOW()
         WHERE id = ? AND deleted_at IS NULL`,
        [pricePln, JSON.stringify(rawAmount), priceRow.id],
      )
      updated++
    }
  }

  return updated
}
