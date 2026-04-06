/**
 * Ustawia `metadata.grubosc_plexi` (grubość plexi) dla każdego produktu w Medusie.
 *
 * Użycie:
 *   MEDUSA_BACKEND_URL=http://localhost:9000 \
 *   MEDUSA_ADMIN_EMAIL=... MEDUSA_ADMIN_PASSWORD=... \
 *   pnpm fill-product-plexi-thickness
 *
 * Opcje (env):
 *   DRY_RUN=1           — tylko log, bez zapisu
 *   FORCE=1             — nadpisz istniejącą wartość
 *   SKIP_IF_SET=0       — domyślnie 1: pomiń produkty, które już mają `grubosc_plexi`
 *   PLEXI_THICKNESS=3 mm — wartość (domyślnie „3 mm”)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const METADATA_KEY = "grubosc_plexi";

function loadOptionalEnvFile(): void {
  const envPath = resolve(process.cwd(), "scripts/fill-product-dimensions.env");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith("\"") && val.endsWith("\"")) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadOptionalEnvFile();

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD ?? "";
const VALUE = (process.env.PLEXI_THICKNESS ?? "3 mm").trim();

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const FORCE = process.env.FORCE === "1" || process.env.FORCE === "true";
const SKIP_IF_SET =
  process.env.SKIP_IF_SET !== "0" && process.env.SKIP_IF_SET !== "false";

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${BACKEND_URL.replace(/\/$/, "")}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Auth failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { token: string };
  return data.token;
}

async function adminFetch(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const res = await fetch(`${BACKEND_URL.replace(/\/$/, "")}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Admin API ${options.method ?? "GET"} ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

interface ProductListItem {
  id: string;
  title: string;
  handle: string;
}

interface ProductDetail {
  id: string;
  title: string;
  handle: string;
  metadata: Record<string, unknown> | null;
}

async function run() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      "Ustaw MEDUSA_ADMIN_EMAIL i MEDUSA_ADMIN_PASSWORD (oraz opcjonalnie MEDUSA_BACKEND_URL).",
    );
    process.exit(1);
  }

  console.log(`Backend: ${BACKEND_URL}`);
  console.log(
    `Wartość ${METADATA_KEY}: „${VALUE}” | ${DRY_RUN ? "DRY RUN" : "ZAPIS"} | FORCE=${FORCE} | SKIP_IF_SET=${SKIP_IF_SET}\n`,
  );

  const token = await getAuthToken();

  let offset = 0;
  const limit = 50;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  while (true) {
    const data = (await adminFetch(
      token,
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle`,
    )) as { products: ProductListItem[]; count: number };

    if (data.products.length === 0) break;

    for (const row of data.products) {
      const detail = (await adminFetch(token, `/admin/products/${row.id}`)) as {
        product: ProductDetail;
      };
      const p = detail.product;
      const meta = (p.metadata ?? {}) as Record<string, unknown>;
      const existing =
        typeof meta[METADATA_KEY] === "string"
          ? (meta[METADATA_KEY] as string).trim()
          : "";

      if (SKIP_IF_SET && existing && !FORCE) {
        console.log(`[SKIP] ${p.title} (${p.handle}) — już: „${existing}”`);
        skipped++;
        continue;
      }

      if (existing === VALUE && !FORCE) {
        console.log(`[OK] ${p.title} — już „${VALUE}”`);
        skipped++;
        continue;
      }

      console.log(
        `[${DRY_RUN ? "DRY" : "UPDATE"}] ${p.title} (${p.handle})\n  → ${METADATA_KEY}: ${VALUE}`,
      );

      if (!DRY_RUN) {
        try {
          await adminFetch(token, `/admin/products/${p.id}`, {
            method: "POST",
            body: JSON.stringify({
              metadata: {
                ...meta,
                [METADATA_KEY]: VALUE,
              },
            }),
          });
          updated++;
        } catch (e) {
          console.error(`  ✗ ${e}`);
          failed++;
        }
      } else {
        updated++;
      }
    }

    offset += limit;
    if (data.products.length < limit) break;
    if (typeof data.count === "number" && offset >= data.count) break;
  }

  console.log("\n---");
  console.log(
    `Zakończono: zaktualizowano/symulacja: ${updated}, pominięto: ${skipped}, błędy: ${failed}`,
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
