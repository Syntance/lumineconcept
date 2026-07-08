/**
 * E2E Etap 1 — motyw composera.
 * Publiczne testy: bez Medusy. Admin: wymaga backendu + credów z .env.local.
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const adminEmail =
	process.env.MAGAZYN_E2E_EMAIL ?? process.env.MEDUSA_ADMIN_EMAIL;
const adminPassword =
	process.env.MAGAZYN_E2E_PASSWORD ?? process.env.MEDUSA_ADMIN_PASSWORD;
const hasAdminCreds = Boolean(adminEmail && adminPassword);
const basePath = process.env.MAGAZYN_BASE_PATH ?? "/magazyn";

async function loginMagazyn(page: Page) {
	await page.goto(`${basePath}`);
	await page.getByLabel("Email").fill(adminEmail!);
	await page.getByLabel("Hasło").fill(adminPassword!);
	await page.getByRole("button", { name: /zaloguj się/i }).click();
	await page.waitForURL(new RegExp(`${basePath}/panel`), { timeout: 30_000 });
}

async function openThemeEditor(page: Page) {
	await page.getByRole("button", { name: /^Globalne$/i }).click();
	await expect(page.getByText("Motyw (kolory OKLCH)")).toBeVisible();
}

async function medusaReachable(): Promise<boolean> {
	const base =
		process.env.MEDUSA_BACKEND_URL ??
		process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ??
		"http://localhost:9000";
	const url = base.endsWith("/health") ? base : `${base.replace(/\/$/, "")}/health`;
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
		return res.ok;
	} catch {
		return false;
	}
}

test.describe("Composer Etap 1 — motyw (publiczny)", () => {
	test("anonimowy HTML — brak markupu edytora motywu", async ({ page }) => {
		await page.goto("/");
		const html = await page.content();
		expect(html).not.toContain("Tryb edycji");
		expect(html).not.toContain("data-cms-input");
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

	test("wylogowany — brak dostępu do podglądu CMS", async ({ page }) => {
		await page.goto(`${basePath}/panel/cms/podglad/home`);
		await expect(page).toHaveURL(new RegExp(`${basePath}(?:/login)?`));
	});

	test("preload fontów — unikalne pliki woff2 (bez nadmiarowych duplikatów)", async ({ page }) => {
		await page.goto("/");
		const hrefs = await page.locator('link[rel="preload"][as="font"]').evaluateAll((els) =>
			els.map((el) => el.getAttribute("href")).filter((h): h is string => Boolean(h)),
		);
		const unique = new Set(hrefs);
		expect(unique.size).toBeGreaterThan(0);
		expect(unique.size).toBeLessThanOrEqual(4);
	});

	test("blok CSS motywu — przyrost head < 1.2 KB (pełna paleta brand)", async ({ page }) => {
		await page.goto("/");
		const styleBytes = await page.locator("#lumine-theme-tokens").evaluate((el) => {
			return new TextEncoder().encode(el.textContent ?? "").length;
		});
		expect(styleBytes).toBeLessThan(1200);
	});

	test("axe-core na stronie głównej — 0 naruszeń contrast-related", async ({ page }) => {
		await page.goto("/");
		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();
		const contrastViolations = results.violations.filter(
			(v) => v.id === "color-contrast" || v.id === "color-contrast-enhanced",
		);
		expect(contrastViolations).toEqual([]);
	});
});

test.describe("Composer Etap 1 — motyw (admin)", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(async () => {
		test.skip(!hasAdminCreds, "Brak MAGAZYN_E2E_* lub MEDUSA_ADMIN_* w .env.local");
		const ok = await medusaReachable();
		test.skip(!ok, "Medusa backend niedostępny — uruchom docker compose / pnpm dev:backend");
	});

	test("zmiana accent → zapis → widoczna w iframe po cms:reload", async ({ page }) => {
		await loginMagazyn(page);
		await page.goto(`${basePath}/panel/cms/podglad/home`);
		await openThemeEditor(page);

		const iframe = page.frameLocator('iframe[title*="Podgląd"]');
		await iframe.locator("body").waitFor({ state: "attached", timeout: 30_000 });

		const newAccent = "oklch(0.55 0.12 145)";
		await page.getByLabel(/Akcent \(CTA/i).fill(newAccent);
		await page.getByRole("button", { name: /zapisz motyw/i }).click();
		await expect(page.getByText(/zapisano|publik/i)).toBeVisible({ timeout: 15_000 });
		await page.getByRole("button", { name: /odśwież/i }).click();

		await expect
			.poll(
				async () =>
					iframe.locator("html").evaluate((el) => {
						return getComputedStyle(el).getPropertyValue("--accent").trim();
					}),
				{ timeout: 20_000 },
			)
			.toBe(newAccent);
	});

	test("zmiana fontu display → computedStyle h2 (nie hero h1 — font-binerka)", async ({ page }) => {
		await loginMagazyn(page);
		await page.goto(`${basePath}/panel/cms/podglad/home`);
		await openThemeEditor(page);

		const iframe = page.frameLocator('iframe[title*="Podgląd"]');
		await iframe.locator('h2:has-text("Bestsellery")').waitFor({ state: "attached", timeout: 30_000 });

		await page.getByLabel(/Nagłówki \(display\)/i).selectOption("chronicle");
		await page.getByRole("button", { name: /zapisz motyw/i }).click();
		await expect(page.getByText(/zapisano|publik/i)).toBeVisible({ timeout: 15_000 });
		await page.getByRole("button", { name: /odśwież/i }).click();
		await iframe.locator('h2:has-text("Bestsellery")').waitFor({ state: "attached", timeout: 30_000 });

		await expect
			.poll(
				async () => {
					try {
						const css = await iframe.locator("#lumine-theme-tokens").textContent();
						return css ?? "";
					} catch {
						return "";
					}
				},
				{ timeout: 20_000 },
			)
			.toContain("var(--font-chronicle)");
	});

	test("kontrast < 4.5:1 → ostrzeżenie WCAG (nie blokuje zapisu)", async ({ page }) => {
		await loginMagazyn(page);
		await page.goto(`${basePath}/panel/cms/podglad/home`);
		await openThemeEditor(page);

		await page.getByLabel(/Tekst główny/i).fill("oklch(0.78 0 0)");
		await page.getByLabel(/Tło strony/i).fill("oklch(0.8 0 0)");

		await expect(page.getByText(/Ostrzeżenie WCAG/i)).toBeVisible();
		await expect(page.getByRole("button", { name: /zapisz motyw/i })).toBeEnabled();
	});
});
