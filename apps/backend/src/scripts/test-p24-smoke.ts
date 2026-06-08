import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Smoke test Przelewy24 — rejestracja transakcji 1 zł bez pełnego checkoutu.
 * Uruchom: pnpm --filter @lumine/backend exec:ts ./src/scripts/test-p24-smoke.ts
 * (albo: cd apps/backend && npx tsx src/scripts/test-p24-smoke.ts)
 */

function loadEnvFile(path: string) {
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* brak pliku */
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));

const merchantId = process.env.PRZELEWY24_MERCHANT_ID?.trim();
const posId = (process.env.PRZELEWY24_POS_ID ?? merchantId)?.trim();
const apiKey = process.env.PRZELEWY24_API_KEY?.trim();
const crc = process.env.PRZELEWY24_CRC?.trim();
const sandbox = process.env.PRZELEWY24_SANDBOX === "true";
const backendUrl =
  process.env.MEDUSA_BACKEND_URL?.trim() ?? "http://localhost:9000";
const storefrontUrl =
  process.env.STOREFRONT_URL?.trim() ?? "http://localhost:3000";

if (!merchantId || !posId || !apiKey || !crc) {
  console.error(
    "[test-p24] Brak PRZELEWY24_MERCHANT_ID / POS_ID / API_KEY / CRC w apps/backend/.env",
  );
  process.exit(1);
}

const host = sandbox
  ? "https://sandbox.przelewy24.pl"
  : "https://secure.przelewy24.pl";

function sign(payload: Record<string, string | number>): string {
  return crypto.createHash("sha384").update(JSON.stringify(payload)).digest("hex");
}

async function main() {
  const sessionId = `p24_test_${Date.now()}`;
  const amount = 100;
  const currency = "PLN";
  const cartId = "cart_smoke_test";

  const urlStatus = `${backendUrl.replace(/\/$/, "")}/hooks/payment/pp_przelewy24_przelewy24`;
  const urlReturn = `${storefrontUrl.replace(/\/$/, "")}/checkout/przelewy24/return?cart_id=${encodeURIComponent(cartId)}`;

  const registerSign = sign({
    sessionId,
    merchantId: Number(merchantId),
    amount,
    currency,
    crc,
  });

  console.log("[test-p24] Tryb:", sandbox ? "SANDBOX" : "PRODUKCJA");
  console.log("[test-p24] urlStatus:", urlStatus);
  console.log("[test-p24] urlReturn:", urlReturn);

  const credentials = Buffer.from(`${posId}:${apiKey}`).toString("base64");
  const res = await fetch(`${host}/api/v1/transaction/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      merchantId: Number(merchantId),
      posId: Number(posId),
      sessionId,
      amount,
      currency,
      description: "Smoke test Lumine P24",
      email: "test+p24@lumineconcept.test",
      country: "PL",
      language: "pl",
      urlReturn,
      urlStatus,
      sign: registerSign,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[test-p24] register FAILED HTTP ${res.status}`);
    console.error(text);
    process.exit(1);
  }

  const parsed = JSON.parse(text) as { data?: { token?: string } };
  const token = parsed.data?.token;
  if (!token) {
    console.error("[test-p24] Brak tokenu w odpowiedzi:", text);
    process.exit(1);
  }

  const redirectUrl = `${host}/trnRequest/${token}`;
  console.log("[test-p24] OK — token otrzymany");
  console.log("[test-p24] Panel płatności:", redirectUrl);
  console.log(
    "[test-p24] Otwórz URL w przeglądarce i dokończ płatność testową (sandbox) lub 1 zł (produkcja).",
  );
  if (backendUrl.includes("localhost") || storefrontUrl.includes("localhost")) {
    console.warn(
      "[test-p24] UWAGA: localhost w urlStatus/urlReturn — webhook P24 nie dotrze do dev bez tunelu (ngrok / Cloudflare Tunnel).",
    );
  }
}

main().catch((e) => {
  console.error("[test-p24] Błąd:", e instanceof Error ? e.message : e);
  process.exit(1);
});
