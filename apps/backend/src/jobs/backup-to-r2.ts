import { spawn } from "node:child_process"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  deleteR2Objects,
  getR2Client,
  listR2Objects,
  putR2Object,
} from "../lib/r2-client"
import { encodeBackup } from "../lib/backup-crypto"
import { captureError } from "../lib/sentry"

/**
 * Dzienny off-site backup KLUCZOWYCH danych do Cloudflare R2.
 *
 * Po co, skoro Postgres (Neon) ma PITR? Bo to dwie różne warstwy ochrony:
 *   - Neon PITR  → szybkie przywrócenie całej bazy (primary recovery).
 *   - R2 snapshot→ niezależny od dostawcy bazy snapshot produktów i zamówień
 *                  (JSON) + opcjonalny pełny `pg_dump`. Działa nawet gdy
 *                  backend/baza są niedostępne.
 *
 * Bezpieczeństwo: payloady (z PII) są szyfrowane klientowo AES-256-GCM, gdy
 * ustawiono `BACKUP_ENCRYPTION_KEY` (patrz `backup-crypto.ts`).
 * Retencja: stare backupy usuwane po `BACKUP_RETENTION_DAYS` (domyślnie 30).
 *
 * Job jest best-effort: brak ENV R2 = no-op; błędy nie wywracają workera.
 */

const PAGE_SIZE = 200
const DEFAULT_RETENTION_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

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
  const { body, ext, contentType } = encodeBackup(payload)
  await putR2Object(`backups/${prefix}/${prefix}-${isoDate}.${ext}`, body, contentType)
  return rows.length
}

/** Usuwa backupy starsze niż `BACKUP_RETENTION_DAYS` (zapobiega nieskończonemu wzrostowi). */
async function pruneOldBackups(): Promise<void> {
  const days = Number(process.env.BACKUP_RETENTION_DAYS ?? DEFAULT_RETENTION_DAYS)
  if (!Number.isFinite(days) || days <= 0) return

  const cutoff = Date.now() - days * DAY_MS
  const objects = await listR2Objects("backups/")
  const stale = objects
    .filter((o) => (o.lastModified?.getTime() ?? Number.POSITIVE_INFINITY) < cutoff)
    .map((o) => o.key)

  if (stale.length > 0) {
    await deleteR2Objects(stale)
    console.log(
      `[backup-to-r2] retencja: usunięto ${stale.length} backupów starszych niż ${days} dni`,
    )
  }
}

/** Pełny zrzut bazy `pg_dump` (opcjonalny — `BACKUP_PGDUMP=1` + dostępny binarny pg_dump). */
async function pgDumpToR2(isoDate: string): Promise<boolean> {
  if (process.env.BACKUP_PGDUMP !== "1") return false
  const dbUrl = process.env.DATABASE_URL?.trim()
  if (!dbUrl) {
    console.warn("[backup-to-r2] BACKUP_PGDUMP=1, ale brak DATABASE_URL — pomijam pg_dump")
    return false
  }

  try {
    const sql = await runPgDump(dbUrl)
    const { body, ext, contentType } = encodeBackup(sql)
    await putR2Object(`backups/pgdump/pgdump-${isoDate}.sql.${ext === "json" ? "txt" : "enc"}`, body, contentType)
    console.log(`[backup-to-r2] pg_dump OK (${(sql.length / 1024).toFixed(0)} kB) (${isoDate})`)
    return true
  } catch (e) {
    // Najczęstszy powód: brak binarki pg_dump w środowisku (ENOENT). Nie wywracamy jobu.
    console.warn("[backup-to-r2] pg_dump nieudany (czy pg_dump jest zainstalowany?):", (e as Error)?.message)
    captureError(e, { job: "backup-to-r2", step: "pg_dump" })
    return false
  }
}

function runPgDump(dbUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("pg_dump", ["--no-owner", "--no-privileges", dbUrl], {
      stdio: ["ignore", "pipe", "pipe"],
    })
    const out: Buffer[] = []
    const err: Buffer[] = []
    child.stdout.on("data", (d: Buffer) => out.push(d))
    child.stderr.on("data", (d: Buffer) => err.push(d))
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(out).toString("utf8"))
      else reject(new Error(`pg_dump zakończył się kodem ${code}: ${Buffer.concat(err).toString("utf8").slice(0, 500)}`))
    })
  })
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

    // Opcjonalny pełny zrzut bazy (gdy włączony i pg_dump dostępny).
    await pgDumpToR2(isoDate)
  } catch (e) {
    console.error("[backup-to-r2] backup nieudany:", (e as Error)?.message)
    captureError(e, { job: "backup-to-r2" })
  }

  // Retencja — w osobnym try, żeby błąd czyszczenia nie maskował udanego backupu.
  try {
    await pruneOldBackups()
  } catch (e) {
    console.error("[backup-to-r2] retencja nieudana:", (e as Error)?.message)
    captureError(e, { job: "backup-to-r2", step: "retention" })
  }
}

export const config = {
  name: "backup-to-r2",
  // Codziennie o 03:15 UTC — poza szczytem.
  schedule: "15 3 * * *",
}
