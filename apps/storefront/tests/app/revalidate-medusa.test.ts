import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Sitemapa i llms.txt nie mają tagu cache — tylko `revalidate = 3600`.
 * `revalidateTag` ich nie dotyka, więc bez `revalidatePath` nowy produkt
 * czekał do godziny na wejście do sitemapy, a produkt oznaczony w panelu
 * jako „nie indeksuj" tyle samo na wyjście z niej.
 */

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
	revalidateTag: (...args: unknown[]) => revalidateTag(...args),
	revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/magazyn/modules/products/sync-handles", () => ({
	syncAllProductHandles: vi.fn(),
}));

const SECRET = "test-secret";

async function post(body?: unknown, secret: string = SECRET) {
	vi.stubEnv("MEDUSA_REVALIDATE_SECRET", SECRET);
	vi.resetModules();
	const { POST } = await import("@/app/api/revalidate/medusa/route");

	const request = new Request("https://lumineconcept.pl/api/revalidate/medusa", {
		method: "POST",
		headers: { "content-type": "application/json", "x-webhook-secret": secret },
		body: body === undefined ? undefined : JSON.stringify(body),
	});

	// Handler czyta tylko `headers` i `json()` — zwykły Request wystarczy.
	return POST(request as never);
}

describe("POST /api/revalidate/medusa", () => {
	beforeEach(() => {
		revalidateTag.mockClear();
		revalidatePath.mockClear();
	});

	it("odświeża sitemapę i llms.txt przy pustym body", async () => {
		const response = await post({});

		expect(response.status).toBe(200);
		const paths = revalidatePath.mock.calls.map(([path]) => path);
		expect(paths).toContain("/sitemap.xml");
		expect(paths).toContain("/llms.txt");
	});

	it("dokłada własne `paths`, nie zastępując powierzchni SEO", async () => {
		await post({ paths: ["/sklep/certyfikaty"] });

		const paths = revalidatePath.mock.calls.map(([path]) => path);
		expect(paths).toContain("/sklep/certyfikaty");
		expect(paths).toContain("/sitemap.xml");
		expect(paths).toContain("/llms.txt");
	});

	it("odrzuca ścieżki spoza serwisu i duplikaty", async () => {
		await post({ paths: ["https://zly.example/x", "//zly.example", "/sitemap.xml", "/ok"] });

		const paths = revalidatePath.mock.calls.map(([path]) => path);
		expect(paths).toEqual(["/sitemap.xml", "/llms.txt", "/ok"]);
	});

	it("nadal revaliduje domyślne tagi", async () => {
		await post({});

		const tags = revalidateTag.mock.calls.map(([tag]) => tag);
		expect(tags).toContain("medusa-products");
		expect(tags).toContain("medusa-categories");
	});

	it("nie rusza cache bez poprawnego sekretu", async () => {
		const response = await post({}, "zly-sekret");

		expect(response.status).toBe(401);
		expect(revalidateTag).not.toHaveBeenCalled();
		expect(revalidatePath).not.toHaveBeenCalled();
	});
});
