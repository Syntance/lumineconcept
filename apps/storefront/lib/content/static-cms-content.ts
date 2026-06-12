// Fallback przed pierwszym prebuild — storefront czyta treść live z Medusa.
// Mapa mediów: lib/content/static-cms-media-map.ts

export const STATIC_CMS_CONTENT = {
	magazyn_site_settings: {},
	magazyn_page_content: {},
	magazyn_global_content: {},
} as const;

export type StaticCmsContent = typeof STATIC_CMS_CONTENT;
