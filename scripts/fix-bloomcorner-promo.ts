/**
 * Naprawia wartość kodu BLOOMCORNER w Medusie.
 *
 * Problem: kod BLOOMCORNER był stworzony gdy resolveDiscountValue wysyłało
 * grosze (×100). W Medusie zapisała się wartość 990 zamiast 9.9 (PLN).
 * Medusa v2 interpretuje application_method.value jako PLN (major units),
 * więc 990 powodowało zniżkę 990 PLN zamiast 9,90 PLN → koszyk zerował się.
 *
 * Użycie:
 *   npx tsx scripts/fix-bloomcorner-promo.ts
 *
 * Wymaga pliku scripts/fill-product-seo.env z:
 *   MEDUSA_BACKEND_URL=...
 *   MEDUSA_ADMIN_EMAIL=...
 *   MEDUSA_ADMIN_PASSWORD=...
 *
 * Opcje (env):
 *   DRY_RUN=1  — tylko podgląd, bez zapisu (domyślnie 0)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROMO_CODE = "BLOOMCORNER";
const CORRECT_VALUE_PLN = 9.9;

function loadEnvFile(name: string): void {
  const envPath = resolve(process.cwd(), `scripts/${name}`);
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

loadEnvFile("fill-product-seo.env");

const BACKEND_URL = (process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD ?? "";
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
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

type ApplicationMethod = {
  id: string;
  type: string;
  target_type: string;
  value: number;
  currency_code?: string | null;
};

type Promotion = {
  id: string;
  code: string;
  status: string;
  application_method?: ApplicationMethod | null;
};

async function findPromotion(token: string, code: string): Promise<Promotion | null> {
  const res = await fetch(
    `${BACKEND_URL}/admin/promotions?limit=200&fields=id,code,status,application_method.id,application_method.type,application_method.target_type,application_method.value,application_method.currency_code`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  if (!res.ok) {
    throw new Error(`Pobieranie promocji nie powiodło się: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { promotions: Promotion[] };
  return data.promotions.find((p) => p.code === code) ?? null;
}

async function updatePromotionValue(
  token: string,
  promotionId: string,
  method: ApplicationMethod,
  newValue: number,
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/admin/promotions/${promotionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      application_method: {
        type: method.type,
        target_type: method.target_type,
        value: newValue,
        allocation: "across",
        ...(method.type === "fixed" && method.currency_code
          ? { currency_code: method.currency_code }
          : {}),
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Aktualizacja nie powiodła się: ${res.status} ${await res.text()}`);
  }
}

async function main(): Promise<void> {
  console.log(`🔍 Szukam kodu ${PROMO_CODE} w Medusie...`);
  console.log(`   Backend: ${BACKEND_URL}`);
  if (DRY_RUN) console.log("   [DRY RUN — bez zapisu]");

  const token = await getAuthToken();
  console.log("✅ Autoryzacja OK");

  const promo = await findPromotion(token, PROMO_CODE);
  if (!promo) {
    console.error(`❌ Nie znaleziono kodu ${PROMO_CODE} w Medusie.`);
    process.exit(1);
  }

  const method = promo.application_method;
  if (!method) {
    console.error(`❌ Kod ${PROMO_CODE} nie ma application_method.`);
    process.exit(1);
  }

  console.log(`\n📋 Aktualny stan ${PROMO_CODE}:`);
  console.log(`   id: ${promo.id}`);
  console.log(`   status: ${promo.status}`);
  console.log(`   type: ${method.type}`);
  console.log(`   target_type: ${method.target_type}`);
  console.log(`   value: ${method.value} PLN`);

  if (method.type !== "fixed") {
    console.error(`❌ Kod ${PROMO_CODE} nie jest typu "fixed" (jest "${method.type}"). Skrypt nie obsługuje tego przypadku.`);
    process.exit(1);
  }

  if (method.value === CORRECT_VALUE_PLN) {
    console.log(`\n✅ Wartość jest już poprawna (${CORRECT_VALUE_PLN} PLN). Nic do zrobienia.`);
    process.exit(0);
  }

  console.log(`\n⚠️  Błędna wartość: ${method.value} PLN`);
  console.log(`   Poprawna wartość: ${CORRECT_VALUE_PLN} PLN`);

  if (DRY_RUN) {
    console.log("\n[DRY RUN] Bez zapisu. Ustaw DRY_RUN=0 żeby zapisać.");
    process.exit(0);
  }

  console.log("\n✏️  Aktualizuję wartość...");
  await updatePromotionValue(token, promo.id, method, CORRECT_VALUE_PLN);

  console.log(`\n✅ BLOOMCORNER zaktualizowany: ${method.value} PLN → ${CORRECT_VALUE_PLN} PLN`);
  console.log("   Kod rabatowy będzie teraz odejmować 9,90 PLN zamiast zerować koszyk.");
}

main().catch((err) => {
  console.error("❌ Błąd:", err instanceof Error ? err.message : err);
  process.exit(1);
});
