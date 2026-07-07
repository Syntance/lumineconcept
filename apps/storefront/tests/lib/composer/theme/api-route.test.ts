import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@magazyn/core/medusa/session", () => ({
	getSessionToken: vi.fn(),
}));

import { getSessionToken } from "@magazyn/core/medusa/session";
import { POST } from "@/app/api/composer/theme-tokens/route";
import { DEFAULT_THEME_TOKENS } from "@/lib/composer/theme/defaults";

describe("POST /api/composer/theme-tokens", () => {
	beforeEach(() => {
		vi.mocked(getSessionToken).mockReset();
	});

	it("zwraca 401 bez sesji admina", async () => {
		vi.mocked(getSessionToken).mockResolvedValue(null);
		const req = new NextRequest("http://localhost/api/composer/theme-tokens", {
			method: "POST",
			body: JSON.stringify(DEFAULT_THEME_TOKENS),
		});
		const res = await POST(req);
		expect(res.status).toBe(401);
	});

	it("zwraca 400 dla payloadu z kolorem hex (nie OKLCH)", async () => {
		vi.mocked(getSessionToken).mockResolvedValue("fake-token");
		const bad = {
			...DEFAULT_THEME_TOKENS,
			colors: { ...DEFAULT_THEME_TOKENS.colors, accent: "#AF7C61" },
		};
		const req = new NextRequest("http://localhost/api/composer/theme-tokens", {
			method: "POST",
			body: JSON.stringify(bad),
		});
		const res = await POST(req);
		expect(res.status).toBe(400);
	});

	it("zwraca 400 dla XSS w kolorze", async () => {
		vi.mocked(getSessionToken).mockResolvedValue("fake-token");
		const bad = {
			...DEFAULT_THEME_TOKENS,
			colors: {
				...DEFAULT_THEME_TOKENS.colors,
				accent: "oklch(0.5 0.1 30);</style><script>alert(1)</script>",
			},
		};
		const req = new NextRequest("http://localhost/api/composer/theme-tokens", {
			method: "POST",
			body: JSON.stringify(bad),
		});
		const res = await POST(req);
		expect(res.status).toBe(400);
	});

	it("zwraca 200 dla poprawnego payloadu (walidacja OK)", async () => {
		vi.mocked(getSessionToken).mockResolvedValue("fake-token");
		const req = new NextRequest("http://localhost/api/composer/theme-tokens", {
			method: "POST",
			body: JSON.stringify(DEFAULT_THEME_TOKENS),
		});
		const res = await POST(req);
		expect(res.status).toBe(200);
	});
});
