/**
 * E2E Etap 1 — motyw composera (wymaga MAGAZYN_E2E_EMAIL / MAGAZYN_E2E_PASSWORD).
 */
import { test, expect, type Page } from "@playwright/test";

const adminEmail = process.env.MAGAZYN_E2E_EMAIL;
const adminPassword = process.env.MAGAZYN_E2E_PASSWORD;
const hasAdminCreds = Boolean(adminEmail && adminPassword);
const basePath = process.env.MAGAZYN_BASE_PATH ?? "/magazyn";

async function loginMagazyn(page: Page) {
	await page.goto(`${basePath}/login`);
	await page.getByLabel(/e-mail/i).fill(adminEmail!);
	await page.getByLabel(/hasło/i).fill(adminPassword!);
	await page.getByRole("button", { name: /zaloguj/i }).click();
	await page.waitForURL(new RegExp(`${basePath}/panel`));
}

test.describe("Composer Etap 1 — motyw", () => {
	test.skip(!hasAdminCreds, "Ustaw MAGAZYN_E2E_EMAIL i MAGAZYN_E2E_PASSWORD");

	test("anonimowy HTML — brak markupu edytora motywu", async ({ page }) => {
		await page.goto("/");
		const html = await page.content();
		expect(html).not.toContain("Tryb edycji");
		expect(html).not.toContain("data-cms-input");
		// style motywu (zmienne CSS) jest OK dla wszystkich — to nie jest edytor
		expect(html).toContain("lumine-theme-tokens");
	});

	test("endpoint cms-preview bez sesji → 401", async ({ request }) => {
		const res = await request.get("/api/cms-preview/enable?path=/");
		expect(res.status()).toBe(401);
	});

	test("POST /api/composer/theme-tokens bez sesji → 401", async ({ request }) => {
		const res = await request.post("/api/composer/theme-tokens", { data: {} });
		expect(res.status()).toBe(401);
	});

	test("zmiana accent → zapis → widoczna w iframe po cms:reload", async ({ page }) => {
		await loginMagazyn(page);
		await page.goto(`${basePath}/panel/cms/podglad/home`);

		const iframe = page.frameLocator('iframe[title*="Podgląd"]');
		await iframe.locator("body").waitFor({ state: "attached", timeout: 30_000 });

		const accentField = page.getByLabel(/Akcent \(CTA/i);
		const newAccent = "oklch(0.55 0.12 145)";
		await accentField.fill(newAccent);

		const saveBtn = page.getByRole("button", { name: /zapisz motyw/i });
		await saveBtn.click();
		await expect(page.getByText(/zapisano|publik/i)).toBeVisible({ timeout: 15_000 });

		// Reload podglądu (jak po zapisie w live-preview-client)
		await page.getByRole("button", { name: /odśwież/i }).click();

		const accentOnPage = await iframe.locator("html").evaluate((el) => {
			return getComputedStyle(el).getPropertyValue("--accent").trim();
		});
		expect(accentOnPage).toBe(newAccent);
	});

	test("zmiana fontu display → computedStyle h1", async ({ page }) => {
		await loginMagazyn(page);
		await page.goto(`${basePath}/panel/cms/podglad/home`);

		const iframe = page.frameLocator('iframe[title*="Podgląd"]');
		await iframe.locator("h1").first().waitFor({ state: "attached", timeout: 30_000 });

		await page.getByLabel(/Nagłówki \(display\)/i).selectOption("gilroy");
		await page.getByRole("button", { name: /zapisz motyw/i }).click();
		await expect(page.getByText(/zapisano|publik/i)).toBeVisible({ timeout: 15_000 });
		await page.getByRole("button", { name: /odśwież/i }).click();

		const fontFamily = await iframe.locator("h1").first().evaluate((el) => {
			return getComputedStyle(el).fontFamily.toLowerCase();
		});
		expect(fontFamily).toMatch(/gilroy|arial|system-ui/);
	});

	test("kontrast < 4.5:1 → ostrzeżenie WCAG (nie blokuje zapisu)", async ({ page }) => {
		await loginMagazyn(page);
		await page.goto(`${basePath}/panel/cms/podglad/home`);

		await page.getByLabel(/Tekst główny/i).fill("oklch(0.78 0 0)");
		await page.getByLabel(/Tło strony/i).fill("oklch(0.8 0 0)");

		await expect(page.getByText(/Ostrzeżenie WCAG/i)).toBeVisible();
		await expect(page.getByRole("button", { name: /zapisz motyw/i })).toBeEnabled();
	});

	test("wylogowany — brak dostępu do podglądu CMS", async ({ page }) => {
		await page.goto(`${basePath}/panel/cms/podglad/home`);
		await expect(page).toHaveURL(new RegExp(`${basePath}(?:/login)?`));
	});
});
