import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /store/custom/fix-prices?dry_run=true|false&token=…
 *
 * Jednorazowa migracja konwencji cenowej z Medusa v1 (integer grosze) do
 * Medusa v2 (decimal PLN). Sklep był seedowany kwotami typu `17990`, które
 * Medusa v2 traktuje jako `17 990 zł` zamiast zamierzonego `179,90 zł`.
 *
 * Heurystyka: dzielimy przez 100 każdą kwotę > `MIN_HEURISTIC`. Próg dobrany
 * tak, żeby nie dotykać prawdopodobnych poprawnych cen (np. 500 zł), ale
 * chwytać wszystko > 1000 (czyli to co kiedyś było w groszach).
 *
 * Zabezpieczenia:
 *  - wymagany `LUMINE_DEBUG_TOKEN` w nagłówku `x-debug-token` (lub `?token=…`),
 *  - endpoint idempotentny: po udanym przebiegu ceny są < progu i kolejne
 *    wywołania nic nie zmieniają,
 *  - domyślnie `dry_run=true` — zwraca plan, nie zapisuje niczego.
 *
 * Dlaczego raw SQL zamiast pricingService.upsertPriceSets()?
 *  - `upsertPriceSets` kasuje ceny z price_set’u, których nie ma w payloadzie,
 *    co przy migracji byłoby katastrofą (różne waluty, price_listy itp.),
 *  - pricing module nie ma publicznej metody „update single price”,
 *  - raw SQL daje jedno spójne UPDATE na kolumnach `amount` (numeric) oraz
 *    `raw_amount` (jsonb `{ value, precision }`) — Medusa v2 czyta z obu.
 *
 * Pokrycie:
 *  1) tabela `price` z modułu Pricing (ceny wariantów + ceny shipping options —
 *     w Medusa v2 oba idą przez ten sam moduł),
 *  2) `product.metadata.base_price` (cena wyświetlana na storefroncie,
 *     zapisywana przez nasze widgety admin).
 */

type Knex = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows: unknown[] }>
}

type PriceRow = {
  id: string
  amount: string | number
  raw_amount: { value?: string; precision?: number } | null
  price_set_id: string | null
  currency_code: string | null
}

type ProductRow = {
  id: string
  title: string | null
  metadata: Record<string, unknown> | null
}

const MIN_HEURISTIC = 1000 // ceny > 1000 prawie na pewno były w groszach
const BIG_NUMBER_PRECISION = 20 // domyślna precyzja Medusa BigNumber

function toNumber(v: unknown): number {
  if (typeof v === "number") return v
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : Number.NaN
  }
  return Number.NaN
}

function divideBy100(value: number): number {
  // zaokrąglamy do 2 miejsc po przecinku (grosze -> decimal PLN)
  return Math.round((value / 100) * 100) / 100
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const token =
    (req.headers["x-debug-token"] as string | undefined) ??
    (req.query.token as string | undefined)
  const expected = process.env.LUMINE_DEBUG_TOKEN
  if (!expected || token !== expected) {
    return res.status(404).json({ message: "Not found" })
  }

  const dryRun =
    (req.query.dry_run as string | undefined)?.toLowerCase() !== "false"

  let knex: Knex
  try {
    knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as Knex
  } catch (e) {
    return res.status(500).json({
      ok: false,
      step: "resolve_pg",
      error: e instanceof Error ? e.message : String(e),
    })
  }

  type Sample = {
    id: string
    old_amount: number
    new_amount: number
    currency_code?: string | null
    price_set_id?: string | null
  }

  const summary = {
    ok: true,
    dry_run: dryRun,
    prices: {
      scanned: 0,
      migrated: 0,
      samples: [] as Sample[],
    },
    product_metadata: {
      scanned: 0,
      migrated: 0,
      samples: [] as Array<{
        id: string
        old: number
        new: number
        title?: string | null
      }>,
    },
    message: dryRun
      ? "DRY RUN — nic nie zostało zapisane. Odpal z ?dry_run=false, aby zastosować."
      : "Migracja wykonana.",
  }

  // 1) Ceny (Pricing module)
  try {
    const { rows } = (await knex.raw(
      `SELECT id, amount, raw_amount, price_set_id, currency_code
       FROM "price"
       WHERE deleted_at IS NULL AND amount > ?`,
      [MIN_HEURISTIC],
    )) as { rows: PriceRow[] }

    summary.prices.scanned = rows.length

    for (const row of rows) {
      const oldAmount = toNumber(row.amount)
      if (!Number.isFinite(oldAmount) || oldAmount <= MIN_HEURISTIC) continue

      const newAmount = divideBy100(oldAmount)

      if (summary.prices.samples.length < 10) {
        summary.prices.samples.push({
          id: row.id,
          old_amount: oldAmount,
          new_amount: newAmount,
          currency_code: row.currency_code,
          price_set_id: row.price_set_id,
        })
      }
      summary.prices.migrated++

      if (!dryRun) {
        const rawAmount = {
          value: String(newAmount),
          precision: row.raw_amount?.precision ?? BIG_NUMBER_PRECISION,
        }
        await knex.raw(
          `UPDATE "price"
           SET amount = ?, raw_amount = ?::jsonb, updated_at = NOW()
           WHERE id = ?`,
          [newAmount, JSON.stringify(rawAmount), row.id],
        )
      }
    }
  } catch (e) {
    summary.ok = false
    summary.message = `Błąd podczas migracji cen: ${
      e instanceof Error ? e.message : String(e)
    }`
    return res.status(500).json(summary)
  }

  // 2) product.metadata.base_price
  try {
    const { rows } = (await knex.raw(
      `SELECT id, title, metadata
       FROM "product"
       WHERE deleted_at IS NULL
         AND metadata ? 'base_price'
         AND metadata->>'base_price' ~ '^[0-9]+(\\.[0-9]+)?$'`,
    )) as { rows: ProductRow[] }

    for (const row of rows) {
      const raw = row.metadata?.base_price
      const num = toNumber(raw)
      summary.product_metadata.scanned++
      if (!Number.isFinite(num) || num <= MIN_HEURISTIC) continue

      const newVal = divideBy100(num)

      if (summary.product_metadata.samples.length < 10) {
        summary.product_metadata.samples.push({
          id: row.id,
          title: row.title,
          old: num,
          new: newVal,
        })
      }
      summary.product_metadata.migrated++

      if (!dryRun) {
        // jsonb_set — zmienia tylko klucz base_price, nie nadpisuje reszty metadata
        await knex.raw(
          `UPDATE "product"
           SET metadata = jsonb_set(metadata, '{base_price}', to_jsonb(?::text), false),
               updated_at = NOW()
           WHERE id = ?`,
          [String(newVal), row.id],
        )
      }
    }
  } catch (e) {
    summary.ok = false
    summary.message = `Błąd podczas migracji metadata: ${
      e instanceof Error ? e.message : String(e)
    }`
    return res.status(500).json(summary)
  }

  return res.status(200).json(summary)
}
