/**
 * Jedna kanoniczna ścieżka URL na produkt.
 *
 * Produkt może być fizycznie dostępny pod kilkoma ścieżkami kategorii
 * (`/sklep/gotowe-wzory/<h>`, `/sklep/certyfikaty/<h>`, `/sklep/tablice-z-logo/<h>`),
 * ale dla SEO wskazujemy DOKŁADNIE JEDNĄ — żeby uniknąć duplicate content.
 * Używane spójnie w `sitemap.ts` (jeden wpis) oraz w `generateMetadata`
 * produktu (`alternates.canonical`).
 */

const CERT_TAG = "certyfikat";
const LOGO_TAG = "logo-3d";

type TaggedProduct = {
	tags?: Array<{ value?: string | null } | null> | null;
} | null | undefined;

/** Tagi produktu znormalizowane do lowercase (puste odfiltrowane). */
export function productTagValues(product: TaggedProduct): string[] {
	return (product?.tags ?? [])
		.map((t) => (t?.value ?? "").toLowerCase().trim())
		.filter(Boolean);
}

/** Kanoniczna ścieżka kategorii produktu (bez końcowego slasha). */
export function canonicalProductBasePath(tags: string[]): string {
	if (tags.includes(CERT_TAG)) return "/sklep/certyfikaty";
	if (tags.includes(LOGO_TAG)) return "/sklep/tablice-z-logo";
	return "/sklep/gotowe-wzory";
}

/** Pełna kanoniczna ścieżka produktu, np. `/sklep/certyfikaty/<handle>`. */
export function canonicalProductPath(handle: string, tags: string[]): string {
	return `${canonicalProductBasePath(tags)}/${handle}`;
}
