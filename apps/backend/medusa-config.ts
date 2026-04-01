import { defineConfig, loadEnv } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV ?? "development", process.cwd());

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ??
  (IS_PRODUCTION
    ? "https://medusa-backend-lumineconceptpl.up.railway.app"
    : "http://localhost:9000");

const STOREFRONT_URL =
  process.env.STORE_CORS ??
  (IS_PRODUCTION ? "https://lumine.syntance.dev" : "http://localhost:3000");

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
      jwtSecret: process.env.JWT_SECRET ?? "supersecret-change-me",
      cookieSecret: process.env.COOKIE_SECRET ?? "supersecret-change-me",
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
    {
      key: "dpd",
      resolve: "./src/modules/dpd",
      options: {
        login: process.env.DPD_LOGIN,
        password: process.env.DPD_PASSWORD,
        fid: process.env.DPD_FID,
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
  ],
});
