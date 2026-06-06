/**
 * Skrypt weryfikacji konfiguracji Cloudflare R2.
 *
 * Uruchom z katalogu głównego monorepo:
 *   pnpm verify-r2
 *
 * Skrypt sprawdza:
 *  1. Czy wszystkie zmienne S3_* są ustawione.
 *  2. Czy można połączyć się z buckietem (testowy PUT + GET + DELETE).
 *  3. Czy publiczny URL (S3_FILE_URL) zwraca HTTP 200 dla testowego pliku.
 *
 * Zmienne odczytywane (z ENV lub pliku scripts/r2.env):
 *   S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_FILE_URL
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(resolve(process.cwd(), "scripts/r2.env"));
loadEnvFile(resolve(process.cwd(), "apps/backend/.env"));

// ─── dynamiczny import SDK (nie jest w zależnościach root) ───────────────────
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } =
  await import("@aws-sdk/client-s3").catch(() => {
    console.error(
      "❌  Brak pakietu @aws-sdk/client-s3. Uruchom: pnpm --filter @lumine/backend install",
    );
    process.exit(1);
  });

// ─── 1. Walidacja zmiennych ──────────────────────────────────────────────────

type EnvKey = "S3_ENDPOINT" | "S3_REGION" | "S3_BUCKET" | "S3_ACCESS_KEY_ID" | "S3_SECRET_ACCESS_KEY" | "S3_FILE_URL";

const required: EnvKey[] = [
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_FILE_URL",
];

console.log("\n🔍  Weryfikacja zmiennych środowiskowych R2:");
const missing: string[] = [];
for (const key of required) {
  const val = process.env[key];
  if (!val) {
    console.log(`  ✗  ${key}  — BRAK`);
    missing.push(key);
  } else {
    const masked =
      key.includes("SECRET") || key.includes("ACCESS_KEY_ID")
        ? val.slice(0, 4) + "****" + val.slice(-4)
        : val;
    console.log(`  ✓  ${key} = ${masked}`);
  }
}

if (missing.length > 0) {
  console.error(`\n❌  Brakujące zmienne: ${missing.join(", ")}`);
  console.error(
    "   Ustaw je na Railway (backend) i Vercel (storefront), lub w scripts/r2.env do testów lokalnych.",
  );
  process.exit(1);
}

// ─── 2. Test PUT / GET / DELETE ──────────────────────────────────────────────

const endpoint = process.env.S3_ENDPOINT!.trim();
const region = process.env.S3_REGION!.trim() || "auto";
const bucket = process.env.S3_BUCKET!.trim();
const accessKeyId = process.env.S3_ACCESS_KEY_ID!.trim();
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY!.trim();
const fileUrl = process.env.S3_FILE_URL!.replace(/\/$/, "").trim();

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

const testKey = `_verify-r2-test-${Date.now()}.txt`;
const testBody = `lumine-r2-verify ok ${new Date().toISOString()}`;

console.log(`\n📤  PUT  s3://${bucket}/${testKey} …`);
try {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: testBody,
      ContentType: "text/plain",
    }),
  );
  console.log("  ✓  Zapis do bucketu OK");
} catch (err) {
  console.error("  ✗  Zapis nieudany:", (err as Error).message);
  console.error(
    "\n  Wskazówki:\n  • Sprawdź S3_ENDPOINT (format: https://<account_id>.r2.cloudflarestorage.com)\n  • Sprawdź czy token ma uprawnienia Object Read & Write na tym buckecie",
  );
  process.exit(1);
}

console.log(`\n📥  GET  s3://${bucket}/${testKey} …`);
try {
  const resp = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: testKey }),
  );
  const body = await resp.Body?.transformToString();
  if (body !== testBody) throw new Error("Treść pliku nie zgadza się");
  console.log("  ✓  Odczyt z bucketu OK");
} catch (err) {
  console.error("  ✗  Odczyt nieudany:", (err as Error).message);
  process.exit(1);
}

// ─── 3. Test publicznego URL ─────────────────────────────────────────────────

console.log(`\n🌐  GET  ${fileUrl}/${testKey} …`);
try {
  const res = await fetch(`${fileUrl}/${testKey}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (res.ok) {
    console.log(`  ✓  Publiczny URL dostępny (HTTP ${res.status})`);
  } else if (res.status === 403 || res.status === 401) {
    console.warn(
      `  ⚠  HTTP ${res.status} — bucket może nie mieć włączonego publicznego dostępu.`,
    );
    console.warn(
      "     Cloudflare Dashboard → R2 → bucket → Settings → Public access → Enable r2.dev subdomain",
    );
    console.warn(
      "     lub podłącz Custom Domain i wpisz go jako S3_FILE_URL.",
    );
  } else {
    console.warn(`  ⚠  HTTP ${res.status} — nieoczekiwana odpowiedź.`);
  }
} catch (err) {
  console.warn("  ⚠  Nie można sprawdzić publicznego URL:", (err as Error).message);
  console.warn(
    "     Sprawdź czy S3_FILE_URL jest poprawny i czy bucket ma publiczny dostęp.",
  );
}

// ─── 4. Sprzątanie ──────────────────────────────────────────────────────────

console.log(`\n🗑   DELETE  s3://${bucket}/${testKey} …`);
try {
  await client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: testKey }),
  );
  console.log("  ✓  Usunięcie OK");
} catch (err) {
  console.warn("  ⚠  Usunięcie testowego pliku nieudane (niegroźne):", (err as Error).message);
}

console.log("\n✅  Konfiguracja R2 poprawna — połączenie działa.\n");
