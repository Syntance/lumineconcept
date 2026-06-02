import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getR2Client, putR2Object } from "../lib/r2-client"
import { captureError } from "../lib/sentry"

/**
 * Dzienny off-site backup KLUCZOWYCH danych do Cloudflare R2.
 *
 * Po co, skoro Postgres (Neon) ma PITR? Bo to dwie różne warstwy ochrony:
 *   - Neon PITR  → szybkie przywrócenie całej bazy (primary recovery).
 *   - R2 JSON    → czytelny, niezależny od dostawcy bazy snapshot produktów
 *                  i zamówień. Działa nawet gdy backend/baza są niedostępne,
 *                  pozwala ręcznie odtworzyć katalog i odczytać zamówienia.
 *
 * Job jest best-effort: brak ENV R2 = no-op; błędy nie wywracają workera.
 * Snapshoty trzymamy 1 plik/dzień, więc rotacja jest naturalna (po dacie).
 */

const PAGE_SIZE = 200

type QueryGraph = {
  graph: (args: {
    entity: string
    fields: string[]
    pagination?: { skip: number; take: number }
  }) => Promise<{ data: unknown[]; metadata?: { count?: number } }>
}

async function fetchAll(
  query: QueryGraph,
  entity: string,
  fields: string[],
): Promise<unknown[]> {
  const out: unknown[] = []
  let skip = 0

  for (;;) {
    const { data } = await query.graph({
      entity,
      fields,
      pagination: { skip, take: PAGE_SIZE },
    })
    out.push(...data)
    if (data.length < PAGE_SIZE) break
    skip += PAGE_SIZE
  }

  return out
}

async function backupEntity(
  query: QueryGraph,
  entity: string,
  fields: string[],
  prefix: string,
  isoDate: string,
): Promise<number> {
  const rows = await fetchAll(query, entity, fields)
  const payload = JSON.stringify(
    { entity, exported_at: new Date().toISOString(), count: rows.length, rows },
    null,
    0,
  )
  await putR2Object(`backups/${prefix}/${prefix}-${isoDate}.json`, payload)
  return rows.length
}

export default async function backupToR2Job(container: MedusaContainer) {
  if (!getR2Client()) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as QueryGraph
  const isoDate = new Date().toISOString().slice(0, 10)

  try {
    const products = await backupEntity(
      query,
      "product",
      [
        "id",
        "title",
        "handle",
        "status",
        "description",
        "thumbnail",
        "metadata",
        "categories.id",
        "categories.name",
        "tags.value",
        "images.url",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.metadata",
        "variants.prices.amount",
        "variants.prices.currency_code",
      ],
      "products",
      isoDate,
    )

    const orders = await backupEntity(
      query,
      "order",
      [
        "id",
        "display_id",
        "status",
        "email",
        "currency_code",
        "total",
        "subtotal",
        "tax_total",
        "shipping_total",
        "created_at",
        "updated_at",
        "metadata",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.total",
        "items.variant_id",
        "items.metadata",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.address_1",
        "shipping_address.city",
        "shipping_address.postal_code",
        "shipping_address.country_code",
        "shipping_address.phone",
      ],
      "orders",
      isoDate,
    )

    console.log(
      `[backup-to-r2] snapshot OK — produkty: ${products}, zamówienia: ${orders} (${isoDate})`,
    )
  } catch (e) {
    console.error("[backup-to-r2] backup nieudany:", (e as Error)?.message)
    captureError(e, { job: "backup-to-r2" })
  }
}

export const config = {
  name: "backup-to-r2",
  // Codziennie o 03:15 UTC — poza szczytem.
  schedule: "15 3 * * *",
}
