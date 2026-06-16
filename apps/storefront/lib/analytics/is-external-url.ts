/**
 * Czy href prowadzi poza domenę sklepu (outbound_click vs cta_click).
 * mailto:/tel:/# — zawsze wewnętrzne (obsługiwane osobno jako contact_click).
 */
export function isExternalUrl(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return false;
  if (/^(mailto:|tel:)/i.test(trimmed)) return false;

  try {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lumineconcept.pl");
    const url = new URL(trimmed, base);
    const site = new URL(base);
    return url.origin !== site.origin;
  } catch {
    return false;
  }
}
