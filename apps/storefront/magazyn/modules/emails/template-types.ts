import { z } from "zod";
import { magazynConfig } from "@magazyn/magazyn.config";
import type { EmailThemeConfig } from "@magazyn/core/config/types";
import { FONT_KEYS, type FontKey } from "./email-fonts";

export { FONT_KEYS, FONT_STACKS, type FontKey } from "./email-fonts";
export { FONT_OPTIONS } from "./email-fonts";

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

export type OrderEmailTemplateType =
	| "placed"
	| "realization_started"
	| "shipped"
	| "completed"
	| "cancelled"
	| "confirmation"
	| "bank_transfer_pending"
	| "payment_failed";

/** Potwierdzenie dla klienta po wysłaniu formularza kontaktowego. */
export type ContactEmailTemplateType = "contact_confirmation";

export type EmailTemplateType = OrderEmailTemplateType | ContactEmailTemplateType;

const CONTACT_EMAIL_TEMPLATE_TYPES: ContactEmailTemplateType[] = ["contact_confirmation"];

export function isContactEmailTemplateType(
	type: EmailTemplateType,
): type is ContactEmailTemplateType {
	return (CONTACT_EMAIL_TEMPLATE_TYPES as EmailTemplateType[]).includes(type);
}

export type EmailTemplate = {
	type: EmailTemplateType;
	subject: string;
	preheader: string;
	theme: EmailTheme;
	blocks: Block[];
	/** Domyślnie włączone; `false` wyłącza automatyczną wysyłkę tego etapu. */
	enabled?: boolean;
};

export function isEmailTemplateEnabled(template: EmailTemplate | null | undefined): boolean {
	return template?.enabled !== false;
}

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
	{
		type: "bank_transfer_pending",
		label: "Przelew tradycyjny · dane do wpłaty",
		description: "Po złożeniu zamówienia z płatnością przelewem — dane konta i tytuł.",
	},
	{
		type: "payment_failed",
		label: "Płatność online · nieudana",
		description: "Gdy płatność Przelewy24 nie powiodła się — link do ponowienia.",
	},
	{
		type: "contact_confirmation",
		label: "Formularz kontaktowy · potwierdzenie",
		description: "Potwierdzenie odbioru wiadomości z formularza kontaktowego.",
	},
];

export type EmailTemplateCategoryId = "order" | "contact";

/** Grupy szablonów w edytorze magazynu. */
export const EMAIL_TEMPLATE_CATEGORIES: Array<{
	id: EmailTemplateCategoryId;
	title: string;
}> = [
	{ id: "order", title: "Zamówienie" },
	{ id: "contact", title: "Formularze" },
];

export function getEmailTemplatesByCategory(
	category: EmailTemplateCategoryId,
): typeof EMAIL_TEMPLATE_TYPES {
	return EMAIL_TEMPLATE_TYPES.filter((entry) => {
		if (category === "contact") return isContactEmailTemplateType(entry.type);
		return !isContactEmailTemplateType(entry.type);
	});
}

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

/** Zmienne dla maila o nieudanej płatności online ({{token}}). */
export const PAYMENT_FAILED_MERGE_VARIABLES: Array<{ token: string; label: string; sample: string }> = [
	...MERGE_VARIABLES,
	{
		token: "linkPlatnosci",
		label: "Link do ponownej płatności",
		sample: "https://lumineconcept.pl/checkout/p24/retry?cart_id=cart_abc123",
	},
];

/** Zmienne dla maila z danymi do przelewu ({{token}}). */
export const BANK_TRANSFER_MERGE_VARIABLES: Array<{ token: string; label: string; sample: string }> = [
	...MERGE_VARIABLES,
	{ token: "odbiorca", label: "Odbiorca przelewu", sample: "Lumine Concept" },
	{ token: "nrKonta", label: "Numer konta (IBAN)", sample: "PL58 1050 1100 1000 0090 8580 9698" },
	{ token: "swift", label: "SWIFT / BIC", sample: "INGBPLPW" },
	{ token: "adresOdbiorcy", label: "Adres odbiorcy", sample: "Jana Pawła II 93, 34-115 Ryczów" },
	{ token: "tytulPrzelewu", label: "Tytuł przelewu", sample: "Zamówienie #1042" },
	{ token: "terminPlatnosci", label: "Termin płatności", sample: "5 dni roboczych" },
];

/** Zmienne formularza kontaktowego ({{token}}) — szablon contact_confirmation. */
export const CONTACT_MERGE_VARIABLES: Array<{ token: string; label: string; sample: string }> = [
	{ token: "imie", label: "Imię nadawcy", sample: "Anna" },
	{ token: "email", label: "E-mail nadawcy", sample: "anna@przyklad.pl" },
	{ token: "temat", label: "Temat wiadomości", sample: "Formularz kontaktowy" },
	{ token: "numerSprawy", label: "Numer sprawy (FK-…)", sample: "FK-2026-00042" },
	{ token: "numerFormularza", label: "Numer formularza (alias numerSprawy)", sample: "FK-2026-00042" },
	{
		token: "wiadomosc",
		label: "Treść wiadomości (skrót)",
		sample: "Interesuje mnie projekt oświetlenia do salonu…",
	},
];

export function getMergeVariablesForTemplate(type: EmailTemplateType) {
	if (isContactEmailTemplateType(type)) return CONTACT_MERGE_VARIABLES;
	if (type === "bank_transfer_pending") return BANK_TRANSFER_MERGE_VARIABLES;
	if (type === "payment_failed") return PAYMENT_FAILED_MERGE_VARIABLES;
	return MERGE_VARIABLES;
}

export const MERGE_TOKENS = MERGE_VARIABLES.map((v) => v.token);

/* ────────────────────────────────────────────── */
/* Domyślny motyw + szablony (z magazyn.config.ts)    */
/* ────────────────────────────────────────────── */

export const DEFAULT_THEME: EmailTheme = { ...magazynConfig.emailTheme };

const BRAND = magazynConfig.branding.name;
const SUBJECT_PREFIX = `[${BRAND}]`;
const FOOTER_TEXT = magazynConfig.email.footerText;
const CONTACT = magazynConfig.email.contactEmail;

type StageContent = {
	subject: string;
	preheader: string;
	headline: string;
	paragraphs: string[];
	withItems: boolean;
	links?: string;
	button?: { label: string; href: string };
};

const STAGE_CONTENT: Record<EmailTemplateType, StageContent> = {
	placed: {
		subject: `${SUBJECT_PREFIX} Dziękujemy za zamówienie #{{nrZamowienia}}`,
		preheader: "Otrzymaliśmy zamówienie #{{nrZamowienia}}. Zabieramy się do pracy.",
		headline: "Dziękujemy za zamówienie #{{nrZamowienia}}",
		paragraphs: [
			"Otrzymaliśmy Twoje zamówienie i zabieramy się do pracy. Poniżej znajdziesz pełne podsumowanie. Gdy paczka wyruszy w drogę, dostaniesz osobnego maila ze statusem i numerem do śledzenia.",
		],
		withItems: true,
	},
	realization_started: {
		subject: `${SUBJECT_PREFIX} Rozpoczęliśmy realizację zamówienia #{{nrZamowienia}}`,
		preheader: "Twoje zamówienie trafiło do realizacji.",
		headline: "Rozpoczęcie realizacji",
		paragraphs: [
			"Twoje zamówienie #{{nrZamowienia}} zostało zaakceptowane i przekazane do realizacji.",
			"Pakujemy je z dbałością o bezpieczny transport — damy znać, gdy kurier odbierze paczkę.",
		],
		withItems: true,
	},
	shipped: {
		subject: `${SUBJECT_PREFIX} Zamówienie #{{nrZamowienia}} zostało wysłane`,
		preheader: "Twoje zamówienie #{{nrZamowienia}} jest w drodze.",
		headline: "Zamówienie #{{nrZamowienia}} jest w drodze",
		paragraphs: [
			"Właśnie przekazaliśmy Twoje zamówienie kurierowi. Powinno dotrzeć w ciągu 1–2 dni roboczych.",
		],
		withItems: false,
	},
	completed: {
		subject: `${SUBJECT_PREFIX} Zamówienie #{{nrZamowienia}} zakończone`,
		preheader: `Dziękujemy za zakupy w ${BRAND}.`,
		headline: "Zamówienie zakończone",
		paragraphs: [
			`Dziękujemy za zakupy w ${BRAND}. Mamy nadzieję, że wszystko spełniło Twoje oczekiwania.`,
			`W razie pytań napisz na ${CONTACT}.`,
		],
		withItems: false,
	},
	cancelled: {
		subject: `${SUBJECT_PREFIX} Zamówienie #{{nrZamowienia}} zostało anulowane`,
		preheader: "Anulowaliśmy zamówienie #{{nrZamowienia}}.",
		headline: "Zamówienie #{{nrZamowienia}} zostało anulowane",
		paragraphs: [
			"Informujemy, że Twoje zamówienie zostało anulowane. Jeżeli płatność została już zaksięgowana, zwrot pojawi się na koncie w ciągu 3–5 dni roboczych. Jeśli masz jakiekolwiek pytania, po prostu odpowiedz na tego maila.",
		],
		withItems: true,
	},
	confirmation: {
		subject: `${SUBJECT_PREFIX} Potwierdzenie zamówienia #{{nrZamowienia}}`,
		preheader: "Potwierdzenie Twojego zamówienia.",
		headline: "Dziękujemy za zamówienie!",
		paragraphs: ["Otrzymaliśmy Twoje zamówienie #{{nrZamowienia}} i właśnie je przetwarzamy. Poniżej szczegóły zakupu."],
		withItems: true,
	},
	payment_failed: {
		subject: `${SUBJECT_PREFIX} Płatność nieudana — dokończ zamówienie`,
		preheader: "Nie udało się zrealizować płatności. Możesz spróbować ponownie.",
		headline: "Płatność nie powiodła się",
		paragraphs: [
			"Cześć {{imie}}, niestety płatność Przelewy24 nie została zrealizowana.",
			"Twoje produkty nadal czekają w koszyku. Kliknij poniżej, aby spróbować ponownie:",
		],
		withItems: true,
		button: { label: "Zapłać ponownie", href: "{{linkPlatnosci}}" },
	},
	bank_transfer_pending: {
		subject: `${SUBJECT_PREFIX} Dane do przelewu — zamówienie #{{nrZamowienia}}`,
		preheader: "Opłać zamówienie przelewem w ciągu {{terminPlatnosci}}.",
		headline: "Dokończ płatność przelewem",
		paragraphs: [
			"Cześć {{imie}}, dziękujemy za złożenie zamówienia #{{nrZamowienia}}.",
			"Opłać je przelewem na konto:",
			"Odbiorca: {{odbiorca}}",
			"Adres: {{adresOdbiorcy}}",
			"Numer konta (IBAN): {{nrKonta}}",
			"SWIFT / BIC: {{swift}}",
			"Tytuł przelewu: {{tytulPrzelewu}}",
			"Kwota: {{suma}}",
			"Termin płatności: {{terminPlatnosci}}.",
			"Po zaksięgowaniu wpłaty wyślemy Ci potwierdzenie i rozpoczniemy realizację zamówienia.",
		],
		withItems: true,
	},
	contact_confirmation: {
		subject: `${SUBJECT_PREFIX} Otrzymaliśmy wiadomość — {{numerSprawy}}`,
		preheader: "Potwierdzenie odbioru formularza kontaktowego.",
		headline: "Dziękujemy za wiadomość",
		paragraphs: [
			"Cześć {{imie}}, potwierdzamy odbiór formularza kontaktowego.",
			"Numer sprawy: {{numerSprawy}}. Temat: {{temat}}.",
			"Odpowiemy możliwie szybko — zwykle w ciągu 1–2 dni roboczych.",
		],
		withItems: false,
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

	if (content.button) {
		blocks.push({
			id: `${type}-btn`,
			type: "button",
			label: content.button.label,
			href: content.button.href,
			align: "center",
			paddingY: 12,
		});
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
		enabled: true,
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
	fontKey: z.enum(FONT_KEYS),
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
	"bank_transfer_pending",
	"payment_failed",
	"contact_confirmation",
]);

export const emailTemplateSchema = z.object({
	type: emailTemplateTypeSchema,
	subject: z.string().min(1).max(200),
	preheader: z.string().max(200),
	theme: themeSchema,
	blocks: z.array(blockSchema).max(200),
	enabled: z.boolean().optional(),
});

/** Bezpieczny parse jednego szablonu z nieznanego JSON (fallback = null). */
export function parseTemplate(raw: unknown): EmailTemplate | null {
	const result = emailTemplateSchema.safeParse(raw);
	return result.success ? (result.data as EmailTemplate) : null;
}
