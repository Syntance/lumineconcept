import { describe, expect, it } from "vitest";
import { parseInlineEditValue } from "@/lib/composer/inline-edit";

describe("parseInlineEditValue", () => {
	it("text — usuwa tagi HTML", () => {
		expect(parseInlineEditValue("<b>Hello</b> world", "text")).toBe("Hello world");
	});

	it("text — odrzuca script", () => {
		expect(parseInlineEditValue('x<script>alert(1)</script>', "text")).toBe("x");
	});

	it("html — dozwolone tagi rich-text", () => {
		const out = parseInlineEditValue("<p>OK</p><script>x</script>", "html");
		expect(out).toContain("<p>OK</p>");
		expect(out).not.toContain("script");
	});
});
