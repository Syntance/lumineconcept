/**
 * E2E Etap 2–4 — sekcje composera (pełny DoD gdzie możliwe bez prod Medusy).
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const adminEmail =
	process.env.MAGAZYN_E2E_EMAIL ?? process.env.MEDUSA_ADMIN_EMAIL;
const adminPassword =
	process.env.MAGAZYN_E2E_PASSWORD ?? process.env.MEDUSA_ADMIN_PASSWORD;
const hasAdminCreds = Boolean(adminEmail && adminPassword);
const basePath = process.env.MAGAZYN_BASE_PATH ?? "/magazyn";

const CMS_PAGES = [
	{ path: "/", name: "home" },
	{ path: "/o-nas", name: "o-nas" },
	{ path: "/sklep", name: "shop" },
	{ path: "/sklep/tablice-z-logo", name: "logo-3d" },
	{ path: "/sklep/gotowe-wzory", name: "gotowe-wzory" },
	{ path: "/sklep/certyfikaty", name: "certyfikaty" },
] as const;

async function loginMagazyn(page: Page) {
	await page.goto(`${basePath}`);
	await page.getByLabel("Email").fill(adminEmail!);
	await page.getByLabel("Hasło").fill(adminPassword!);
	await page.getByRole("button", { name: /zaloguj się/i }).click();
	await page.waitForURL(new RegExp(`${basePath}/panel`), { timeout: 30_000 });
}

async function openSectionsEditor(page: Page) {
	await page.goto(`${basePath}/panel/cms/podglad/home`);
	await page.getByRole("button", { name: /^Sekcje$/i }).click();
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

test.describe("Composer Etap 2–4 — sekcje (publiczny)", () => {
	test("POST /api/composer/page-sections bez sesji → 401", async ({ request }) => {
		const res = await request.post("/api/composer/page-sections", { data: {} });
		expect(res.status()).toBe(401);
	});

	test("GET /api/composer/page-sections bez sesji → 401", async ({ request }) => {
		const res = await request.get("/api/composer/page-sections");
		expect(res.status()).toBe(401);
	});

	for (const { path, name } of CMS_PAGES) {
		test(`migracja/render ${name} — HTTP < 500`, async ({ page }) => {
			const res = await page.goto(path);
			expect(res?.status()).toBeLessThan(500);
			await expect(page.locator("body")).toBeVisible();
		});
	}

	test("o-nas — dokładnie jedno h1 (composer)", async ({ page }) => {
		await page.goto("/o-nas");
		await expect(page.locator("h1")).toHaveCount(1);
	});

	test("anonimowy HTML — brak contenteditable i data-cms-input", async ({ page }) => {
		await page.goto("/");
		const html = await page.content();
		expect(html).not.toContain("contenteditable");
		expect(html).not.toContain("data-cms-input");
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

test.describe("Composer Etap 2–4 — sekcje (admin)", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeAll(async () => {
		test.skip(!hasAdminCreds, "Brak MAGAZYN_E2E_EMAIL / HASŁA");
		test.skip(!(await medusaReachable()), "Medusa niedostępna");
	});

	test("zakładka Sekcje + katalog", async ({ page }) => {
		await loginMagazyn(page);
		await openSectionsEditor(page);
		await page.getByRole("button", { name: /Dodaj sekcję/i }).click();
		await expect(page.getByText("Tekst sformatowany")).toBeVisible();
	});

	test("dodaj richText → zapisz szkic", async ({ page }) => {
		await loginMagazyn(page);
		await openSectionsEditor(page);
		await page.getByRole("button", { name: /Dodaj sekcję/i }).click();
		await page.getByText("Tekst sformatowany").click();
		await page.getByRole("button", { name: /Zapisz szkic/i }).click();
		await expect(page.getByRole("status")).toContainText(/szkic/i);
	});

	test("duplikuj sekcję — nowy id na liście", async ({ page }) => {
		await loginMagazyn(page);
		await openSectionsEditor(page);
		const before = await page.locator("li.rounded-xl.border").count();
		await page.getByRole("button", { name: "Duplikuj" }).first().click();
		await expect(page.locator("li.rounded-xl.border")).toHaveCount(before + 1);
	});

	test("ukryj sekcję — etykieta (ukryta)", async ({ page }) => {
		await loginMagazyn(page);
		await openSectionsEditor(page);
		await page.getByRole("button", { name: "Ukryj" }).first().click();
		await expect(page.getByText(/\(ukryta\)/)).toBeVisible();
	});

	test("przestaw kolejność — w górę", async ({ page }) => {
		await loginMagazyn(page);
		await openSectionsEditor(page);
		const firstLabel = await page.locator("li.rounded-xl.border button.text-left").first().textContent();
		await page.getByRole("button", { name: "W dół" }).first().click();
		const secondLabel = await page.locator("li.rounded-xl.border button.text-left").nth(1).textContent();
		expect(secondLabel?.trim()).toContain(firstLabel?.replace(/\s*\(ukryta\)/, "").trim() ?? "");
	});

	test("zmiana layoutu — wyrównanie prawo", async ({ page }) => {
		await loginMagazyn(page);
		await openSectionsEditor(page);
		await page.locator("li.rounded-xl.border button.text-left").first().click();
		await page.locator('select').filter({ has: page.locator('option[value="right"]') }).first().selectOption("right");
		await page.getByRole("button", { name: /Zapisz szkic/i }).click();
		await expect(page.getByRole("status")).toContainText(/szkic/i);
	});

	test("opublikuj sekcje", async ({ page }) => {
		await loginMagazyn(page);
		await openSectionsEditor(page);
		await page.getByRole("button", { name: /Opublikuj/i }).click();
		await expect(page.getByRole("status")).toContainText(/opublikowano/i);
	});

	test("preset strony — zastosowanie", async ({ page }) => {
		await loginMagazyn(page);
		await openSectionsEditor(page);
		await page.getByRole("button", { name: /Strona główna — minimal/i }).click();
		await expect(page.getByRole("status")).toContainText(/preset/i);
	});
});
