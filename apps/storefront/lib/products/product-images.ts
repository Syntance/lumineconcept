type ProductImage = { id: string; url: string; alt?: string };

const SCHEMA_ALT_RE = /^schemat/i;

function parseRawImages(raw: unknown): ProductImage[] {
  const list = Array.isArray(raw) ? raw : [];
  const mapped: ProductImage[] = [];
  for (let i = 0; i < list.length; i++) {
    const img = list[i];
    if (!img || typeof img !== "object") continue;
    const o = img as Record<string, unknown>;
    const url = typeof o.url === "string" && o.url.length > 0 ? o.url : null;
    if (!url) continue;
    const id = typeof o.id === "string" ? o.id : `img-${i}`;
    const alt = typeof o.alt === "string" ? o.alt : undefined;
    mapped.push({ id, url, alt });
  }
  return mapped;
}

/**
 * Zbiera adresy obrazów produktu z Medusa Store API.
 * Gdy `images` jest puste lub bez `url`, używa `thumbnail`.
 */
export function collectProductImages(product: {
  title: string;
  images?: unknown;
  thumbnail?: string | null;
}): ProductImage[] {
  const mapped = parseRawImages(product.images);
  if (mapped.length > 0) return mapped;

  const thumb = product.thumbnail;
  if (typeof thumb === "string" && thumb.length > 0) {
    return [{ id: "thumbnail", url: thumb, alt: product.title }];
  }

  return [];
}

/**
 * Wydziela zdjęcie-schemat z listy obrazów i metadata.
 *
 * Schemat rozpoznawany jest po:
 *  1. Alt-texcie zaczynającym się od "schemat" (case-insensitive) — Kasia wpisuje w Medusa Admin.
 *  2. Kluczu metadata `schema_image_url` — fallback.
 *
 * Zwraca `{ galleryImages, schemaImageUrl }` — galeria bez schematu.
 */
export function extractSchemaImage(product: {
  title: string;
  images?: unknown;
  thumbnail?: string | null;
  metadata?: Record<string, unknown> | null;
}): { galleryImages: ProductImage[]; schemaImageUrl: string | null } {
  const allImages = parseRawImages(product.images);

  const schemaIdx = allImages.findIndex((img) =>
    img.alt ? SCHEMA_ALT_RE.test(img.alt) : false,
  );

  if (schemaIdx !== -1) {
    const schema = allImages[schemaIdx];
    const gallery = allImages.filter((_, i) => i !== schemaIdx);
    const finalGallery =
      gallery.length > 0
        ? gallery
        : product.thumbnail
          ? [{ id: "thumbnail", url: product.thumbnail, alt: product.title }]
          : [];
    return { galleryImages: finalGallery, schemaImageUrl: schema.url };
  }

  const metaUrl = product.metadata?.schema_image_url;
  const schemaFromMeta =
    typeof metaUrl === "string" && metaUrl.length > 0 ? metaUrl : null;

  const gallery =
    allImages.length > 0
      ? allImages
      : product.thumbnail
        ? [{ id: "thumbnail", url: product.thumbnail, alt: product.title }]
        : [];

  return { galleryImages: gallery, schemaImageUrl: schemaFromMeta };
}
