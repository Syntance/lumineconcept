import { describe, expect, it } from "vitest";
import { renderTemplate, sampleRenderContext } from "@magazyn/modules/emails/render-template";
import { mergeRichHtml, mergeRichPlain } from "@magazyn/modules/emails/email-inline-format";
import { buildDefaultTemplate } from "@magazyn/modules/emails/template-types";

describe("email-inline-format", () => {
	it("zachowuje inline font-size na span", () => {
		const html = mergeRichHtml('<span style="font-size:18px">Duży</span>', {});
		expect(html).toContain("font-size:18px");
	});

	it("renderuje HTML inline z strong", () => {
		const html = mergeRichHtml("Klient: <strong>Anna</strong>", {});
		expect(html).toBe("Klient: <strong>Anna</strong>");
	});

	it("podstawia zmienne wewnątrz HTML", () => {
		const html = mergeRichHtml("<strong>{{imie}}</strong>", { imie: "Anna" });
		expect(html).toBe("<strong>Anna</strong>");
	});

	it("wspiera legacy ** dla starych szablonów", () => {
		const html = mergeRichHtml("**Anna**", {});
		expect(html).toBe("<strong>Anna</strong>");
	});

	it("escapuje HTML w zmiennych", () => {
		const html = mergeRichHtml("<strong>{{x}}</strong>", { x: "<script>" });
		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});

	it("plain text bez znaczników", () => {
		expect(mergeRichPlain("<strong>640 zł</strong>", {})).toBe("640 zł");
		expect(mergeRichPlain("**640 zł**", {})).toBe("640 zł");
	});

	it("renderuje inline formatowanie w szablonie maila", () => {
		const tpl = buildDefaultTemplate("placed");
		const block = tpl.blocks.find((b) => b.type === "text");
		if (!block || block.type !== "text") throw new Error("brak bloku text");
		block.text = "Witaj <strong>{{imie}}</strong>!";
		const ctx = sampleRenderContext();
		const { html, text } = renderTemplate(tpl, ctx);
		expect(html).toContain("<strong>Anna</strong>");
		expect(text).toContain("Witaj Anna!");
	});
});
