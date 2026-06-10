/**
 * Full checkout happy path ? e2e.
 *
 * Warunki startowe:
 *  - Medusa backend dziala i ma min. 1 opublikowany produkt z wariantem (PL, cena > 0),
 *  - skonfigurowana min. 1 opcja dostawy (DPD lub manual),
 *  - Przelewy24 podpiete do regionu (pp_przelewy24_przelewy24),
 *  - przelew tradycyjny aktywny (pp_system_default),
 *  - storefront pod PLAYWRIGHT_BASE_URL (domyslnie :3000).
 *
 * Test P24 konczy sie na przekierowaniu do bramki (nie domykamy platnosci
 * w sandbox). Test przelewu tradycyjnego domyka pelne zamowienie.
 *
 * UWAGA: regexy celowo uzywaja kropki zamiast polskich znakow (np. /imi./
 * dla "Imi?") ? odpornosc na problemy z kodowaniem pliku na Windows.
 */
import { test, expect, type Page } from "@playwright/test";

const CONTACT = {
  email: "playwright+qa@lumineconcept.test",
  firstName: "Jan",
  lastName: "Testowy",
  phone: "+48 600 000 000",
  postalCode: "00-001",
  address: "ul. Testowa 1/2",
  city: "Warszawa",
};

/**
 * Produkty z konfiguratorem maja dropdowny "Wybierz opcj?" ? bez wyboru
 * wariantu CTA "dodaj do koszyka" jest disabled. Wybieramy pierwsza realna
 * opcje kazdego selecta (opcja 0 to placeholder).
 */
async function selectRequiredVariantOptions(page: Page) {
  for (let i = 0; i < 5; i++) {
    // Accessible name triggera to label opcji (np. "KOLOR TABLICZKI"),
    // wiec szukamy po widocznym tekscie placeholdera.
    const trigger = page
      .getByRole("button")
      .filter({ hasText: /wybierz opcj/i })
      .first();
    if (!(await trigger.isVisible().catch(() => false))) break;
    await trigger.click();
    // option 0 = placeholder; bierzemy pierwsza realna opcje.
    await page.getByRole("option").nth(1).click();
  }
}

/**
 * Dodaje do koszyka pierwszy produkt kupowalny bez dodatkowej konfiguracji
 * (czesc produktow wymaga uploadu logo / pol tekstowych ? wtedy po kliku CTA
 * pojawia sie modal "Doko?cz konfiguracj?" i add jest blokowany).
 */
async function addFirstProductToCart(page: Page) {
  await page.goto("/sklep/gotowe-wzory");
  // Cookie banner zaslania UI ? odrzucamy opcjonalne zgody raz na sesje.
  const cookieReject = page.getByRole("button", { name: /tylko niezb.dne/i });
  if (await cookieReject.isVisible().catch(() => false)) {
    await cookieReject.click();
  }
  await expect(
    page.locator("a[href^='/sklep/gotowe-wzory/']").first(),
  ).toBeVisible();
  const hrefs = (await page
    .locator("a[href^='/sklep/gotowe-wzory/']")
    .evaluateAll((els) =>
      [...new Set(els.map((e) => e.getAttribute("href")))].filter(Boolean),
    )) as string[];

  for (const href of hrefs.slice(0, 8)) {
    await page.goto(href);
    await page.waitForLoadState("networkidle");
    await selectRequiredVariantOptions(page);

    const addToCart = page
      .getByRole("button", { name: /dodaj do koszyka/i })
      .first();
    const enabled = await addToCart
      .isEnabled({ timeout: 5_000 })
      .catch(() => false);
    if (!enabled) continue;

    // UI dodaje optymistycznie ? czekamy az BACKEND potwierdzi pozycje,
    // inaczej twarda nawigacja na /checkout ubija request w locie.
    const lineItemSaved = page
      .waitForResponse(
        (r) => /line-items|certificate-line-item/.test(r.url()) && r.ok(),
        { timeout: 30_000 },
      )
      .catch(() => null);
    await addToCart.click();

    // Callout informacyjny (Sanity) ? potwierdzamy i lecimy dalej.
    const calloutConfirm = page.getByRole("button", {
      name: /rozumiem, kontynuuj/i,
    });
    if (await calloutConfirm.isVisible().catch(() => false)) {
      await calloutConfirm.click();
    }

    // Modal "Doko?cz konfiguracj?" = produkt wymaga uploadu ? nastepny produkt.
    const incompleteModal = page.getByText(/doko.cz konfiguracj/i).first();
    if (await incompleteModal.isVisible().catch(() => false)) {
      continue;
    }

    // Sukces = backend potwierdzil linie i licznik w headerze nie pokazuje 0.
    const saved = await lineItemSaved;
    const cartNotEmpty = await page
      .getByRole("button", { name: /koszyk \((?!0\b)\d+/i })
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
    if (saved && cartNotEmpty) return;
  }
  throw new Error(
    "Zaden z pierwszych produktow nie dal sie dodac do koszyka bez konfiguracji.",
  );
}

async function fillContactStep(page: Page) {
  // getByRole("textbox") zamiast getByLabel ? checkbox newslettera ma w opisie
  // slowo "email" i wywala strict mode.
  await page.getByRole("textbox", { name: /^email/i }).fill(CONTACT.email);
  await page.getByRole("textbox", { name: /^imi./i }).fill(CONTACT.firstName);
  await page.getByRole("textbox", { name: /^nazwisko/i }).fill(CONTACT.lastName);
  await page.getByRole("textbox", { name: /^telefon/i }).fill(CONTACT.phone);
  await page
    .getByRole("textbox", { name: /^kod pocztowy/i })
    .fill(CONTACT.postalCode);
  await page.getByRole("textbox", { name: /^adres/i }).fill(CONTACT.address);
  await page.getByRole("textbox", { name: /^miasto/i }).fill(CONTACT.city);
  await page.getByRole("button", { name: /przejd. do dostawy/i }).click();
}

async function goThroughShippingStep(page: Page) {
  await expect(
    page.getByRole("heading", { name: /spos.b dostawy/i }),
  ).toBeVisible();
  // Wybor metody dostawy (np. "Kurier DPD") ? bez tego krok 3 jest zablokowany.
  await page
    .getByRole("button", { name: /kurier|paczkomat|odbi.r/i })
    .first()
    .click();
  const goToPayment = page.getByRole("button", {
    name: /przejd. do p.atno.ci/i,
  });
  await expect(goToPayment).toBeEnabled({ timeout: 20_000 });
  await goToPayment.click();
  await expect(
    page.getByRole("heading", { name: /p.atno../i }),
  ).toBeVisible({ timeout: 30_000 });
}

async function acceptConsents(page: Page) {
  // Express-toggle w podsumowaniu to tez checkbox ? celujemy w konkretne zgody.
  await page
    .locator("label")
    .filter({ hasText: /akceptuj. regulamin/i })
    .getByRole("checkbox")
    .check();
  await page
    .locator("label")
    .filter({ hasText: /wyra.am zgod./i })
    .getByRole("checkbox")
    .check();
}

test.describe("Checkout ? happy path", () => {
  test("od shopu do bramki Przelewy24", async ({ page }) => {
    test.setTimeout(180_000);

    await addFirstProductToCart(page);
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();

    await fillContactStep(page);
    await goThroughShippingStep(page);

    await expect(
      page.getByRole("button", { name: /^Przelewy24/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /przelew tradycyjny/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /paypo/i })).toHaveCount(0);

    await acceptConsents(page);

    const submit = page.getByRole("button", { name: /zamawiam i p.ac./i });
    await expect(submit).toBeEnabled();
    await submit.click();

    await page.waitForURL(/przelewy24|secure\.przelewy24|sandbox\.przelewy24/i, {
      timeout: 60_000,
    });
  });

  test("przelew tradycyjny ? zamowienie powstaje od razu, klient widzi dane do przelewu", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    await addFirstProductToCart(page);
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();

    await fillContactStep(page);
    await goThroughShippingStep(page);

    // Wybor przelewu tradycyjnego zamiast domyslnego P24.
    await page.getByRole("button", { name: /przelew tradycyjny/i }).click();

    await acceptConsents(page);

    const submit = page.getByRole("button", { name: /zamawiam/i });
    await expect(submit).toBeEnabled();
    await submit.click();

    // Bez zewnetrznej bramki: od razu potwierdzenie z danymi do przelewu.
    await page.waitForURL(/checkout\/potwierdzenie\?.*payment=bank_transfer/i, {
      timeout: 60_000,
    });
    await expect(
      page.getByRole("heading", { name: /zam.wienie przyj.te/i }),
    ).toBeVisible();
    await expect(page.getByText(/dane do przelewu/i)).toBeVisible();
    await expect(page.getByText(/numer zam.wienia/i)).toBeVisible();
  });
});
