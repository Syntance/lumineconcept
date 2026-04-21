import { defineConfig, loadEnv } from "@medusajs/framework/utils";
import { initSentry } from "./src/lib/sentry";

loadEnv(process.env.NODE_ENV ?? "development", process.cwd());

// Sentry musi się podnieść zanim podniesiemy moduły Medusy — w przeciwnym
// razie nie złapie błędów ładowania providerów / workerów.
initSentry();

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Fail-fast ma sens tylko gdy faktycznie startujemy serwer w produkcji.
 * Podczas `medusa build` w obrazie Dockera Railway przekazuje `NODE_ENV=production`
 * ale nie podaje sekretów (bo build nie potrzebuje Postgres/Redis — dostaje
 * placeholdery). Bez tego guardu build się wywala z fail-fast na JWT/COOKIE
 * i cały deploy pada. Poznajemy build po: (a) argv zawiera „build", lub
 * (b) DATABASE_URL to znany placeholder.
 */
const IS_BUILD_PHASE =
  process.argv.some((arg) => arg === "build") ||
  /placeholder/i.test(process.env.DATABASE_URL ?? "");

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ??
  (IS_PRODUCTION
    ? "https://medusa-backend-lumineconceptpl.up.railway.app"
    : "http://localhost:9000");

const STOREFRONT_URL =
  process.env.STORE_CORS ??
  (IS_PRODUCTION ? "https://lumine.syntance.dev" : "http://localhost:3000");

/**
 * Fail-fast: żaden realny deploy nie ma prawa wystartować z domyślnym,
 * publicznie znanym sekretem. W devie używamy placeholdera — tu go nie
 * tykamy, ale w produkcji rzucamy czytelnym błędem na starcie, zanim
 * Medusa zdąży podnieść cokolwiek.
 */
const PLACEHOLDER_SECRET = "supersecret-change-me";
function resolveSecret(name: "JWT_SECRET" | "COOKIE_SECRET"): string {
  const value = process.env[name];
  if (!value || value === PLACEHOLDER_SECRET) {
    // W fazie buildu placeholder jest OK — build'owi i tak nie robi różnicy.
    if (IS_PRODUCTION && !IS_BUILD_PHASE) {
      throw new Error(
        `[medusa-config] ${name} jest niezdefiniowany lub zawiera domyślny placeholder. ` +
          "Ustaw silny sekret w zmiennych środowiskowych przed deployem.",
      );
    }
    return PLACEHOLDER_SECRET;
  }
  return value;
}

export default defineConfig({
  admin: {
    disable: false,
    backendUrl: BACKEND_URL,
    maxUploadFileSize: 10 * 1024 * 1024,
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL!,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: STOREFRONT_URL,
      adminCors:
        process.env.ADMIN_CORS ?? `${BACKEND_URL},${STOREFRONT_URL}`,
      authCors:
        process.env.AUTH_CORS ?? `${BACKEND_URL},${STOREFRONT_URL}`,
      jwtSecret: resolveSecret("JWT_SECRET"),
      cookieSecret: resolveSecret("COOKIE_SECRET"),
    },
  },
  modules: [
    {
      key: "przelewy24",
      resolve: "./src/modules/przelewy24",
      options: {
        merchantId: process.env.PRZELEWY24_MERCHANT_ID,
        posId: process.env.PRZELEWY24_POS_ID,
        apiKey: process.env.PRZELEWY24_API_KEY,
        crc: process.env.PRZELEWY24_CRC,
        sandbox: process.env.PRZELEWY24_SANDBOX === "true",
      },
    },
    {
      key: "paypo",
      resolve: "./src/modules/paypo",
      options: {
        apiKey: process.env.PAYPO_API_KEY,
        sandbox: process.env.PAYPO_SANDBOX === "true",
      },
    },
    {
      key: "inpost",
      resolve: "./src/modules/inpost",
      options: {
        apiKey: process.env.INPOST_API_KEY,
        organizationId: process.env.INPOST_ORGANIZATION_ID,
        sandbox: process.env.INPOST_SANDBOX === "true",
      },
    },
    /**
     * Payment: wbudowany system provider („manual"/testowy). Bez rejestracji
     * tego modułu Medusa nie ma *żadnego* payment providera, przez co
     * `initiatePaymentSession` / `cart.complete` wywala się generycznym
     * „An unknown error occurred". Prawdziwe bramki (P24/PayPo) dopinamy
     * osobnymi providerami po testach.
     */
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment/providers/system",
            id: "default",
          },
        ],
      },
    },
    /**
     * Fulfillment: Manual (testy) + DPD (kurier — opcje w Admin → Shipping).
     * Stary moduł `./src/modules/dpd` zastąpiony providerem zgodnym z Medusa v2.
     */
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/fulfillment-manual",
            id: "manual",
          },
          {
            resolve: "./src/modules/dpd-fulfillment",
            id: "dpd",
            options: {
              login: process.env.DPD_LOGIN,
              password: process.env.DPD_PASSWORD,
              fid: process.env.DPD_FID,
            },
          },
        ],
      },
    },
    {
      key: "meilisearch",
      resolve: "./src/modules/meilisearch",
      options: {
        host: process.env.MEILISEARCH_HOST ?? "http://localhost:7700",
        adminKey: process.env.MEILISEARCH_ADMIN_KEY,
      },
    },
    {
      key: "product_config",
      resolve: "./src/modules/product-config",
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "./src/modules/cloudinary-file",
            id: "cloudinary",
            options: {
              cloudName: process.env.CLOUDINARY_CLOUD_NAME,
              apiKey: process.env.CLOUDINARY_API_KEY,
              apiSecret: process.env.CLOUDINARY_API_SECRET,
              folder: "lumine-products",
            },
          },
        ],
      },
    },
    /**
     * Notification: Medusa nie wysyła maili bez zarejestrowanego modułu
     * `notification` + providera. Używamy Resend (prosty DX, 3000 maili/mies
     * za darmo). Jeśli brakuje RESEND_API_KEY — moduł nie jest ładowany
     * (w dev nie wymuszamy, żeby nie blokować startu).
     */
    ...(process.env.RESEND_API_KEY
      ? [
          {
            resolve: "@medusajs/medusa/notification",
            options: {
              providers: [
                {
                  resolve: "./src/modules/notification-resend",
                  id: "resend",
                  options: {
                    // Kanały, do których ten provider może wysyłać. Medusa v2
                    // w `notification module` kieruje maile po `channel`
                    // — musimy zadeklarować `email`, żeby `send({ channel: "email" })`
                    // trafiło do Resenda.
                    channels: ["email"],
                    apiKey: process.env.RESEND_API_KEY,
                    from:
                      process.env.RESEND_FROM ??
                      "Lumine Concept <onboarding@resend.dev>",
                    replyTo: process.env.RESEND_REPLY_TO,
                  },
                },
              ],
            },
          },
        ]
      : []),
  ],
});
