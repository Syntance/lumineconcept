import type { PageSection, SectionTypeId } from "./sections/schema";

export type SectionRegistryEntry = {
	type: SectionTypeId;
	label: string;
	description: string;
	/** Krótkie pole do podglądu w katalogu */
	preview: string;
	/** Czy sekcja może zawierać jedyne H1 na stronie */
	ownsPageH1?: boolean;
};

export const SECTION_REGISTRY: SectionRegistryEntry[] = [
	{
		type: "hero",
		label: "Hero",
		description: "Nagłówek z tłem, CTA — jedyne H1 na stronie",
		preview: "Pełnoekranowy baner z CTA",
		ownsPageH1: true,
	},
	{
		type: "bestsellers",
		label: "Bestsellery",
		description: "Siatka produktów (max 4)",
		preview: "Kafelki produktów",
	},
	{
		type: "socialProof",
		label: "Social proof",
		description: "Pasek UVP / zaufania",
		preview: "Ikony + krótkie hasła",
	},
	{
		type: "cta",
		label: "CTA",
		description: "Wezwanie do działania z tłem",
		preview: "Nagłówek + przycisk",
	},
	{
		type: "textImage",
		label: "Tekst + obraz",
		description: "Dwie kolumny: copy i zdjęcie",
		preview: "Tekst obok obrazu",
	},
	{
		type: "richText",
		label: "Tekst sformatowany",
		description: "Nagłówek + HTML (ograniczony)",
		preview: "Akapit, listy, linki",
	},
	{
		type: "gallery",
		label: "Galeria",
		description: "Siatka zdjęć",
		preview: "Zdjęcia realizacji",
	},
	{
		type: "faq",
		label: "FAQ",
		description: "Pytania i odpowiedzi",
		preview: "Akordeon FAQ",
	},
	{
		type: "testimonials",
		label: "Opinie",
		description: "Cytaty klientów",
		preview: "Karty opinii",
	},
	{
		type: "categoryTiles",
		label: "Kafle kategorii",
		description: "Kafelki linkujące do kategorii",
		preview: "4 kafle ze zdjęciami",
	},
	{
		type: "about",
		label: "O nas",
		description: "Sekcje intro / misja / zakończenie",
		preview: "Bloki „O nas”",
	},
	{
		type: "divider",
		label: "Separator",
		description: "Linia lub odstęp",
		preview: "Linia / przerwa",
	},
	{
		type: "contactForm",
		label: "Formularz kontaktu",
		description: "Link do strony kontakt",
		preview: "CTA do /kontakt",
	},
	{
		type: "embedMap",
		label: "Mapa",
		description: "Osadzona mapa (URL)",
		preview: "iframe mapy",
	},
];

export const SECTION_REGISTRY_MAP = Object.fromEntries(
	SECTION_REGISTRY.map((e) => [e.type, e]),
) as Record<SectionTypeId, SectionRegistryEntry>;

export function defaultPropsForSection(type: SectionTypeId): PageSection["props"] {
	switch (type) {
		case "hero":
			return {
				headline: "Nagłówek",
				description: "Opis sekcji hero",
				ctaLabel: "Dowiedz się więcej",
				ctaHref: "/sklep",
			};
		case "bestsellers":
			return { productIds: [], title: "Bestsellery" };
		case "cta":
			return {
				heading: "Nagłówek CTA",
				subheading: "Podtytuł",
				ctaLabel: "Zobacz ofertę",
				ctaHref: "/sklep",
			};
		case "richText":
			return { bodyHtml: "<p>Treść sekcji</p>" };
		case "textImage":
			return { heading: "Nagłówek", body: "Treść", imagePosition: "right" };
		case "divider":
			return { style: "line" };
		case "contactForm":
			return { heading: "Kontakt", intro: "Napisz do nas" };
		case "embedMap":
			return {
				heading: "Lokalizacja",
				embedUrl: "https://www.google.com/maps/embed?pb=",
			};
		case "testimonials":
			return { items: [] };
		case "faq":
			return { items: [] };
		case "gallery":
			return { items: [] };
		case "categoryTiles":
			return { items: [] };
		case "about":
			return { introHeading: "O nas" };
		case "socialProof":
			return {};
		default:
			return {};
	}
}

export function createSection(type: SectionTypeId): PageSection {
	const id = `${type}-${crypto.randomUUID().slice(0, 8)}`;
	return {
		id,
		type,
		props: defaultPropsForSection(type),
	} as PageSection;
}
