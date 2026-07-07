/**
 * Protokół postMessage między stroną w iframie (PreviewOverlay) a stroną
 * podglądu w panelu magazynu. Same-origin — panel i storefront żyją w tej
 * samej aplikacji; mimo to każdy odbiornik weryfikuje `event.origin`.
 */

export const CMS_PREVIEW_SELECT = "lumine-cms:select" as const;
export const CMS_PREVIEW_RELOAD = "lumine-cms:reload" as const;

export type CmsPreviewSelectMessage = {
  type: typeof CMS_PREVIEW_SELECT;
  field: string;
};

export type CmsPreviewReloadMessage = {
  type: typeof CMS_PREVIEW_RELOAD;
};

/** Etykiety bloków/pól pokazywane w dymku nad podświetlonym elementem. */
export const CMS_FIELD_LABELS: Record<string, string> = {
  "page.home.hero": "Strona główna — Hero",
  "page.home.bestsellers": "Strona główna — Bestsellery",
  "page.home.testimonials": "Strona główna — Opinie",
  "page.home.footerCta": "Strona główna — CTA stopki",
  "settings.announcementBar": "Pasek ogłoszeń",
  "settings.trustBar": "Pasek zaufania",
};

export function cmsFieldLabel(field: string): string {
  if (CMS_FIELD_LABELS[field]) return CMS_FIELD_LABELS[field];
  // Fallback: ostatni segment ścieżki, np. page.o-nas.hero.headline → headline
  const parts = field.split(".");
  return parts.slice(-2).join(" · ");
}
