/**
 * E2E Etap 2–4 — sekcje composera.
 * Publiczne testy: bez Medusy. Admin: wymaga backendu + credów.
 */
import { test, expect, type Page } from "@playwright/test";

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

	test("strona główna — render bez błędu 500", async ({ page }) => {
		const res = await page.goto("/");
		expect(res?.status()).toBeLessThan(500);
		await expect(page.locator("body")).toBeVisible();
	});

	test("o-nas — render przez migrację sekcji", async ({ page }) => {
		const res = await page.goto("/o-nas");
		expect(res?.status()).toBeLessThan(500);
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	});

	test("anonimowy HTML — brak data-cms-input na /o-nas", async ({ page }) => {
		await page.goto("/o-nas");
		const html = await page.content();
		expect(html).not.toContain("data-cms-input");
	});
});

test.describe("Composer Etap 2–4 — sekcje (admin)", () => {
	test.describe.configure({ mode: "serial" });

	test.skip(!hasAdminCreds, "Brak MAGAZYN_E2E_EMAIL / HASŁA");

	test.beforeAll(async () => {
		test.skip(!(await medusaReachable()), "Medusa niedostępna");
	});

	test("panel CMS — zakładka Sekcje widoczna", async ({ page }) => {
		await loginMagazyn(page);
		await page.goto(`${basePath}/panel/cms/podglad/home`);
		await expect(page.getByRole("button", { name: /^Sekcje$/i })).toBeVisible();
	});

	test("edytor sekcji — katalog i zapis szkicu", async ({ page }) => {
		await loginMagazyn(page);
		await page.goto(`${basePath}/panel/cms/podglad/home`);
		await page.getByRole("button", { name: /^Sekcje$/i }).click();
		await page.getByRole("button", { name: /Dodaj sekcję/i }).click();
		await expect(page.getByText("Tekst sformatowany")).toBeVisible();
		await page.getByRole("button", { name: /Zapisz szkic/i }).click();
		await expect(page.getByRole("status")).toContainText(/szkic/i);
	});
});
