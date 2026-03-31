/**
 * Zbiera adresy obrazów produktu z Medusa Store API.
 * Gdy `images` jest puste lub bez `url`, używa `thumbnail`.
 */
export function collectProductImages(product: {
  title: string;
  images?: unknown;
  thumbnail?: string | null;
}): Array<{ id: string; url: string; alt?: string }> {
  const raw = product.images;
  const list = Array.isArray(raw) ? raw : [];

  const mapped: Array<{ id: string; url: string; alt?: string }> = [];
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

  if (mapped.length > 0) return mapped;

  const thumb = product.thumbnail;
  if (typeof thumb === "string" && thumb.length > 0) {
    return [{ id: "thumbnail", url: thumb, alt: product.title }];
  }

  return [];
}
