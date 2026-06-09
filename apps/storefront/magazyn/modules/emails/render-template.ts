import { formatPrice } from "@magazyn/core/lib/format";
import {
	type Block,
	type BlockStyle,
	type ButtonBlock,
	type ColumnsBlock,
	BANK_TRANSFER_MERGE_VARIABLES,
	CONTACT_MERGE_VARIABLES,
	type DividerBlock,
	type EmailTemplate,
	type EmailTemplateType,
	type EmailTheme,
	FONT_STACKS,
	type FooterBlock,
	type HeadingBlock,
	type ImageBlock,
	isContactEmailTemplateType,
	type LeafBlock,
	type OrderItemsBlock,
	type SpacerBlock,
	type TextAlign,
	type TextBlock,
} from "./template-types";

export type EmailRenderItem = {
	title: string;
	quantity: number;
	total: string;
	thumbnail: string | null;
};

export type EmailRenderContext = {
	vars: Record<string, string>;
	items: EmailRenderItem[];
};

export type RenderedEmail = { html: string; text: string };

/**
 * Minimalny kształt zamówienia potrzebny do zbudowania kontekstu maila.
 * Niezależny od modułu `orders` — jeśli go używasz, zmapuj AdminOrderDetail na ten typ.
 */
export type OrderRenderSource = {
	displayId: number;
	email: string;
	phone: string;
	currencyCode: string;
	total: number;
	itemTotal: number;
	shippingTotal: number;
	shippingMethodName: string | null;
	customerName: string;
	address: string;
	items: EmailRenderItem[];
};

const MERGE_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

function esc(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function mergeHtml(raw: string, vars: Record<string, string>): string {
	const escaped = esc(raw);
	return escaped.replace(MERGE_RE, (_m, token: string) => esc(vars[token] ?? ""));
}

function mergePlain(raw: string, vars: Record<string, string>): string {
	return raw.replace(MERGE_RE, (_m, token: string) => vars[token] ?? "");
}

/** Scala zmienne w temacie maila (plaintext, np. „#{{nrZamowienia}}"). */
export function mergeSubject(raw: string, vars: Record<string, string>): string {
	return mergePlain(raw, vars);
}

function align(value: TextAlign | undefined): TextAlign {
	return value ?? "left";
}

function textStyleCss(style: BlockStyle, theme: EmailTheme): string {
	const parts = [
		`color:${style.color ?? theme.text}`,
		`font-size:${style.fontSize ?? 14}px`,
		"line-height:1.7",
		`text-align:${align(style.align)}`,
		"margin:0",
		`padding:${style.paddingY ?? 6}px ${style.paddingX ?? 0}px`,
	];
	if (style.bold) parts.push("font-weight:700");
	if (style.italic) parts.push("font-style:italic");
	if (style.bg) parts.push(`background:${style.bg}`);
	return parts.join(";");
}

function renderHeading(block: HeadingBlock, theme: EmailTheme, vars: Record<string, string>): string {
	const sizes: Record<1 | 2 | 3, number> = { 1: 22, 2: 18, 3: 16 };
	const style: BlockStyle = {
		...block.style,
		fontSize: block.style.fontSize ?? sizes[block.level],
		bold: block.style.bold ?? true,
		color: block.style.color ?? theme.heading,
	};
	return `<p style="${textStyleCss(style, theme)}">${mergeHtml(block.text, vars)}</p>`;
}

function renderText(block: TextBlock, theme: EmailTheme, vars: Record<string, string>): string {
	const html = mergeHtml(block.text, vars).replace(/\n/g, "<br>");
	return `<p style="${textStyleCss(block.style, theme)}">${html}</p>`;
}

function renderFooter(block: FooterBlock, theme: EmailTheme, vars: Record<string, string>): string {
	const style: BlockStyle = { color: theme.muted, fontSize: 11, ...block.style };
	return `<p style="${textStyleCss(style, theme)}">${mergeHtml(block.text, vars).replace(/\n/g, "<br>")}</p>`;
}

function renderImage(block: ImageBlock, vars: Record<string, string>): string {
	if (!block.src) return "";
	const img = `<img src="${esc(block.src)}" alt="${mergeHtml(block.alt, vars)}" width="${block.width}" style="display:block;border:0;outline:none;max-width:100%;height:auto;margin:${align(block.align) === "center" ? "0 auto" : "0"}" />`;
	const inner = block.href ? `<a href="${esc(block.href)}" target="_blank" rel="noopener">${img}</a>` : img;
	return `<div style="text-align:${align(block.align)};padding:${block.paddingY ?? 8}px 0">${inner}</div>`;
}

function renderButton(block: ButtonBlock, theme: EmailTheme, vars: Record<string, string>): string {
	const bg = block.bg ?? theme.accent;
	const color = block.color ?? "#ffffff";
	const radius = block.radius ?? 8;
	return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:${block.paddingY ?? 10}px ${align(block.align) === "center" ? "auto" : "0"}"><tr><td style="background:${bg};border-radius:${radius}px"><a href="${esc(block.href)}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 24px;color:${color};font-weight:700;font-size:14px;text-decoration:none;border-radius:${radius}px">${mergeHtml(block.label, vars)}</a></td></tr></table>`;
}

function renderDivider(block: DividerBlock): string {
	return `<div style="padding:${block.paddingY ?? 10}px 0"><div style="border-top:1px solid ${block.color ?? "#e8dcc0"}"></div></div>`;
}

function renderSpacer(block: SpacerBlock): string {
	return `<div style="height:${block.height}px;line-height:${block.height}px;font-size:1px">&nbsp;</div>`;
}

function renderOrderItems(block: OrderItemsBlock, theme: EmailTheme, ctx: EmailRenderContext): string {
	const rows = ctx.items
		.map((item) => {
			const titleCell = `<td style="padding:10px 0;border-bottom:1px solid #e8dcc0;font-size:${block.style.fontSize ?? 14}px;color:${block.style.color ?? theme.text}">${esc(item.title)}${item.quantity > 1 ? ` × ${item.quantity}` : ""}</td>`;
			const thumb =
				block.showThumbnails && item.thumbnail
					? `<td width="56" style="padding:10px 12px 10px 0;border-bottom:1px solid #e8dcc0"><img src="${esc(item.thumbnail)}" alt="" width="48" style="display:block;border-radius:6px" /></td>`
					: "";
			const priceCell = `<td style="padding:10px 0;border-bottom:1px solid #e8dcc0;text-align:right;white-space:nowrap;font-size:${block.style.fontSize ?? 14}px;color:${block.style.color ?? theme.text}">${esc(item.total)}</td>`;
			return `<tr>${thumb}${titleCell}${priceCell}</tr>`;
		})
		.join("");

	const totalRow = block.showTotal
		? `<tr><td${block.showThumbnails ? ' colspan="2"' : ""} style="padding:12px 0;font-size:16px;font-weight:700;color:${theme.text};border-top:2px solid ${theme.text}">Razem</td><td style="padding:12px 0;font-size:16px;font-weight:700;text-align:right;color:${theme.text};border-top:2px solid ${theme.text}">${esc(ctx.vars.suma ?? "")}</td></tr>`
		: "";

	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:${block.style.paddingY ?? 12}px 0">${rows}${totalRow}</table>`;
}

function renderLeaf(block: LeafBlock, theme: EmailTheme, vars: Record<string, string>): string {
	switch (block.type) {
		case "heading":
			return renderHeading(block, theme, vars);
		case "text":
			return renderText(block, theme, vars);
		case "image":
			return renderImage(block, vars);
		case "button":
			return renderButton(block, theme, vars);
		case "divider":
			return renderDivider(block);
		case "spacer":
			return renderSpacer(block);
	}
}

function renderColumns(block: ColumnsBlock, theme: EmailTheme, vars: Record<string, string>): string {
	const gap = block.gap ?? 16;
	const left = block.left.map((b) => renderLeaf(b, theme, vars)).join("");
	const right = block.right.map((b) => renderLeaf(b, theme, vars)).join("");
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:${block.paddingY ?? 8}px 0"><tr><td valign="top" width="50%" style="padding-right:${gap / 2}px">${left}</td><td valign="top" width="50%" style="padding-left:${gap / 2}px">${right}</td></tr></table>`;
}

function renderBlock(block: Block, theme: EmailTheme, ctx: EmailRenderContext): string {
	switch (block.type) {
		case "orderItems":
			return renderOrderItems(block, theme, ctx);
		case "footer":
			return renderFooter(block, theme, ctx.vars);
		case "columns":
			return renderColumns(block, theme, ctx.vars);
		default:
			return renderLeaf(block, theme, ctx.vars);
	}
}

/** Główny renderer: szablon + kontekst danych -> email-safe HTML + plaintext. */
export function renderTemplate(template: EmailTemplate, ctx: EmailRenderContext): RenderedEmail {
	const { theme } = template;
	const fontFamily = FONT_STACKS[theme.fontKey];
	const body = template.blocks.map((block) => renderBlock(block, theme, ctx)).join("\n");

	const header = theme.brandName
		? `<tr><td style="background:${theme.headerBg};padding:24px 32px"><p style="margin:0;font-size:24px;color:${theme.headerText};letter-spacing:0.05em">${esc(theme.brandName)}</p></td></tr>`
		: "";

	const preheader = template.preheader
		? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${mergeHtml(template.preheader, ctx.vars)}</div>`
		: "";

	const html = `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${theme.bg};font-family:${fontFamily};color:${theme.text}">
${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${theme.bg};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${theme.contentWidth}px;background:${theme.contentBg};border-radius:${theme.radius}px;border:1px solid #e8dcc0;overflow:hidden">
        ${header}
        <tr><td style="padding:32px;font-family:${fontFamily}">
          ${body}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

	return { html, text: renderPlainText(template, ctx) };
}

function plainBlock(block: Block, ctx: EmailRenderContext): string[] {
	switch (block.type) {
		case "heading":
		case "text":
		case "footer":
			return [mergePlain(block.text, ctx.vars)];
		case "button":
			return [`${mergePlain(block.label, ctx.vars)}: ${block.href}`];
		case "image":
			return block.alt ? [mergePlain(block.alt, ctx.vars)] : [];
		case "divider":
			return ["────────────────────"];
		case "spacer":
			return [""];
		case "orderItems": {
			const lines = ctx.items.map(
				(item) => `• ${item.title}${item.quantity > 1 ? ` × ${item.quantity}` : ""} — ${item.total}`,
			);
			if (block.showTotal) lines.push(`Razem: ${ctx.vars.suma ?? ""}`);
			return lines;
		}
		case "columns":
			return [...block.left, ...block.right].flatMap((b) => plainBlock(b, ctx));
	}
}

function renderPlainText(template: EmailTemplate, ctx: EmailRenderContext): string {
	return template.blocks
		.flatMap((block) => plainBlock(block, ctx))
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

/* ────────────────────────────────────────────── */
/* Kontekst danych — z zamówienia oraz przykładowy   */
/* ────────────────────────────────────────────── */

/** Buduje kontekst renderowania z realnego zamówienia (wysyłka). */
export function buildOrderRenderContext(order: OrderRenderSource): EmailRenderContext {
	const currency = order.currencyCode;
	return {
		vars: {
			imie: order.customerName,
			nrZamowienia: String(order.displayId),
			suma: formatPrice(order.total, currency),
			sumaProduktow: formatPrice(order.itemTotal, currency),
			kosztWysylki: formatPrice(order.shippingTotal, currency),
			wysylka: order.shippingMethodName ?? "—",
			email: order.email,
			telefon: order.phone,
			adres: order.address,
		},
		items: order.items,
	};
}

/** Kontekst przykładowy — podgląd w edytorze i test-send. */
export function sampleRenderContext(): EmailRenderContext {
	return {
		vars: {
			imie: "Anna",
			nrZamowienia: "1042",
			suma: "640 zł",
			sumaProduktow: "590 zł",
			kosztWysylki: "50 zł",
			wysylka: "Kurier",
			email: "anna@przyklad.pl",
			telefon: "600 100 200",
			adres: "ul. Przykładowa 1, 00-000 Miasto",
		},
		items: [
			{ title: "Produkt przykładowy A", quantity: 1, total: "420 zł", thumbnail: null },
			{ title: "Produkt przykładowy B", quantity: 1, total: "170 zł", thumbnail: null },
		],
	};
}

/** Kontekst przykładowy — podgląd / test (zamówienia lub formularz). */
export function sampleRenderContextForTemplate(type: EmailTemplateType): EmailRenderContext {
	if (isContactEmailTemplateType(type)) {
		const vars: Record<string, string> = {};
		for (const v of CONTACT_MERGE_VARIABLES) {
			vars[v.token] = v.sample;
		}
		return { vars, items: [] };
	}
	if (type === "bank_transfer_pending") {
		const base = sampleRenderContext();
		const vars: Record<string, string> = { ...base.vars };
		for (const v of BANK_TRANSFER_MERGE_VARIABLES) {
			if (!(v.token in vars)) vars[v.token] = v.sample;
		}
		return { vars, items: base.items };
	}
	return sampleRenderContext();
}
