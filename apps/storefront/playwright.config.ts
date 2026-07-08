import { defineConfig, devices } from "@playwright/test";

/**
 * Konfiguracja e2e. Domyślnie odpalamy przeciw LOKALNEMU storefrontowi
 * (`pnpm dev`) + LOKALNEJ Medusa (`docker compose up`, `pnpm dev:backend`).
 *
 * W CI można nadpisać bazowy URL przez `PLAYWRIGHT_BASE_URL` (np.
 * preview z Vercela). Backend musi być dostępny pod tym samym originem
 * przez `/api/medusa` (proxy w Next.js).
 *
 * UWAGA: e2e testy NIE uruchamiają się w zwykłym `pnpm test` — mają
 * osobny skrypt `pnpm test:e2e`, bo wymagają działających usług.
 */
const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests-e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // koszyk i Medusa lubią sekwencję na tej samej bazie
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1280, height: 800 },
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // mobile i webkit domyślnie off — czas w CI. Włączamy lokalnie ręcznie.
    // { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    // { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
