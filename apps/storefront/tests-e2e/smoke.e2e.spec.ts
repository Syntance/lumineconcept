/**
 * Szybki smoke — sprawdza, czy kluczowe strony się renderują. W CI to
 * pierwsza linia obrony: wykryje 500 i crashujący się layout bez czekania
 * na pełny checkout.
 */
import { test, expect } from "@playwright/test";

test.describe("Smoke", () => {
  test("strona główna się ładuje i ma header", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveTitle(/lumine/i);
    await expect(page.getByRole("link", { name: /sklep/i }).first()).toBeVisible();
  });

  test("/sklep listuje kategorie", async ({ page }) => {
    const response = await page.goto("/sklep");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("/sklep/gotowe-wzory zwraca produkty", async ({ page }) => {
    const response = await page.goto("/sklep/gotowe-wzory");
    expect(response?.status()).toBeLessThan(500);
    // Co najmniej jedna karta produktu.
    await expect(
      page.locator("a[href^='/sklep/gotowe-wzory/']").first(),
    ).toBeVisible();
  });

  test("/checkout ładuje formularz (nawet bez produktów może pokazać 'pusty koszyk')", async ({
    page,
  }) => {
    const response = await page.goto("/checkout");
    expect(response?.status()).toBeLessThan(500);
  });
});
