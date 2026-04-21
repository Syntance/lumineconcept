/**
 * Full checkout happy path — e2e.
 *
 * Warunki startowe (muszą być spełnione zanim odpalimy test):
 *  - Medusa backend działa i ma co najmniej 1 opublikowany produkt
 *    z wariantem w regionie PL (cena > 0),
 *  - Jest skonfigurowana przynajmniej jedna opcja dostawy (DPD lub manual),
 *  - Jest aktywny payment provider (domyślnie `pp_system_default`
 *    po `pnpm --filter @lumine/backend setup-payment`),
 *  - Storefront dostępny pod `PLAYWRIGHT_BASE_URL` (domyślnie :3000).
 *
 * Test płaci providerem `system` (ręczny, bez operatora) — Medusa
 * domyka zamówienie i storefront redirectuje na stronę podziękowania.
 */
import { test, expect } from "@playwright/test";

// Dane kontaktowe — bezpieczne, fikcyjne. NIE używamy prawdziwych emaili,
// bo CAPI/MailerLite wychwyciłyby test w produkcji.
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
  test("od shopu do potwierdzenia zamówienia", async ({ page }) => {
    test.setTimeout(120_000);

    // 1) Lista produktów.
    await page.goto("/sklep/gotowe-wzory");
    await expect(
      page.getByRole("heading", { name: /gotowe wzory/i }).first(),
    ).toBeVisible();

    // Wchodzimy w pierwszą kartę produktu widoczną na liście.
    const firstCard = page.locator("a[href^='/sklep/gotowe-wzory/']").first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // 2) PDP — dodanie do koszyka. Niektóre produkty wymagają konfiguratora,
    //    bierzemy pierwszy „akcyjny" CTA, który prowadzi do koszyka.
    await page.waitForLoadState("networkidle");
    const addToCart = page.getByRole("button", { name: /dodaj do koszyka/i }).first();
    if (await addToCart.isVisible()) {
      await addToCart.click();
    } else {
      // Fallback: „Kup teraz" → automatycznie przejdzie na /checkout
      await page.getByRole("button", { name: /kup teraz/i }).first().click();
    }

    // 3) /checkout
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();

    // Krok 1 — dane kontaktowe + adres
    await page.getByLabel(/adres e-mail|email/i).fill(CONTACT.email);
    await page.getByLabel(/imi[eę]/i).fill(CONTACT.firstName);
    await page.getByLabel(/nazwisko/i).fill(CONTACT.lastName);
    await page.getByLabel(/telefon/i).fill(CONTACT.phone);
    await page.getByLabel(/kod pocztowy/i).fill(CONTACT.postalCode);
    await page.getByLabel(/adres|ulica/i).fill(CONTACT.address);
    await page.getByLabel(/miasto|miejscowo[sś][ćc]/i).fill(CONTACT.city);

    await page.getByRole("button", { name: /przejd[źz] do dostawy/i }).click();

    // Krok 2 — dostawa. Formularz sam auto-selectuje pierwszą opcję, więc
    // nie musimy niczego klikać — czekamy aż CTA kroku 2 się pojawi.
    await expect(
      page.getByRole("heading", { name: /sposób dostawy/i }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /przejd[źz] do p[łl]atno[sś]ci/i })
      .click();

    // Krok 3 — płatność. PaymentSelector pokazuje „Przelew tradycyjny".
    await expect(
      page.getByRole("heading", { name: /p[łl]atno[sś][ćc]/i }),
    ).toBeVisible();

    // Zgoda na regulamin (jedna z dwóch kontrolek "Akceptuję" → dopasowanie luźne).
    const terms = page.getByRole("checkbox").first();
    if (await terms.isVisible()) {
      await terms.check();
    }

    // 4) Finalizacja
    const submit = page.getByRole("button", { name: /zamawiam i p[łl]ac[eę]/i });
    await expect(submit).toBeEnabled();
    await submit.click();

    // Po `completeCart` storefront przerzuca na /checkout/sukces albo /konto
    // w zależności od konfiguracji — akceptujemy obie wartości.
    await page.waitForURL(/\/checkout\/(sukces|success|dziekujemy)|\/konto\/zamowienia/i, {
      timeout: 60_000,
    });

    await expect(page.getByText(/dziękujemy|zamówienie zostało|potwierdzenie/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});
