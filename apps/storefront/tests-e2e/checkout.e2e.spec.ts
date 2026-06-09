/**
 * Full checkout happy path — e2e.
 *
 * Warunki startowe (muszą być spełnione zanim odpalimy test):
 *  - Medusa backend działa i ma co najmniej 1 opublikowany produkt
 *    z wariantem w regionie PL (cena > 0),
 *  - Jest skonfigurowana przynajmniej jedna opcja dostawy (DPD lub manual),
 *  - Przelewy24 podpięte do regionu (pp_przelewy24_przelewy24),
 *  - Storefront dostępny pod `PLAYWRIGHT_BASE_URL` (domyślnie :3000).
 *
 * Test kończy się na przekierowaniu do bramki P24 (nie domykamy płatności w sandbox).
 */
import { test, expect } from "@playwright/test";

const CONTACT = {
  email: "playwright+qa@lumineconcept.test",
  firstName: "Jan",
  lastName: "Testowy",
  phone: "+48 600 000 000",
  postalCode: "00-001",
  address: "ul. Testowa 1/2",
  city: "Warszawa",
};

test.describe("Checkout — happy path", () => {
  test("od shopu do bramki Przelewy24", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/sklep/gotowe-wzory");
    await expect(
      page.getByRole("heading", { name: /gotowe wzory/i }).first(),
    ).toBeVisible();

    const firstCard = page.locator("a[href^='/sklep/gotowe-wzory/']").first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    await page.waitForLoadState("networkidle");
    const addToCart = page.getByRole("button", { name: /dodaj do koszyka/i }).first();
    if (await addToCart.isVisible()) {
      await addToCart.click();
    } else {
      await page.getByRole("button", { name: /kup teraz/i }).first().click();
    }

    await page.goto("/checkout");
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();

    await page.getByLabel(/adres e-mail|email/i).fill(CONTACT.email);
    await page.getByLabel(/imi[eę]/i).fill(CONTACT.firstName);
    await page.getByLabel(/nazwisko/i).fill(CONTACT.lastName);
    await page.getByLabel(/telefon/i).fill(CONTACT.phone);
    await page.getByLabel(/kod pocztowy/i).fill(CONTACT.postalCode);
    await page.getByLabel(/adres|ulica/i).fill(CONTACT.address);
    await page.getByLabel(/miasto|miejscowo[sś][ćc]/i).fill(CONTACT.city);

    await page.getByRole("button", { name: /przejd[źz] do dostawy/i }).click();

    await expect(
      page.getByRole("heading", { name: /sposób dostawy/i }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /przejd[źz] do p[łl]atno[sś]ci/i })
      .click();

    await expect(
      page.getByRole("heading", { name: /p[łl]atno[sś][ćc]/i }),
    ).toBeVisible();

    await expect(page.getByRole("button", { name: /^Przelewy24$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /przelew tradycyjny/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /paypo/i })).toHaveCount(0);

    await page.getByRole("checkbox").first().check();
    await page.getByRole("checkbox").last().check();

    const submit = page.getByRole("button", { name: /zamawiam i p[łl]ac[eę]/i });
    await expect(submit).toBeEnabled();
    await submit.click();

    await page.waitForURL(/przelewy24|secure\.przelewy24|sandbox\.przelewy24/i, {
      timeout: 60_000,
    });
  });
});
