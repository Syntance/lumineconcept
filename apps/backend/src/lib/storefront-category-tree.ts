/**
 * Taksonomia zgodna ze storefrontem:
 * - Hub /sklep: Gotowe wzory, Logo 3D, Certyfikaty
 * - Pod /sklep/gotowe-wzory: „pigułki” (PRODUCT_PILLS bez „all” i bez „certyfikaty” — certyfikaty mają osobny root)
 *
 * Handlery muszą być stabilne — URL `?kat=<handle>` na liście gotowe-wzory je dopasowuje.
 */

export const STOREFRONT_ROOT_CATEGORIES = [
  {
    handle: "gotowe-wzory",
    name: "Gotowe wzory",
    description: "Cenniki, tabliczki, menu, kody QR, wizytowniki — realizacja ok. 10 dni roboczych.",
  },
  {
    handle: "logo-3d",
    name: "Logo 3D",
    description: "Logo 3D z plexi — LED, matowe wykończenia.",
  },
  {
    handle: "certyfikaty",
    name: "Certyfikaty",
    description: "Dyplomy, podziękowania, vouchery z plexi.",
  },
] as const;

/** Dzieci kategorii „gotowe-wzory” — zgodne z PRODUCT_PILLS (bez certyfikatów). */
export const STOREFRONT_GOTOWE_WZORY_CHILDREN = [
  { handle: "cenniki", name: "Cenniki" },
  { handle: "tabliczki", name: "Tabliczki" },
  { handle: "menu", name: "Menu" },
  { handle: "qr", name: "Kody QR" },
  { handle: "wizytowniki", name: "Wizytowniki" },
] as const;

/** Logika jak `matchesPill` na storefront (`filter-types.ts`) — bez importu z apps/storefront. */
export function matchesPill(
  pill: string,
  handle: string,
  title: string,
): boolean {
  const h = handle.toLowerCase();
  const t = title.toLowerCase();
  switch (pill) {
    case "cenniki":
      return h.includes("cennik");
    case "tabliczki":
      return (
        h.includes("tabliczk") ||
        h.includes("piktogram") ||
        h.includes("zakaz") ||
        h.includes("instrukcja-mycia") ||
        h.includes("higiena") ||
        h.includes("zaleceni") ||
        h.includes("pielegnac") ||
        h.includes("pomieszczen") ||
        h.includes("informacyjn")
      );
    case "menu":
      return h.includes("menu") || h.includes("drink");
    case "qr":
      return h.includes("qr") || h.includes("wifi") || h.includes("wi-fi");
    case "wizytowniki":
      return h.includes("wizytownik");
    case "certyfikaty":
      return (
        h.includes("certyfikat") ||
        h.includes("dyplom") ||
        h.includes("voucher") ||
        h.includes("podziękow") ||
        h.includes("podziekow") ||
        t.includes("certyfikat") ||
        t.includes("dyplom") ||
        t.includes("voucher")
      );
    default:
      return false;
  }
}

export function isCertificateProduct(handle: string, title: string): boolean {
  return matchesPill("certyfikaty", handle, title);
}

export function isLogo3dProduct(handle: string, title: string): boolean {
  const h = handle.toLowerCase();
  const t = title.toLowerCase();
  if (h.includes("logo-3d") || h.includes("logo_3d")) return true;
  if (h.includes("logo") && (h.includes("3d") || h.includes("3-d"))) return true;
  if (t.includes("logo 3d") || t.includes("logo 3 d")) return true;
  return false;
}

export type ProductLike = { id: string; handle: string; title: string };

/**
 * Zwraca listę **handle’ów** kategorii Medusy, do których produkt powinien należeć
 * (root + ewentualnie jedno dziecko „gotowe-wzory”).
 */
export function resolveCategoryHandlesForProduct(p: ProductLike): string[] {
  const { handle, title } = p;
  if (isCertificateProduct(handle, title)) {
    return ["certyfikaty"];
  }
  if (isLogo3dProduct(handle, title)) {
    return ["logo-3d"];
  }

  const out = new Set<string>(["gotowe-wzory"]);
  for (const { handle: childHandle } of STOREFRONT_GOTOWE_WZORY_CHILDREN) {
    if (matchesPill(childHandle, handle, title)) {
      out.add(childHandle);
      break;
    }
  }
  return Array.from(out);
}
