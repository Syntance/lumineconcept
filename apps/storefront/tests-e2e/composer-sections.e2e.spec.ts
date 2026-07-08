/**

 * E2E Etap 2–4 — sekcje composera (publiczny + admin z Railway Medusa).

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



async function dismissCookieBanner(page: Page) {

	const cookieReject = page.getByRole("button", { name: /tylko niezb.dne/i });

	if (await cookieReject.isVisible().catch(() => false)) {

		await cookieReject.click();

	}

}



async function dismissPreviewCookies(page: Page) {

	await dismissCookieBanner(page);

	const iframe = previewFrame(page);

	const inFrame = iframe.getByRole("button", { name: /tylko niezb.dne/i });

	if (await inFrame.isVisible({ timeout: 3_000 }).catch(() => false)) {

		await inFrame.click();

	}

}



async function loginMagazyn(page: Page) {

	await page.goto(`${basePath}`);

	await page.getByLabel("Email").fill(adminEmail!);

	await page.getByLabel("Hasło").fill(adminPassword!);

	await page.getByRole("button", { name: /zaloguj się/i }).click();

	await page.waitForURL(new RegExp(`${basePath}/panel`), { timeout: 60_000 });

	await dismissCookieBanner(page);

}



async function openSectionsEditor(page: Page) {

	await page.goto(`${basePath}/panel/cms/podglad/home`);

	await dismissCookieBanner(page);

	await page.getByRole("button", { name: /^Sekcje$/i }).click();

	await page.locator("li.rounded-xl.border").first().waitFor({ timeout: 30_000 });

	await dismissPreviewCookies(page);

}



function previewFrame(page: Page) {

	return page.frameLocator('iframe[title*="Podgląd"]');

}



async function addRichTextFromCatalog(page: Page) {

	await page.getByRole("button", { name: /Dodaj sekcję/i }).click();

	await page

		.locator(".grid-cols-2")

		.getByRole("button", { name: /Tekst sformatowany/i })

		.first()

		.click();

}



async function selectLastRichTextSection(page: Page) {

	const items = page.locator("li.rounded-xl.border");

	const count = await items.count();

	for (let i = count - 1; i >= 0; i--) {

		const label = await items.nth(i).locator("button.text-left").textContent();

		if (label?.includes("Tekst sformatowany")) {

			await items.nth(i).locator("button.text-left").click();

			return;

		}

	}

	await items.last().locator("button.text-left").click();

}



async function selectHeroSection(page: Page) {

	await page.getByRole("button", { name: /^Hero/i }).first().click();

}



async function setHeroHeadline(page: Page, headline: string) {

	await selectHeroSection(page);

	await page.locator('[data-cms-input*="sections"][data-cms-input*="headline"]').first().fill(headline);

}



async function medusaReachable(): Promise<boolean> {

	const base =

		process.env.MEDUSA_BACKEND_URL ??

		process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ??

		"http://localhost:9000";

	const url = base.endsWith("/health") ? base : `${base.replace(/\/$/, "")}/health`;

	try {

		const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });

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

	test.describe.configure({ mode: "serial", timeout: 120_000 });



	test.beforeAll(async () => {

		test.skip(!hasAdminCreds, "Brak MAGAZYN_E2E_EMAIL / HASŁA");

		test.skip(!(await medusaReachable()), "Medusa niedostępna");

	});



	test("zakładka Sekcje + katalog", async ({ page }) => {

		await loginMagazyn(page);

		await openSectionsEditor(page);

		await page.getByRole("button", { name: /Dodaj sekcję/i }).click();

		await expect(page.locator(".grid-cols-2").getByText("Tekst sformatowany")).toBeVisible();

	});



	test("dodaj richText → zapisz szkic", async ({ page }) => {

		await loginMagazyn(page);

		await openSectionsEditor(page);

		await addRichTextFromCatalog(page);

		await page.getByRole("button", { name: /Zapisz szkic/i }).click();

		await expect(page.getByRole("status")).toContainText(/szkic/i);

	});



	test("izolacja draft — marker w iframe, nie na produkcji", async ({ page, browser }) => {

		const marker = `e2e-draft-${Date.now()}`;

		await loginMagazyn(page);

		await openSectionsEditor(page);

		await selectLastRichTextSection(page);

		await page.locator("textarea").last().fill(`<p>${marker}</p>`);

		await page.getByRole("button", { name: /Zapisz szkic/i }).click();

		await expect(page.getByRole("status")).toContainText(/szkic/i);



		const iframe = previewFrame(page);

		await expect(iframe.getByText(marker)).toBeVisible({ timeout: 45_000 });



		const anon = await browser.newContext();

		const anonPage = await anon.newPage();

		await anonPage.goto("/");

		await expect(anonPage.getByText(marker)).toHaveCount(0);

		await anon.close();

	});



	test("opublikuj szkic → marker na produkcji", async ({ page, browser }) => {

		const marker = `e2e-live-${Date.now()}`;

		await loginMagazyn(page);

		await openSectionsEditor(page);

		await selectLastRichTextSection(page);

		await page.locator("textarea").last().fill(`<p>${marker}</p>`);

		await page.getByRole("button", { name: /Opublikuj/i }).click();

		await expect(page.getByRole("status")).toContainText(/opublikowano/i);



		const anon = await browser.newContext();

		const anonPage = await anon.newPage();

		await anonPage.goto("/", { waitUntil: "networkidle" });

		await expect(anonPage.getByText(marker)).toBeVisible({ timeout: 60_000 });

		await anon.close();

	});



	test("usuń ostatnią sekcję richText → opublikuj", async ({ page }) => {

		await loginMagazyn(page);

		await openSectionsEditor(page);

		const items = page.locator("li.rounded-xl.border");

		let target = -1;

		const count = await items.count();

		for (let i = count - 1; i >= 0; i--) {

			const label = await items.nth(i).locator("button.text-left").textContent();

			if (label?.includes("Tekst sformatowany")) {

				target = i;

				break;

			}

		}

		test.skip(target < 0, "Brak sekcji richText do usunięcia");

		await items.nth(target).getByRole("button", { name: "Usuń" }).click();

		await page.getByRole("button", { name: /Opublikuj/i }).click();

		await expect(page.getByRole("status")).toContainText(/opublikowano/i);

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



	test("przestaw kolejność — w dół", async ({ page }) => {

		await loginMagazyn(page);

		await openSectionsEditor(page);

		const firstLabel = await page.locator("li.rounded-xl.border button.text-left").first().textContent();

		await page.getByRole("button", { name: "W dół" }).first().click();

		const secondLabel = await page.locator("li.rounded-xl.border button.text-left").nth(1).textContent();

		expect(secondLabel?.replace(/\s*\(ukryta\)/, "").trim()).toContain(

			firstLabel?.replace(/\s*\(ukryta\)/, "").trim() ?? "",

		);

	});



	test("zmiana layoutu — wyrównanie prawo", async ({ page }) => {

		await loginMagazyn(page);

		await openSectionsEditor(page);

		await page.locator("li.rounded-xl.border button.text-left").first().click();

		await page.locator("select").first().selectOption("right");

		await page.getByRole("button", { name: /Zapisz szkic/i }).click();

		await expect(page.getByRole("status")).toContainText(/szkic/i);

	});



	test("klik sekcji w iframe → podświetlenie w panelu", async ({ page }) => {

		await loginMagazyn(page);

		await openSectionsEditor(page);

		const iframe = previewFrame(page);

		const richText = iframe.getByText("Treść sekcji");

		await richText.waitFor({ state: "visible", timeout: 30_000 });

		await richText.click();

		await expect(page.locator(".ring-amber-400").first()).toBeVisible({ timeout: 5_000 });

	});



	test("inline dblclick hero → sync z panelem", async ({ page }) => {

		const synced = `E2E-INLINE-${Date.now()}`;

		await loginMagazyn(page);

		await openSectionsEditor(page);

		const iframe = previewFrame(page);

		const h1 = iframe.locator("h1").first();

		await h1.waitFor({ state: "visible", timeout: 30_000 });

		await dismissPreviewCookies(page);

		await h1.dblclick();

		await h1.evaluate((el, text) => {

			el.textContent = text;

			el.dispatchEvent(new Event("blur", { bubbles: true }));

		}, synced);

		const input = page.locator('[data-cms-input*="headline"]').first();

		await expect(input).toHaveValue(synced, { timeout: 15_000 });

	});



	test("wersjonowanie — 3 publikacje hero + przywróć starszą", async ({ page }) => {

		const ts = Date.now();

		const v1 = `E2E-V1-${ts}`;

		const v2 = `E2E-V2-${ts}`;

		const v3 = `E2E-V3-${ts}`;



		await loginMagazyn(page);

		await openSectionsEditor(page);



		await setHeroHeadline(page, v1);

		await page.getByRole("button", { name: /Opublikuj/i }).click();

		await expect(page.getByRole("status")).toContainText(/opublikowano/i);



		await setHeroHeadline(page, v2);

		await page.getByRole("button", { name: /Opublikuj/i }).click();

		await expect(page.getByRole("status")).toContainText(/opublikowano/i);



		await setHeroHeadline(page, v3);

		await page.getByRole("button", { name: /Opublikuj/i }).click();

		await expect(page.getByRole("status")).toContainText(/opublikowano/i);



		const restoreButtons = page.getByRole("button", { name: "Przywróć" });

		const count = await restoreButtons.count();

		expect(count).toBeGreaterThanOrEqual(2);



		await dismissCookieBanner(page);

		// Historia: [0]=przed v3 (v2), [1]=przed v2 (v1), [2]=starsze…

		await restoreButtons.nth(1).click();

		await expect(page.getByRole("status")).toContainText(/przywrócono/i);



		await expect(page.locator('[data-cms-input*="headline"]').first()).toHaveValue(v1, {

			timeout: 15_000,

		});



		const iframe = previewFrame(page);

		await page.getByRole("button", { name: /Odśwież/i }).click();

		await expect(iframe.locator("h1").first()).toContainText(v1, { timeout: 45_000 });



		await setHeroHeadline(page, v2);

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


