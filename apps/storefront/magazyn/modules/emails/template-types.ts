import { z } from "zod";
import { magazynConfig } from "@magazyn/magazyn.config";
import type { EmailThemeConfig } from "@magazyn/core/config/types";

/**
 * Model danych wizualnego edytora maili transakcyjnych.
 *
 * Edytor jest blokowy (email-safe): bloki układane pionowo + kolumny + odstępy.
 * Brak absolutnego pozycjonowania — w klientach pocztowych (Gmail/Outlook)
 * liczy się układ tabelaryczny z inline-style. Renderer w render-template.ts.
 *
 * Branding, motyw i teksty domyślne pochodzą z magazyn.config.ts.
 */

export type TextAlign = "left" | "center" | "right";

export type FontKey = "serif" | "sans" | "mono";

/** Stosy fontów email-safe (web-safe — bez ładowania zewnętrznych krojów). */
export const FONT_STACKS: Record<FontKey, string> = {
	serif: "Georgia, 'Times New Roman', Times, serif",
	sans: "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
	mono: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
};

/** Globalny motyw maila — kolory, font, szerokość, nagłówek marki. */
export type EmailTheme = EmailThemeConfig;

/** Styl wspólny dla bloków tekstowych. */
export type BlockStyle = {
	color?: string;
	fontSize?: number;
	bold?: boolean;
	italic?: boolean;
	align?: TextAlign;
	bg?: string;
	paddingY?: number;
	paddingX?: number;
};

type BaseBlock = { id: string };

export type HeadingBlock = BaseBlock & {
	type: "heading";
	text: string;
	level: 1 | 2 | 3;
	style: BlockStyle;
};

export type TextBlock = BaseBlock & { type: "text"; text: string; style: BlockStyle };

export type ImageBlock = BaseBlock & {
	type: "image";
	src: string;
	alt: string;
	href?: string;
	width: number;
	align: TextAlign;
	paddingY?: number;
};

export type ButtonBlock = BaseBlock & {
	type: "button";
	label: string;
	href: string;
	bg?: string;
	color?: string;
	radius?: number;
	align?: TextAlign;
	paddingY?: number;
};

export type DividerBlock = BaseBlock & { type: "divider"; color?: string; paddingY?: number };

export type SpacerBlock = BaseBlock & { type: "spacer"; height: number };

export type OrderItemsBlock = BaseBlock & {
	type: "orderItems";
	showThumbnails: boolean;
	showTotal: boolean;
	style: BlockStyle;
};

export type FooterBlock = BaseBlock & { type: "footer"; text: string; style: BlockStyle };

/** Bloki dozwolone wewnątrz kolumn (bez zagnieżdżania kolumn / pozycji). */
export type LeafBlock =
	| HeadingBlock
	| TextBlock
	| ImageBlock
	| ButtonBlock
	| DividerBlock
	| SpacerBlock;

export type ColumnsBlock = BaseBlock & {
	type: "columns";
	left: LeafBlock[];
	right: LeafBlock[];
	gap?: number;
	paddingY?: number;
};

export type Block = LeafBlock | OrderItemsBlock | FooterBlock | ColumnsBlock;

export type BlockType = Block["type"];

export type EmailTemplateType =
	| "placed"
	| "realization_started"
	| "shipped"
	| "completed"
	| "cancelled"
	| "confirmation";

export type EmailTemplate = {
	type: EmailTemplateType;
	subject: string;
	preheader: string;
	theme: EmailTheme;
	blocks: Block[];
};

/** Kolejność + etykiety zakładek szablonów w edytorze. */
export const EMAIL_TEMPLATE_TYPES: Array<{
	type: EmailTemplateType;
	label: string;
	description: string;
}> = [
	{ type: "placed", label: "Złożone", description: "Po złożeniu zamówienia (event: order.placed)." },
	{
		type: "realization_started",
		label: "Realizacja",
		description: "Po zaakceptowaniu — start realizacji.",
	},
	{ type: "shipped", label: "Wysłane", description: "Po nadaniu przesyłki (event: shipment.created)." },
	{ type: "completed", label: "Zakończone", description: "Po zakończeniu zamówienia." },
	{ type: "cancelled", label: "Anulowane", description: "Po anulowaniu zamówienia (event: order.canceled)." },
	{ type: "confirmation", label: "Potwierdzenie", description: "Dodatkowe potwierdzenie zamówienia." },
];

/** Zmienne danych zamówienia dostępne w treści jako {{token}}. */
export const MERGE_VARIABLES: Array<{ token: string; label: string; sample: string }> = [
	{ token: "imie", label: "Imię klienta", sample: "Anna" },
	{ token: "nrZamowienia", label: "Numer zamówienia", sample: "1042" },
	{ token: "suma", label: "Suma do zapłaty", sample: "640 zł" },
	{ token: "sumaProduktow", label: "Suma produktów", sample: "590 zł" },
	{ token: "kosztWysylki", label: "Koszt wysyłki", sample: "50 zł" },
	{ token: "wysylka", label: "Metoda dostawy", sample: "Kurier" },
	{ token: "email", label: "E-mail klienta", sample: "anna@przyklad.pl" },
	{ token: "telefon", label: "Telefon", sample: "600 100 200" },
	{ token: "adres", label: "Adres dostawy", sample: "ul. Przykładowa 1, 00-000 Miasto" },
];

export const MERGE_TOKENS = MERGE_VARIABLES.map((v) => v.token);

/* ────────────────────────────────────────────── */
/* Domyślny motyw + szablony (z magazyn.config.ts)    */
/* ────────────────────────────────────────────── */

export const DEFAULT_THEME: EmailTheme = { ...magazynConfig.emailTheme };

const BRAND = magazynConfig.branding.name;
const FOOTER_TEXT = magazynConfig.email.footerText;
const CONTACT = magazynConfig.email.contactEmail;
const SITE = magazynConfig.email.siteUrl;

type StageContent = {
	subject: string;
	preheader: string;
	headline: string;
	paragraphs: string[];
	withItems: boolean;
	links?: string;
};

const STAGE_CONTENT: Record<EmailTemplateType, StageContent> = {
	placed: {
		subject: `Dziękujemy za zamówienie #{{nrZamowienia}}`,
		preheader: "Otrzymaliśmy zamówienie #{{nrZamowienia}}. Zabieramy się do pracy.",
		headline: "Dziękujemy za zamówienie #{{nrZamowienia}}",
		paragraphs: [
			"Otrzymaliśmy Twoje zamówienie i zabieramy się do pracy. Poniżej znajdziesz pełne podsumowanie. Gdy paczka wyruszy w drogę, dostaniesz osobnego maila ze statusem i numerem do śledzenia.",
		],
		withItems: true,
	},
	realization_started: {
		subject: `Rozpoczęliśmy realizację zamówienia #{{nrZamowienia}}`,
		preheader: "Twoje zamówienie trafiło do realizacji.",
		headline: "Rozpoczęcie realizacji",
		paragraphs: [
			"Twoje zamówienie #{{nrZamowienia}} zostało zaakceptowane i przekazane do realizacji.",
			"Pakujemy je z dbałością o bezpieczny transport — damy znać, gdy kurier odbierze paczkę.",
		],
		withItems: true,
	},
	shipped: {
		subject: `Zamówienie #{{nrZamowienia}} zostało wysłane`,
		preheader: "Twoje zamówienie #{{nrZamowienia}} jest w drodze.",
		headline: "Zamówienie #{{nrZamowienia}} jest w drodze",
		paragraphs: [
			"Właśnie przekazaliśmy Twoje zamówienie kurierowi. Powinno dotrzeć w ciągu 1–2 dni roboczych.",
		],
		withItems: false,
	},
	completed: {
		subject: `Zamówienie #{{nrZamowienia}} zakończone`,
		preheader: `Dziękujemy za zakupy w ${BRAND}.`,
		headline: "Zamówienie zakończone",
		paragraphs: [
			`Dziękujemy za zakupy w ${BRAND}. Mamy nadzieję, że wszystko spełniło Twoje oczekiwania.`,
			`W razie pytań napisz na ${CONTACT}.`,
		],
		withItems: false,
	},
	cancelled: {
		subject: `Zamówienie #{{nrZamowienia}} zostało anulowane`,
		preheader: "Anulowaliśmy zamówienie #{{nrZamowienia}}.",
		headline: "Zamówienie #{{nrZamowienia}} zostało anulowane",
		paragraphs: [
			"Informujemy, że Twoje zamówienie zostało anulowane. Jeżeli płatność została już zaksięgowana, zwrot pojawi się na koncie w ciągu 3–5 dni roboczych. Jeśli masz jakiekolwiek pytania, po prostu odpowiedz na tego maila.",
		],
		withItems: true,
	},
	confirmation: {
		subject: `Potwierdzenie zamówienia #{{nrZamowienia}}`,
		preheader: "Potwierdzenie Twojego zamówienia.",
		headline: "Dziękujemy za zamówienie!",
		paragraphs: ["Otrzymaliśmy Twoje zamówienie #{{nrZamowienia}} i właśnie je przetwarzamy. Poniżej szczegóły zakupu."],
		withItems: true,
	},
};

function leafText(id: string, text: string, style: BlockStyle): TextBlock {
	return { id, type: "text", text, style };
}

/** Domyślne bloki dla danego typu szablonu. */
export function buildDefaultBlocks(type: EmailTemplateType): Block[] {
	const content = STAGE_CONTENT[type];
	const blocks: Block[] = [
		{
			id: `${type}-headline`,
			type: "heading",
			text: content.headline,
			level: 1,
			style: { color: DEFAULT_THEME.accent, fontSize: 22, bold: true, align: "left", paddingY: 8 },
		},
		...content.paragraphs.map((p, i) =>
			leafText(`${type}-p${i}`, p, { color: DEFAULT_THEME.text, fontSize: 14, align: "left", paddingY: 6 }),
		),
	];

	if (content.withItems) {
		blocks.push({
			id: `${type}-items`,
			type: "orderItems",
			showThumbnails: false,
			showTotal: true,
			style: { color: DEFAULT_THEME.text, fontSize: 14, paddingY: 12 },
		});
	}

	if (content.links) {
		blocks.push(
			leafText(`${type}-links`, content.links, {
				color: DEFAULT_THEME.muted,
				fontSize: 13,
				align: "left",
				paddingY: 8,
			}),
		);
	}

	blocks.push({
		id: `${type}-footer`,
		type: "footer",
		text: FOOTER_TEXT,
		style: { color: DEFAULT_THEME.muted, fontSize: 11, align: "left", paddingY: 4 },
	});

	return blocks;
}

export function buildDefaultTemplate(type: EmailTemplateType): EmailTemplate {
	const content = STAGE_CONTENT[type];
	return {
		type,
		subject: content.subject,
		preheader: content.preheader,
		theme: { ...DEFAULT_THEME },
		blocks: buildDefaultBlocks(type),
	};
}

/* ────────────────────────────────────────────── */
/* Walidacja (Zod) — wspólna client + server         */
/* ────────────────────────────────────────────── */

const alignSchema = z.enum(["left", "center", "right"]);

const blockStyleSchema = z.object({
	color: z.string().optional(),
	fontSize: z.number().int().min(8).max(72).optional(),
	bold: z.boolean().optional(),
	italic: z.boolean().optional(),
	align: alignSchema.optional(),
	bg: z.string().optional(),
	paddingY: z.number().int().min(0).max(96).optional(),
	paddingX: z.number().int().min(0).max(96).optional(),
});

const headingSchema = z.object({
	id: z.string().min(1),
	type: z.literal("heading"),
	text: z.string(),
	level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
	style: blockStyleSchema,
});

const textSchema = z.object({
	id: z.string().min(1),
	type: z.literal("text"),
	text: z.string(),
	style: blockStyleSchema,
});

const imageSchema = z.object({
	id: z.string().min(1),
	type: z.literal("image"),
	src: z.string(),
	alt: z.string(),
	href: z.string().optional(),
	width: z.number().int().min(16).max(1200),
	align: alignSchema,
	paddingY: z.number().int().min(0).max(96).optional(),
});

const buttonSchema = z.object({
	id: z.string().min(1),
	type: z.literal("button"),
	label: z.string(),
	href: z.string(),
	bg: z.string().optional(),
	color: z.string().optional(),
	radius: z.number().int().min(0).max(48).optional(),
	align: alignSchema.optional(),
	paddingY: z.number().int().min(0).max(96).optional(),
});

const dividerSchema = z.object({
	id: z.string().min(1),
	type: z.literal("divider"),
	color: z.string().optional(),
	paddingY: z.number().int().min(0).max(96).optional(),
});

const spacerSchema = z.object({
	id: z.string().min(1),
	type: z.literal("spacer"),
	height: z.number().int().min(2).max(160),
});

const leafSchema = z.discriminatedUnion("type", [
	headingSchema,
	textSchema,
	imageSchema,
	buttonSchema,
	dividerSchema,
	spacerSchema,
]);

const orderItemsSchema = z.object({
	id: z.string().min(1),
	type: z.literal("orderItems"),
	showThumbnails: z.boolean(),
	showTotal: z.boolean(),
	style: blockStyleSchema,
});

const footerSchema = z.object({
	id: z.string().min(1),
	type: z.literal("footer"),
	text: z.string(),
	style: blockStyleSchema,
});

const columnsSchema = z.object({
	id: z.string().min(1),
	type: z.literal("columns"),
	left: z.array(leafSchema),
	right: z.array(leafSchema),
	gap: z.number().int().min(0).max(64).optional(),
	paddingY: z.number().int().min(0).max(96).optional(),
});

export const blockSchema = z.union([leafSchema, orderItemsSchema, footerSchema, columnsSchema]);

const themeSchema = z.object({
	bg: z.string(),
	contentBg: z.string(),
	text: z.string(),
	heading: z.string(),
	accent: z.string(),
	muted: z.string(),
	link: z.string(),
	fontKey: z.enum(["serif", "sans", "mono"]),
	contentWidth: z.number().int().min(320).max(800),
	radius: z.number().int().min(0).max(48),
	headerBg: z.string(),
	headerText: z.string(),
	brandName: z.string(),
});

export const emailTemplateTypeSchema = z.enum([
	"placed",
	"realization_started",
	"shipped",
	"completed",
	"cancelled",
	"confirmation",
]);

export const emailTemplateSchema = z.object({
	type: emailTemplateTypeSchema,
	subject: z.string().min(1).max(200),
	preheader: z.string().max(200),
	theme: themeSchema,
	blocks: z.array(blockSchema).max(200),
});

/** Bezpieczny parse jednego szablonu z nieznanego JSON (fallback = null). */
export function parseTemplate(raw: unknown): EmailTemplate | null {
	const result = emailTemplateSchema.safeParse(raw);
	return result.success ? (result.data as EmailTemplate) : null;
}
