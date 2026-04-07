import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Opcjonalny plik z sekretami (nie commituj): scripts/sync-medusa-product.env */
function loadOptionalEnvFile(): void {
  const envPath = resolve(process.cwd(), "scripts/sync-medusa-product.env");
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
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadOptionalEnvFile();

/**
 * Synchronizuje produkt z lokalnego (lub dowolnego) Medusa do docelowego:
 * metadata (colorRegions, links_count, configuratorBaseImage), opcje produktu
 * oraz warianty z cenami — tak aby konfigurator na storefront był identyczny jak w źródle.
 *
 * Wymaga: ten sam `handle` produktu po obu stronach.
 *
 * Użycie:
 *   npx tsx scripts/sync-medusa-product-from-source.ts
 *   npx tsx scripts/sync-medusa-product-from-source.ts heksagon-3d-qr inny-handle
 *
 * Zmienne środowiskowe:
 *   MEDUSA_SOURCE_URL       – źródło (domyślnie http://localhost:9000)
 *   MEDUSA_TARGET_URL       – docelowy backend (np. https://xxx.up.railway.app) — WYMAGANE
 *   MEDUSA_ADMIN_EMAIL      – email admina (wspólny dla obu, jeśli nie podano osobno)
 *   MEDUSA_ADMIN_PASSWORD
 *   MEDUSA_SOURCE_ADMIN_EMAIL / MEDUSA_SOURCE_ADMIN_PASSWORD — opcjonalnie
 *   MEDUSA_TARGET_ADMIN_EMAIL / MEDUSA_TARGET_ADMIN_PASSWORD — opcjonalnie
 *
 * Opcjonalnie:
 *   SYNC_HANDLES            – lista handle oddzielonych przecinkami (jeśli brak argumentów CLI)
 */

const SOURCE_URL = (process.env.MEDUSA_SOURCE_URL ?? "http://localhost:9000").replace(
  /\/$/,
  "",
);
const TARGET_URL = (process.env.MEDUSA_TARGET_URL ?? "").replace(/\/$/, "");

const SOURCE_EMAIL =
  process.env.MEDUSA_SOURCE_ADMIN_EMAIL ?? process.env.MEDUSA_ADMIN_EMAIL ?? "";
const SOURCE_PASSWORD =
  process.env.MEDUSA_SOURCE_ADMIN_PASSWORD ?? process.env.MEDUSA_ADMIN_PASSWORD ?? "";
const TARGET_EMAIL =
  process.env.MEDUSA_TARGET_ADMIN_EMAIL ?? process.env.MEDUSA_ADMIN_EMAIL ?? "";
const TARGET_PASSWORD =
  process.env.MEDUSA_TARGET_ADMIN_PASSWORD ?? process.env.MEDUSA_ADMIN_PASSWORD ?? "";

function normalizeUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

async function getAuthToken(
  baseUrl: string,
  email: string,
  password: string,
): Promise<string> {
  const res = await fetch(normalizeUrl(baseUrl, "/auth/user/emailpass"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Auth failed (${baseUrl}): ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { token: string };
  return data.token;
}

async function adminFetch(
  baseUrl: string,
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const res = await fetch(normalizeUrl(baseUrl, path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Admin API ${options.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

interface ProductListItem {
  id: string;
  handle: string;
  title: string;
}

async function findProductByHandle(
  baseUrl: string,
  token: string,
  handle: string,
): Promise<ProductListItem | null> {
  let offset = 0;
  const limit = 100;
  while (true) {
    const data = (await adminFetch(
      baseUrl,
      token,
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle`,
    )) as { products: ProductListItem[]; count: number };
    const found = data.products.find((p) => p.handle === handle);
    if (found) return found;
    offset += limit;
    if (offset >= data.count || data.products.length === 0) return null;
  }
}

interface AdminOption {
  id: string;
  title: string;
  values: Array<{ id: string; value: string }>;
}

interface AdminPrice {
  currency_code?: string;
  amount?: number;
  rules?: { region_id?: string } | null;
}

interface AdminVariant {
  id: string;
  title: string;
  sku?: string | null;
  options?: unknown;
  prices?: AdminPrice[];
  manage_inventory?: boolean;
  allow_backorder?: boolean;
  metadata?: Record<string, unknown> | null;
}

interface AdminProduct {
  id: string;
  title: string;
  handle: string;
  metadata?: Record<string, unknown> | null;
  options: AdminOption[];
  variants: AdminVariant[];
  images?: Array<{ id?: string; url: string }>;
}

async function getProduct(
  baseUrl: string,
  token: string,
  id: string,
): Promise<AdminProduct> {
  const data = (await adminFetch(baseUrl, token, `/admin/products/${id}`)) as {
    product: AdminProduct;
  };
  return data.product;
}

function variantOptionsToRecord(variant: AdminVariant): Record<string, string> {
  const opts = variant.options;
  if (opts && typeof opts === "object" && !Array.isArray(opts)) {
    return opts as Record<string, string>;
  }
  if (Array.isArray(opts)) {
    const rec: Record<string, string> = {};
    for (const row of opts) {
      if (row && typeof row === "object") {
        const o = row as {
          option?: { title?: string };
          value?: string;
        };
        const t = o.option?.title;
        const v = o.value;
        if (t && v) rec[t] = v;
      }
    }
    return rec;
  }
  return {};
}

function mapPricesForCreate(prices: AdminPrice[] | undefined): Array<{
  currency_code: string;
  amount: number;
  rules?: { region_id: string };
}> {
  if (!Array.isArray(prices) || prices.length === 0) {
    return [{ currency_code: "pln", amount: 0 }];
  }
  return prices.map((p) => {
    const raw = p as AdminPrice & { raw_amount?: number | string };
    const amount = Number(
      raw.amount ?? raw.raw_amount ?? 0,
    );
    const out: {
      currency_code: string;
      amount: number;
      rules?: { region_id: string };
    } = {
      currency_code: String(p.currency_code ?? "pln").toLowerCase(),
      amount,
    };
    if (p.rules?.region_id) {
      out.rules = { region_id: p.rules.region_id };
    }
    return out;
  });
}

/**
 * Zamienia localhost w configuratorBaseImage na pierwszy obraz z docelowego produktu (Cloudinary).
 */
function transformMetadata(
  meta: Record<string, unknown> | null | undefined,
  targetProduct: AdminProduct,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(meta ?? {}) };
  const base = out.configuratorBaseImage;
  if (typeof base === "string" && (base.includes("localhost") || base.includes("127.0.0.1"))) {
    const fallback = targetProduct.images?.[0]?.url;
    if (fallback) {
      out.configuratorBaseImage = fallback;
    } else {
      delete out.configuratorBaseImage;
    }
  }
  return out;
}

async function deleteVariant(
  baseUrl: string,
  token: string,
  productId: string,
  variantId: string,
): Promise<void> {
  await adminFetch(baseUrl, token, `/admin/products/${productId}/variants/${variantId}`, {
    method: "DELETE",
  });
}

async function updateProductCore(
  baseUrl: string,
  token: string,
  productId: string,
  body: Record<string, unknown>,
): Promise<void> {
  await adminFetch(baseUrl, token, `/admin/products/${productId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function createVariant(
  baseUrl: string,
  token: string,
  productId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await adminFetch(baseUrl, token, `/admin/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function buildOptionsPayload(options: AdminOption[]): Array<{ title: string; values: string[] }> {
  return options.map((o) => ({
    title: o.title,
    values: o.values.map((v) => v.value),
  }));
}

function buildVariantCreatePayload(
  sourceVariant: AdminVariant,
  allOptions: AdminOption[],
): Record<string, unknown> {
  const options = variantOptionsToRecord(sourceVariant);

  for (const opt of allOptions) {
    if (!options[opt.title] && opt.values.length > 0) {
      options[opt.title] = opt.values[0].value;
    }
  }

  const prices = mapPricesForCreate(sourceVariant.prices);
  return {
    title: sourceVariant.title,
    sku: sourceVariant.sku ?? undefined,
    manage_inventory: sourceVariant.manage_inventory ?? false,
    allow_backorder: sourceVariant.allow_backorder ?? false,
    metadata: sourceVariant.metadata ?? undefined,
    prices,
    options: Object.keys(options).length > 0 ? options : undefined,
  };
}

async function syncOneHandle(
  sourceToken: string,
  targetToken: string,
  handle: string,
): Promise<void> {
  console.log(`\n── Produkt handle: ${handle} ──`);

  const srcList = await findProductByHandle(SOURCE_URL, sourceToken, handle);
  const tgtList = await findProductByHandle(TARGET_URL, targetToken, handle);
  if (!srcList) {
    console.error(`  ✗ Brak produktu o handle "${handle}" na źródle (${SOURCE_URL})`);
    return;
  }
  if (!tgtList) {
    console.error(`  ✗ Brak produktu o handle "${handle}" na celu (${TARGET_URL})`);
    return;
  }

  const source = await getProduct(SOURCE_URL, sourceToken, srcList.id);
  const target = await getProduct(TARGET_URL, targetToken, tgtList.id);

  const metadata = transformMetadata(source.metadata ?? null, target);

  console.log(`  Źródło: ${source.title} (${source.variants.length} wariantów, ${source.options.length} opcji)`);
  console.log(`  Cel:    ${target.title} (${target.variants.length} wariantów, ${target.options.length} opcji)`);

  // 1) Usuń wszystkie warianty na celu
  console.log("  → Usuwanie wariantów na serwerze docelowym...");
  for (const v of [...target.variants]) {
    await deleteVariant(TARGET_URL, targetToken, target.id, v.id);
    console.log(`     usunięto wariant ${v.id}`);
  }

  // 2) Ustaw opcje + metadata
  const optionsPayload = buildOptionsPayload(source.options);
  console.log("  → Aktualizacja opcji i metadanych...");
  await updateProductCore(TARGET_URL, targetToken, target.id, {
    metadata,
    options: optionsPayload,
  });

  // 3) Utwórz warianty ze źródła
  console.log(`  → Tworzenie ${source.variants.length} wariantów...`);
  for (const v of source.variants) {
    const payload = buildVariantCreatePayload(v, source.options);
    if (!payload.prices || (payload.prices as unknown[]).length === 0) {
      console.warn(`     ! Pominięto wariant bez cen: ${v.title}`);
      continue;
    }
    await createVariant(TARGET_URL, targetToken, target.id, payload);
    console.log(`     ✓ ${v.title}`);
  }

  console.log("  ✓ Zakończono synchronizację produktu.");
}

async function main() {
  const cliHandles = process.argv.slice(2).filter(Boolean);
  const envHandles = (process.env.SYNC_HANDLES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const handles = cliHandles.length > 0 ? cliHandles : envHandles;

  if (!TARGET_URL) {
    console.error("Ustaw MEDUSA_TARGET_URL (URL hostowanego Medusa).");
    process.exit(1);
  }
  if (!SOURCE_EMAIL || !SOURCE_PASSWORD) {
    console.error(
      "Ustaw MEDUSA_ADMIN_EMAIL i MEDUSA_ADMIN_PASSWORD (źródło),\n" +
        "albo utwórz plik scripts/sync-medusa-product.env (wzór: scripts/sync-medusa-product.env.example).",
    );
    process.exit(1);
  }
  if (!TARGET_EMAIL || !TARGET_PASSWORD) {
    console.error(
      "Ustaw dane logowania admina dla celu (np. MEDUSA_TARGET_* lub wspólne MEDUSA_ADMIN_*),\n" +
        "albo plik scripts/sync-medusa-product.env.",
    );
    process.exit(1);
  }
  if (handles.length === 0) {
    console.error(
      "Podaj handle(e) jako argumenty lub SYNC_HANDLES=heksagon-3d-qr,drugi-handle",
    );
    process.exit(1);
  }

  console.log(`Źródło: ${SOURCE_URL}`);
  console.log(`Cel:    ${TARGET_URL}`);

  const sourceToken = await getAuthToken(SOURCE_URL, SOURCE_EMAIL, SOURCE_PASSWORD);
  const targetToken = await getAuthToken(TARGET_URL, TARGET_EMAIL, TARGET_PASSWORD);

  for (const h of handles) {
    await syncOneHandle(sourceToken, targetToken, h);
  }

  console.log(
    "\nGotowe. Na Vercelu odśwież cache strony produktu (redeploy lub odczekaj TTL cache Next.js).",
  );
}

main().catch((err) => {
  console.error("Błąd:", err);
  process.exit(1);
});
