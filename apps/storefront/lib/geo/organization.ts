import { SITE_URL } from "@/lib/utils";

const origin = SITE_URL.trim().replace(/\/$/, "");

/** Wspólny @id encji marki — łączy Organization, Store, Product.seller w grafie schema.org. */
export const ORGANIZATION_ID = `${origin}/#organization`;

/** @id lokalizacji sklepu/pracowni (strona /kontakt). */
export const STORE_ID = `${origin}/#store`;

export const ORGANIZATION_KNOWS_ABOUT = [
	"branding salonów beauty",
	"tablice z logo z plexi",
	"cenniki z plexi",
	"oznaczenia 3D",
	"certyfikaty z plexi",
] as const;

export const ORGANIZATION_POSTAL_ADDRESS = {
	"@type": "PostalAddress" as const,
	streetAddress: "Jana Pawła II 93",
	addressLocality: "Ryczów",
	postalCode: "34-115",
	addressCountry: "PL",
};
