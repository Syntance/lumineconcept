/**
 * Protokół postMessage między stroną w iframie (PreviewOverlay) a stroną
 * podglądu w panelu magazynu. Same-origin — panel i storefront żyją w tej
 * samej aplikacji; mimo to każdy odbiornik weryfikuje `event.origin`.
 */

export const CMS_PREVIEW_SELECT = "lumine-cms:select" as const;
export const CMS_PREVIEW_RELOAD = "lumine-cms:reload" as const;
export const CMS_PREVIEW_INLINE = "lumine-cms:inline" as const;
export const CMS_PREVIEW_MEDIA = "lumine-cms:media" as const;

export type CmsPreviewInlineMessage = {
	type: typeof CMS_PREVIEW_INLINE;
	field: string;
	value: string;
};

export type CmsPreviewMediaMessage = {
	type: typeof CMS_PREVIEW_MEDIA;
	field: string;
};

export type CmsPreviewSelectMessage = {
  type: typeof CMS_PREVIEW_SELECT;
  field: string;
};

export type CmsPreviewReloadMessage = {
  type: typeof CMS_PREVIEW_RELOAD;
};

/** Polskie nazwy bloków CMS (spójne z legendami edytorów magazynu). */
const BLOCK_LABELS: Record<string, string> = {
  hero: "Hero",
  about: "Sekcje „O nas”",
  brandingCta: "CTA brandingowe",
  testimonials: "Opinie",
  faq: "FAQ",
  gallery: "Galeria",
  categoryTiles: "Kafle kategorii",
  bestsellers: "Bestsellery",
};

const PAGE_LABELS: Record<string, string> = {
  home: "Strona główna",
  shop: "Sklep",
  "logo-3d": "Tablice z logo",
  "gotowe-wzory": "Gotowe wzory",
  certyfikaty: "Certyfikaty",
  "o-nas": "O nas",
};

const SETTINGS_LABELS: Record<string, string> = {
  announcementBar: "Pasek informacyjny",
  trustBar: "Trust bar",
  checkoutCallout: "Checkout callout",
  footer: "Stopka i social media",
};

/** Etykieta dymka nad podświetlonym elementem — z konwencji ścieżki. */
export function cmsFieldLabel(field: string): string {
  const [scope, second, third] = field.split(".");
  if (scope === "page" && second) {
    const page = PAGE_LABELS[second] ?? second;
    const block = third ? (BLOCK_LABELS[third] ?? third) : "";
    return block ? `${page} — ${block}` : page;
  }
  if (scope === "settings" && second) {
    return SETTINGS_LABELS[second] ?? second;
  }
  if (scope === "global" && second) {
    return second;
  }
  return field.split(".").slice(-2).join(" · ");
}
