/**
 * Chaos e2e — symulacje awarii wokol checkoutu P24.
 *
 * Scenariusze bezpieczne dla produkcji (zadna platnosc nie jest domykana):
 *  1. double-click "Zamawiam i place" -> dokladnie JEDNA rejestracja platnosci,
 *  2. powrot z bramki z nieistniejacym cart_id -> spokojne "pending", nie crash,
 *  3. powrot z bramki bez internetu / backend down -> "pending", NIGDY "failed"
 *     (przedwczesne "failed" + mail "ponow platnosc" = podwojna wplata,
 *     incydent 06.07.2026).
 *
 * UWAGA: regexy celowo uzywaja kropki zamiast polskich znakow ? odpornosc
 * na problemy z kodowaniem pliku na Windows (jak w checkout.e2e.spec.ts).
 */
import { test, expect, type Page } from "@playwright/test";

const CONTACT = {
  email: "playwright+chaos@lumineconcept.test",
  firstName: "Jan",
  lastName: "Testowy",
  phone: "+48 600 000 000",
  postalCode: "00-001",
  address: "ul. Testowa 1/2",
  city: "Warszawa",
};

async function selectRequiredVariantOptions(page: Page) {
  for (let i = 0; i < 5; i++) {
    const trigger = page
      .getByRole("button")
      .filter({ hasText: /wybierz opcj/i })
      .first();
    if (!(await trigger.isVisible().catch(() => false))) break;
    await trigger.click();
    await page.getByRole("option").nth(1).click();
  }
}

/**
 * Banner cookies pojawia sie asynchronicznie i potrafi zaslonic UI takze na
 * /checkout — odrzucamy go z jawnym timeoutem zamiast pojedynczego
 * isVisible() (zrodlo flake'ow przy wolniejszym renderze).
 */
async function dismissCookieBanner(page: Page) {
  const cookieReject = page.getByRole("button", { name: /tylko niezb.dne/i });
  if (await cookieReject.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await cookieReject.click();
    await cookieReject.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => undefined);
  }
}

async function addFirstProductToCart(page: Page) {
  await page.goto("/sklep/gotowe-wzory");
  await dismissCookieBanner(page);
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

    const lineItemSaved = page
      .waitForResponse(
        (r) => /line-items|certificate-line-item/.test(r.url()) && r.ok(),
        { timeout: 30_000 },
      )
      .catch(() => null);
    await addToCart.click();

    const calloutConfirm = page.getByRole("button", {
      name: /rozumiem, kontynuuj/i,
    });
    if (await calloutConfirm.isVisible().catch(() => false)) {
      await calloutConfirm.click();
    }

    const incompleteModal = page.getByText(/doko.cz konfiguracj/i).first();
    if (await incompleteModal.isVisible().catch(() => false)) {
      continue;
    }

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

test.describe("Checkout ? chaos / awarie", () => {
  test("double-click platnosci -> dokladnie jedna rejestracja (idempotencja)", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    let prepareCheckoutCalls = 0;
    page.on("request", (req) => {
      if (
        req.method() === "POST" &&
        req.url().includes("/store/custom/prepare-checkout")
      ) {
        prepareCheckoutCalls += 1;
      }
    });

    await addFirstProductToCart(page);
    await page.goto("/checkout");
    await dismissCookieBanner(page);
    await fillContactStep(page);
    await goThroughShippingStep(page);
    await acceptConsents(page);

    const submit = page.getByRole("button", { name: /zamawiam i p.ac./i });
    await expect(submit).toBeEnabled();
    // Dwa kliki tak szybko, jak zdola Playwright — guard submittingRef musi
    // przepuscic tylko pierwszy.
    await submit.click();
    await submit.click({ force: true }).catch(() => undefined);

    await page.waitForURL(/przelewy24|secure\.przelewy24|sandbox\.przelewy24/i, {
      timeout: 60_000,
    });
    expect(prepareCheckoutCalls).toBe(1);
  });

  test("powrot z bramki z nieistniejacym cart_id -> pending, nie crash", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto(
      "/checkout/przelewy24/return?cart_id=cart_CHAOS_NIE_ISTNIEJE",
    );
    // Backend odpowiada 404 -> klient traktuje jak niedostepnosc i po kilku
    // probach pokazuje spokojny stan przetwarzania (cron domknie, gdyby
    // platnosc jednak istniala). NIGDY nie moze tu byc twardego crasha.
    await expect(
      page.getByText(/p.atno.. jest przetwarzana/i).first(),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/p.atno.. nie powiod.a si./i)).toHaveCount(0);
  });

  test("powrot z bramki bez internetu (backend nieosiagalny) -> pending, nie failed", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    // Symulacja zerwanej sieci: wszystkie strzaly statusowe padaja na poziomie
    // transportu, strona (SSR) laduje sie normalnie.
    await page.route("**/p24-return-status**", (route) => route.abort());

    await page.goto("/checkout/przelewy24/return?cart_id=cart_CHAOS_OFFLINE");

    await expect(
      page.getByText(/p.atno.. jest przetwarzana/i).first(),
    ).toBeVisible({ timeout: 60_000 });
    // Kontrprzyklad incydentu 06.07.2026: przy braku odpowiedzi backendu NIE
    // wolno ogłosic porazki ani sugerowac ponownej platnosci.
    await expect(page.getByText(/p.atno.. nie powiod.a si./i)).toHaveCount(0);
  });
});
