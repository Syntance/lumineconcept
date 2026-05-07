/**
 * Proporcje zdjęć produktowych jak w eksporcie z Photoshopu (np. 3024×4032) — 3:4 (portret).
 */
export const PRODUCT_IMAGE_ASPECT_CLASS = "aspect-[3/4]" as const;

export const PRODUCT_CARD_IMAGE_WIDTH = 600;
export const PRODUCT_CARD_IMAGE_HEIGHT = 800;

/** Max szerokość głównego kadru galerii na desktopie (wysokość viewport × 3/4 × margines). */
export const PRODUCT_GALLERY_MAX_WIDTH_STYLE =
  "calc((100dvh - 200px) * (3 / 4) * 1.1)";

/** Górny łuk jak `ProductCard` z `frameVariant="arch-up"` (m.in. Bestsellery na stronie głównej). */
export const PRODUCT_IMAGE_ARCH_UP_BORDER_RADIUS =
  "50% 50% 0 0 / 40% 40% 0 0" as const;
