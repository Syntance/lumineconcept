/**
 * Weryfikuje, że kluczowe treści CMS są obecne na storefrontcie (domyślne fallbacki).
 */
import { test, expect, type Page } from "@playwright/test";

async function dismissCookieBanner(page: Page) {
  const cookieReject = page.getByRole("button", { name: /tylko niezb.dne/i });
  if (await cookieReject.isVisible().catch(() => false)) {
    await cookieReject.click();
  }
}

test.describe("CMS → storefront smoke", () => {
  test("strona główna: hero + trust marquee z CMS defaults", async ({ page }) => {
    await page.goto("/");
    await dismissCookieBanner(page);
    await expect(page.getByRole("link", { name: /zobacz produkty/i }).first()).toBeVisible();
    await expect(page.getByText(/CONCEPT|Wyróżnij swój salon/i).first()).toBeVisible();
    await expect(page.getByText(/Zaufały nam/i)).toBeVisible();
    await expect(page.getByText(/obserwujących/i).first()).toBeVisible();
  });

  test("/sklep: kafelki kategorii i trust bar", async ({ page }) => {
    await page.goto("/sklep");
    await dismissCookieBanner(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /gotowe wzory/i }).first()).toBeVisible();
    await expect(page.getByText(/obserwujących/i).first()).toBeVisible();
  });

  test("/sklep/logo-3d: hero kategorii z CMS defaults", async ({ page }) => {
    await page.goto("/sklep/logo-3d");
    await dismissCookieBanner(page);
    await expect(
      page.getByRole("link", { name: /przewiń do formularza|uzyskaj wycenę/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toContainText(
      /Tablice z logo/i,
    );
  });

  test("layout: footer renderuje się z CMS copyright fallback", async ({ page }) => {
    await page.goto("/sklep");
    await dismissCookieBanner(page);
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText(/Lumine Concept/i);
  });

  test("metadata globalne zawiera Lumine", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Lumine/i);
  });
});
