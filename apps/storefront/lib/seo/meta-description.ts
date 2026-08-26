import { stripHtmlForDimensions } from "@/lib/products/dimensions";

/**
 * Opisy produktów w Medusie to HTML (renderujemy je przez
 * `sanitizeProductCardDescriptionHtml`). Wrzucone wprost do
 * `<meta name="description">` dają znaczniki i encje w snippetcie Google
 * oraz w `og:description` — JSON-LD produktu już je czyścił
 * (`plainDescription`), metadane strony nie.
 */

/** Google ucina snippet w okolicach 155-160 znaków. */
const MAX_META_DESCRIPTION = 160;

/**
 * HTML → czysty tekst przycięty na granicy słowa.
 * `undefined`, gdy po oczyszczeniu nic nie zostaje — wtedy `buildMetadata`
 * sięgnie po opis ze `siteSettings` zamiast wystawiać pusty string.
 */
export function toMetaDescription(
	raw: string | null | undefined,
	maxLength = MAX_META_DESCRIPTION,
): string | undefined {
	if (!raw) return undefined;

	const plain = stripHtmlForDimensions(raw).replace(/\s+/g, " ").trim();
	if (!plain) return undefined;
	if (plain.length <= maxLength) return plain;

	const cut = plain.slice(0, maxLength);
	const lastSpace = cut.lastIndexOf(" ");
	// Ucinamy na spacji tylko wtedy, gdy nie obcina to zdania do połowy długości
	// (opis bez spacji — np. jeden długi wyraz — przycinamy twardo).
	const trimmed = lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut;

	return `${trimmed.replace(/[\s.,;:!?–—-]+$/, "")}…`;
}
