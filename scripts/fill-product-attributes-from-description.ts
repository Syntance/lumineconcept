/**
 * Uzupełnia atrybuty produktów w Medusie na podstawie opisu:
 * - metadata.atrybuty: format "20x30" / "30x20x13" / "A5"
 * - metadata.wymiary: surowa etykieta wymiaru
 * - width/height/length: wartości liczbowe (jeśli da się wyciągnąć)
 *
 * Użycie:
 *   pnpm fill-product-attributes
 *
 * Opcje (env):
 *   DRY_RUN=1         — tylko podgląd, bez zapisu
 *   FORCE=1           — nadpisuj także już ustawione metadata.atrybuty
 *   SKIP_IF_SET=0     — domyślnie 1: pomiń produkt z już ustawionym metadata.atrybuty
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { extractDimensionsFromProductDescription } from "../apps/storefront/lib/products/dimensions";

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
    throw new Error(`Admin API ${options.method ?? "GET"} ${path} -> ${res.status}: ${await res.text()}`);
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
  description: string | null;
  metadata: Record<string, unknown> | null;
  width?: number | null;
  height?: number | null;
  length?: number | null;
}

function normalizeAttributeLabel(raw: string): string {
  const t = raw
    .replace(/\s+/g, " ")
    .replace(/[×X]/g, "x")
    .replace(/\s*x\s*/g, "x")
    .replace(/\s*(cm|mm)\b/gi, "")
    .trim();
  return t;
}

function parseNumericParts(attribute: string): number[] {
  if (!attribute.includes("x")) return [];
  return attribute
    .split("x")
    .map((p) => p.trim().replace(",", "."))
    .map((p) => Number(p))
    .filter((n) => Number.isFinite(n) && n > 0);
}

async function run() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Brak MEDUSA_ADMIN_EMAIL lub MEDUSA_ADMIN_PASSWORD.");
    process.exit(1);
  }

  console.log(`Backend: ${BACKEND_URL}`);
  console.log(
    `Tryb: ${DRY_RUN ? "DRY RUN" : "ZAPIS"} | FORCE=${FORCE} | SKIP_IF_SET=${SKIP_IF_SET}\n`,
  );

  const token = await getAuthToken();
  let offset = 0;
  const limit = 50;
  let updated = 0;
  let skipped = 0;
  let noMatch = 0;
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
      const existingAttr =
        typeof meta.atrybuty === "string" ? meta.atrybuty.trim() : "";

      if (SKIP_IF_SET && existingAttr && !FORCE) {
        console.log(`[SKIP ma atrybuty] ${p.title} (${p.handle}) -> "${existingAttr}"`);
        skipped++;
        continue;
      }

      const spec = meta.specyfikacja;
      const extracted = extractDimensionsFromProductDescription(
        p.description,
        typeof spec === "string" ? spec : undefined,
      );

      if (!extracted) {
        console.log(`[BRAK WZORCA] ${p.title} (${p.handle})`);
        noMatch++;
        continue;
      }

      const atrybuty = normalizeAttributeLabel(extracted);
      const numeric = parseNumericParts(atrybuty);

      const body: Record<string, unknown> = {
        metadata: {
          ...meta,
          wymiary: extracted,
          atrybuty,
        },
      };

      if (numeric.length >= 2) {
        body.width = numeric[0];
        body.height = numeric[1];
        if (numeric.length >= 3) body.length = numeric[2];
      }

      console.log(
        `[${DRY_RUN ? "DRY" : "UPDATE"}] ${p.title} (${p.handle})\n  -> atrybuty: ${atrybuty}`,
      );

      if (!DRY_RUN) {
        try {
          await adminFetch(token, `/admin/products/${p.id}`, {
            method: "POST",
            body: JSON.stringify(body),
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
    `Zakończono: zaktualizowano/symulacja: ${updated}, pominięto: ${skipped}, brak dopasowania: ${noMatch}, błędy: ${failed}`,
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
