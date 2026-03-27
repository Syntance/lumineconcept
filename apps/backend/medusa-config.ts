import { defineConfig, loadEnv } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV ?? "development", process.cwd());

export default defineConfig({
  admin: {
    disable: process.env.NODE_ENV === "production",
    backendUrl: process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000",
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL!,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS ?? "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS ?? "http://localhost:7001",
      authCors: process.env.AUTH_CORS ?? "http://localhost:3000",
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
      key: "cloudinary",
      resolve: "./src/modules/cloudinary",
      options: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
      },
    },
  ],
});
