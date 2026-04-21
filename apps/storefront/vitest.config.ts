import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // Wyłączamy Sentry / tracking w testach — nie chcemy szumu ani realnych requestów.
    env: {
      NEXT_PUBLIC_MEDUSA_BACKEND_URL: "http://localhost:9000",
      NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: "pk_test",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@lumine/types": path.resolve(__dirname, "../../packages/types/index.ts"),
      "@lumine/ui": path.resolve(__dirname, "../../packages/ui/index.ts"),
    },
  },
});
