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

/**
 * Produkcyjny worker mode — wg oficjalnych docs Medusy v2 deployujemy
 * dwie instancje tej samej aplikacji:
 *   - `server` — obsługuje API i panel admin,
 *   - `worker` — konsumuje kolejkę event-bus-redis i workflow-engine-redis
 *     (subscribery, scheduled jobs, retry workflow'ów).
 * Bez splitu HTTP requesty i background jobs walczą o ten sam event loop
 * (= źródło 30 s zawisu `completeCart`). `shared` zostaje tylko w devie.
 */
const WORKER_MODE = (process.env.MEDUSA_WORKER_MODE ??
  "shared") as "shared" | "server" | "worker";

/**
 * Admin budujemy i serwujemy tylko na instancji `server`. Na workerze jest
 * bezsensowny balast (wolniejszy boot, bundle ~70 MB). `DISABLE_MEDUSA_ADMIN`
 * jest standardowym envem zalecanym przez docs.
 */
const ADMIN_DISABLED =
  process.env.DISABLE_MEDUSA_ADMIN === "true" || WORKER_MODE === "worker";

export default defineConfig({
  admin: {
    disable: ADMIN_DISABLED,
    backendUrl: BACKEND_URL,
    maxUploadFileSize: 10 * 1024 * 1024,
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL!,
    redisUrl: process.env.REDIS_URL,
    workerMode: WORKER_MODE,
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
    /**
     * ============================================================
     * PRODUKCYJNA INFRASTRUKTURA REDIS — wg oficjalnego guide'a
     * https://docs.medusajs.com/learn/deployment/general
     * ============================================================
     *
     * 4 moduły Redis (wszystkie required w produkcji wg Medusy):
     *   1. locking-redis     — krótki TTL, waiter timeout (zamiast 30 s default)
     *   2. event-bus-redis   — pub/sub eventów przez BullMQ (async subscribery)
     *   3. workflow-engine-redis — state workflow w Redis (crash-safe, retryable)
     *   4. cache-redis       — query cache dla produktów / opcji dostawy
     *
     * Bez tego `completeCart` trzyma state workflow w pamięci procesu —
     * każdy wolny step blokuje cały event loop.
     */
    ...(process.env.REDIS_URL
      ? [
          {
            resolve: "@medusajs/medusa/locking",
            options: {
              providers: [
                {
                  resolve: "@medusajs/locking-redis",
                  id: "locking-redis",
                  is_default: true,
                  options: {
                    redisUrl: process.env.REDIS_URL,
                    namespace: "lumine_lock:",
                  },
                },
              ],
            },
          },
          {
            // Medusa v2 oczekuje klucza `eventBus` (Modules.EVENT_BUS),
            // inaczej wywala "Module ... doesn't have a serviceName".
            key: "eventBus",
            resolve: "@medusajs/event-bus-redis",
            options: {
              redisUrl: process.env.REDIS_URL,
              // Retencja jobów w BullMQ — zalecane przez docs, żeby kolejka
              // nie rosła w nieskończoność (1h / 1000 wpisów bufor).
              jobOptions: {
                removeOnComplete: { age: 3600, count: 1000 },
                removeOnFail: { age: 3600, count: 1000 },
              },
            },
          },
          {
            // Workflow engine trzyma stan kroków `completeCart`, `placeOrder`
            // itp. Domyślny `workflow-engine-inmemory` = stan w RAM procesu.
            // Wersja Redis zapisuje stan w kolejce BullMQ i jest crash-safe:
            // jeśli proces zginie w połowie workflow, inny (worker) dokończy.
            key: "workflows",
            resolve: "@medusajs/workflow-engine-redis",
            options: {
              redis: {
                url: process.env.REDIS_URL,
              },
            },
          },
          {
            // Query cache dla cart / product / shipping. Bez tego każdy
            // `retrieveCart` robi pełny JOIN z Postgres — ~40–120 ms.
            // Z Redis cache ~3 ms hit.
            key: "cache",
            resolve: "@medusajs/cache-redis",
            options: {
              redisUrl: process.env.REDIS_URL,
              namespace: "lumine_cache:",
              ttl: 30, // sekund — bezpieczny domyślny TTL
            },
          },
        ]
      : []),
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
      // Medusa v2.13 automatycznie rejestruje wbudowany `SystemPaymentProvider`
      // jako `pp_system_default` (patrz `@medusajs/payment/dist/loaders/providers.js`).
      // Próba ręcznej rejestracji via `resolve` wywołuje błąd
      // "moduleProviderServices is not iterable", bo wbudowany provider nie jest
      // opakowany w `ModuleProvider(...)`. Dodatkowe providery (np. Przelewy24)
      // podłączamy warunkowo przez `providers: [...]`.
      resolve: "@medusajs/medusa/payment",
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
