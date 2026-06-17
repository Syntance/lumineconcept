import { defineConfig, loadEnv } from "@medusajs/framework/utils";
import { getResendConfig } from "./src/lib/resend-defaults";
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

if (IS_PRODUCTION && !IS_BUILD_PHASE && !getResendConfig().configured) {
  console.warn(
    "[medusa-config] RESEND_API_KEY brak — maile transakcyjne (potwierdzenie zamówienia itd.) nie będą wysyłane.",
  );
}

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ??
  (IS_PRODUCTION
    ? "https://medusa-backend-lumineconceptpl.up.railway.app"
    : "http://localhost:9000");

const STOREFRONT_URL =
  process.env.STOREFRONT_URL ??
  process.env.STORE_CORS ??
  (IS_PRODUCTION ? "https://lumineconcept.pl" : "http://localhost:3000");

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
    maxUploadFileSize: 20 * 1024 * 1024,
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL!,
    /**
     * Connection pool + idle transaction timeout — bez tego Medusa używa
     * 10 połączeń z infinite idle timeout (wąskie gardło na Railway przy
     * concurrent cart operations). Oficjalna rekomendacja Medusy
     * (issue #5693, komentarz zespołu Medusa).
     *
     * `idle_in_transaction_session_timeout` (Postgres) + pool size w
     * `pool` (Knex/MikroORM).
     */
    databaseDriverOptions: {
      pool: {
        min: 2,
        max: 20,
      },
      // Medusa typings zawężają `connection` tylko do `{ ssl }`, ale
      // Knex/pg akceptują tu więcej opcji — rzutujemy, żeby móc ustawić
      // timeout'y transakcji (ochrona przed zakleszczeniami poola) i
      // rodzinę adresów DNS dla Railway IPv6-only internal network.
      connection: {
        statement_timeout: 30_000,
        idle_in_transaction_session_timeout: 20_000,
        /**
         * KLUCZOWE na Railway. Internal hostnames (`*.railway.internal`)
         * rezolwują się TYLKO po IPv6. node-postgres (pg) bez tego leci
         * domyślnie `family: 4` — DNS lookup timeout ~1–2 s, potem fallback
         * IPv6. Przy add-to-cart (≈10 query) narzut 10–20 s. To dokładnie
         * ten sam bug co `?family=0` w REDIS_URL, tylko po stronie Postgres.
         *
         * `family: 0` = „spróbuj IPv4 i IPv6, zwróć pierwszy który się
         * uda" (Node.js `dns.lookup` semantics).
         */
        family: 0,
      } as unknown as { ssl?: boolean },
    },
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
     * INFRASTRUKTURA REDIS — dostosowana do trybu `shared` vs split
     * ============================================================
     *
     * Pomiar `/store/custom/perf-probe` na Railway (2026-04-23) pokazał że
     * każda operacja Redis przez internal .railway.internal network zajmuje
     * ~140 ms (Redis PING, cache GET/SET, każda). To 50× wolniej niż lokalny
     * Redis (1-3 ms). Przy add-to-cart, który w Medusie robi ~30 operacji
     * (locking + pricing + cache + event emit + workflow state), daje to
     * 4-5 s narzutu sieciowego. Zgadza się z obserwacją.
     *
     * Decyzja dla `shared` mode (single-instance):
     *   ✅ locking-redis — POTRZEBNE: chroni `completeCart` przed
     *       double-submit z dwóch zakładek / restartu. 1 acquire/release
     *       per workflow = znośne (~280 ms dodatku).
     *   ❌ event-bus-redis — defaultujemy do in-memory. W single-instance
     *       BullMQ pub/sub = komunikacja sam ze sobą przez network proxy.
     *       Warning „Local Event Bus" w takim wypadku jest OK.
     *   ❌ cache-redis — defaultujemy do in-memory. Cache ma sens gdy
     *       hit jest szybszy niż miss; tutaj cache hit = 140 ms, a miss
     *       (DB select) też ~140 ms. Redis cache to negatywna wartość.
     *   ❌ workflow-engine-redis — in-memory, jak wyżej.
     *
     * Gdy pojawi się realny worker-split (server + worker = 2 instancje)
     * lub infra przeniesie się tam gdzie Redis jest w tym samym rack'u
     * (Upstash/Neon edge), wrócimy do pełnej produkcyjnej stacka.
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
          ...(WORKER_MODE === "shared"
            ? []
            : [
                {
                  key: "eventBus",
                  resolve: "@medusajs/event-bus-redis",
                  options: {
                    redisUrl: process.env.REDIS_URL,
                    jobOptions: {
                      removeOnComplete: { age: 3600, count: 1000 },
                      removeOnFail: { age: 3600, count: 1000 },
                    },
                  },
                },
                {
                  key: "workflows",
                  resolve: "@medusajs/workflow-engine-redis",
                  options: {
                    redis: { redisUrl: process.env.REDIS_URL },
                  },
                },
                {
                  key: "cache",
                  resolve: "@medusajs/cache-redis",
                  options: {
                    redisUrl: process.env.REDIS_URL,
                    namespace: "lumine_cache:",
                    ttl: 30,
                  },
                },
              ]),
        ]
      : []),
    /**
     * Dodatkowe moduły (InPost) ładowane warunkowo — dopiero gdy envy są
     * uzupełnione. Wcześniej ładowaliśmy je zawsze, co przy pustym kluczu
     * tworzyło niepotrzebny overhead na starcie i logi zaśmiecone błędami.
     *
     * UWAGA: Przelewy24 NIE jest już osobnym top-level modułem — to payment
     * provider, więc rejestrujemy go w `providers: [...]` modułu payment niżej.
     */
    ...(process.env.PAYPO_API_KEY
      ? [{
          key: "paypo",
          resolve: "./src/modules/paypo",
          options: {
            apiKey: process.env.PAYPO_API_KEY,
            sandbox: process.env.PAYPO_SANDBOX === "true",
          },
        }]
      : []),
    ...(process.env.INPOST_API_KEY
      ? [{
          key: "inpost",
          resolve: "./src/modules/inpost",
          options: {
            apiKey: process.env.INPOST_API_KEY,
            organizationId: process.env.INPOST_ORGANIZATION_ID,
            sandbox: process.env.INPOST_SANDBOX === "true",
          },
        }]
      : []),
    /**
     * Payment: wbudowany system provider („manual"/testowy) jest rejestrowany
     * automatycznie przez moduł `@medusajs/medusa/payment` jako
     * `pp_system_default`. Dodatkowe bramki (Przelewy24) dopinamy przez
     * `providers: [...]` — wyłącznie gdy envy są ustawione (feature flag).
     *
     * Provider id w Medusie: `pp_{provider.id}_{service.identifier}` =
     * `pp_przelewy24_przelewy24`. Webhook P24 (urlStatus) trafia na
     * `/hooks/payment/pp_przelewy24_przelewy24` (wbudowany routing Medusy).
     */
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          ...(process.env.PRZELEWY24_MERCHANT_ID && process.env.PRZELEWY24_API_KEY
            ? [{
                resolve: "./src/modules/przelewy24",
                id: "przelewy24",
                options: {
                  merchantId: process.env.PRZELEWY24_MERCHANT_ID,
                  posId:
                    process.env.PRZELEWY24_POS_ID ??
                    process.env.PRZELEWY24_MERCHANT_ID,
                  apiKey: process.env.PRZELEWY24_API_KEY,
                  crc: process.env.PRZELEWY24_CRC,
                  sandbox: process.env.PRZELEWY24_SANDBOX === "true",
                  backendUrl: BACKEND_URL,
                  storefrontUrl:
                    process.env.STOREFRONT_URL ?? STOREFRONT_URL,
                },
              }]
            : []),
        ],
      },
    },
    /**
     * Fulfillment: Manual + DPD.
     *
     * DPD rejestrujemy ZAWSZE, nawet bez envów — shipping option w bazie
     * (Kurier DPD) odwołuje się do `provider_id: dpd_dpd`, więc brak
     * tego providera w rejestrze wywala `POST /store/carts/:id/shipping-methods`
     * z 500 „An unknown error occurred" (Medusa nie umie rozwiązać providera).
     *
     * `DpdFulfillmentProviderService` jest bezpieczny bez konfiguracji —
     * `validateFulfillmentData` / `validateOption` / `getFulfillmentOptions`
     * to pure functions, a `createFulfillment` zwraca pusty payload
     * (generowanie prawdziwej etykiety dopinamy, gdy envy DPD_LOGIN / DPD_PASSWORD / DPD_FID
     * zostaną dostarczone przez klienta).
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
    /**
     * Meilisearch ładujemy tylko gdy mamy hosta — wcześniej domyślny
     * `http://localhost:7700` powodował że w Railway moduł cyklicznie
     * próbował łączyć się z nieistniejącym hostem (TCP SYN timeout ~1s
     * per request).
     */
    ...(process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_ADMIN_KEY
      ? [{
          key: "meilisearch",
          resolve: "./src/modules/meilisearch",
          options: {
            host: process.env.MEILISEARCH_HOST,
            adminKey: process.env.MEILISEARCH_ADMIN_KEY,
          },
        }]
      : []),
    {
      key: "product_config",
      resolve: "./src/modules/product-config",
    },
    /**
     * File storage.
     *
     * Produkcja: Cloudflare R2 (S3-compatible) — dysk Railway jest EFEMERYCZNY,
     * pliki przepadają przy każdym redeploy. R2 daje trwałe, off-site przechowywanie
     * zdjęć produktów i plików klientów. Provider `@medusajs/medusa/file-s3` jest
     * wbudowany w pakiet — bez dodatkowej zależności.
     *
     * Dev / brak konfiguracji R2: fallback na `file-local` (`/static`), żeby nie
     * blokować lokalnej pracy. Modu\u0142 file akceptuje DOK\u0141ADNIE jednego providera.
     *
     * Dla R2:
     *   S3_ENDPOINT  = https://<account_id>.r2.cloudflarestorage.com
     *   S3_REGION    = auto
     *   S3_BUCKET    = nazwa bucketa
     *   S3_FILE_URL  = publiczny URL (custom domain R2 lub https://pub-xxxx.r2.dev)
     *   S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY = token R2 (Object Read & Write)
     */
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers:
          process.env.S3_BUCKET &&
          process.env.S3_ENDPOINT &&
          process.env.S3_ACCESS_KEY_ID &&
          process.env.S3_SECRET_ACCESS_KEY
            ? [
                {
                  resolve: "@medusajs/medusa/file-s3",
                  id: "s3",
                  options: {
                    file_url: process.env.S3_FILE_URL,
                    access_key_id: process.env.S3_ACCESS_KEY_ID,
                    secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
                    region: process.env.S3_REGION ?? "auto",
                    bucket: process.env.S3_BUCKET,
                    endpoint: process.env.S3_ENDPOINT,
                    // R2 nie wspiera ACL per-obiekt — publiczny dostęp idzie
                    // przez ustawienia bucketa / custom domain, nie przez x-amz-acl.
                    additional_client_config: {
                      forcePathStyle: true,
                    },
                    prefix: process.env.S3_PREFIX ?? "",
                  },
                },
              ]
            : [
                {
                  resolve: "@medusajs/file-local",
                  id: "local",
                  options: {
                    backend_url: `${BACKEND_URL.replace(/\/$/, "")}/static`,
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
    ...(getResendConfig().configured
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
                    apiKey: getResendConfig().apiKey,
                    from: getResendConfig().from,
                    replyTo: getResendConfig().replyTo,
                  },
                },
              ],
            },
          },
        ]
      : []),
  ],
});
