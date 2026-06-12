import { writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { decodeBackup } from "../lib/backup-crypto"
import { getR2Object, listR2Objects } from "../lib/r2-client"

/**
 * Weryfikacja / test-restore backupów z R2.
 *
 * Domyślnie pobiera NAJNOWSZY backup `products` i `orders`, odszyfrowuje
 * (jeśli zaszyfrowany), parsuje JSON i wypisuje podsumowanie — czyli sprawdza,
 * że backupy są realnie odtwarzalne (a nie tylko „się tworzą"). To minimalny
 * test DR do uruchamiania okresowo (np. kwartalnie) — patrz runbook
 * `docs/runbooks/dr-restore.md`.
 *
 * Użycie:
 *   pnpm --filter @lumine/backend restore:verify
 *   # zapis odszyfrowanych plików lokalnie:
 *   pnpm --filter @lumine/backend restore:verify -- --out ./restore
 *
 * Wymaga ENV: S3_* (R2) oraz BACKUP_ENCRYPTION_KEY (gdy backupy szyfrowane).
 */

type ExecArgs = { args?: string[] }

function parseOutDir(args: string[]): string | null {
  const idx = args.indexOf("--out")
  if (idx >= 0 && args[idx + 1]) return args[idx + 1]!
  return null
}

function latestKeyForPrefix(keys: { key: string; lastModified?: Date }[], prefix: string): string | null {
  const matching = keys
    .filter((o) => o.key.startsWith(`backups/${prefix}/`))
    .sort((a, b) => (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0))
  return matching[0]?.key ?? null
}

export default async function restoreFromR2({ args = [] }: ExecArgs): Promise<void> {
  const outDir = parseOutDir(args)

  const objects = await listR2Objects("backups/")
  if (objects.length === 0) {
    console.warn("[restore] Brak backupów w R2 (prefix `backups/`). Czy job się wykonał?")
    return
  }

  if (outDir) {
    await mkdir(outDir, { recursive: true })
  }

  let okCount = 0
  for (const prefix of ["products", "orders"]) {
    const key = latestKeyForPrefix(objects, prefix)
    if (!key) {
      console.warn(`[restore] Brak backupu dla "${prefix}".`)
      continue
    }

    try {
      const raw = await getR2Object(key)
      const json = decodeBackup(raw)
      const parsed = JSON.parse(json) as {
        entity?: string
        exported_at?: string
        count?: number
        rows?: unknown[]
      }
      const rowCount = parsed.rows?.length ?? parsed.count ?? 0
      console.log(
        `[restore] OK ${key} → entity=${parsed.entity ?? "?"} count=${rowCount} exported_at=${parsed.exported_at ?? "?"}`,
      )
      okCount++

      if (outDir) {
        const file = path.join(outDir, `${prefix}.json`)
        await writeFile(file, json, "utf8")
        console.log(`[restore] zapisano odszyfrowany plik: ${file}`)
      }
    } catch (e) {
      console.error(`[restore] BŁĄD odczytu/odszyfrowania ${key}:`, (e as Error)?.message)
    }
  }

  if (okCount === 0) {
    throw new Error("[restore] Żaden backup nie przeszedł weryfikacji — sprawdź klucz/uprawnienia.")
  }
  console.log(`[restore] Test-restore zakończony: ${okCount} backup(ów) zweryfikowanych.`)
}
