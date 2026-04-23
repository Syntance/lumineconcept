import type { IProductModuleService } from "@medusajs/framework/types";

/** Zgodnie z PDP i `/store/custom/certificate-line-item`. */
export const CERTIFICATE_PRODUCT_TAG = "certyfikaty";

export function normaliseCertToken(s: string | null | undefined): string {
  return (s || "").toLowerCase().trim();
}

export function categoryHandleNameMatchesCertificate(
  handle: string | null | undefined,
  name: string | null | undefined,
): boolean {
  const h = normaliseCertToken(handle ?? undefined);
  const n = normaliseCertToken(name ?? undefined);
  return (
    h === CERTIFICATE_PRODUCT_TAG ||
    h.includes("certyfikat") ||
    n.includes("certyfikat")
  );
}

export type CertificateCategoryNode = {
  handle?: string | null;
  name?: string | null;
  parent_category?: CertificateCategoryNode | null;
} | null;

export function categoryNodeOrAncestorsMatchCertificate(
  node: CertificateCategoryNode,
): boolean {
  let cur: CertificateCategoryNode = node;
  while (cur) {
    if (categoryHandleNameMatchesCertificate(cur.handle, cur.name)) return true;
    cur = cur.parent_category ?? null;
  }
  return false;
}

export function productTagsMatchCertificate(
  tags: Array<{ value?: string | null } | null> | null | undefined,
): boolean {
  return (tags ?? []).some((t) => {
    if (!t) return false;
    const raw =
      typeof (t as { value?: unknown }).value === "string"
        ? (t as { value: string }).value
        : typeof (t as { tag?: { value?: string } }).tag?.value === "string"
          ? (t as { tag: { value: string } }).tag.value
          : "";
    return normaliseCertToken(raw) === CERTIFICATE_PRODUCT_TAG;
  });
}

/** Kolekcja produktu (Medusa) — to samo co kategoria: handle / „nazwa”. */
export function productCollectionMatchesCertificate(
  collection: { handle?: string | null; title?: string | null } | null | undefined,
): boolean {
  if (!collection) return false;
  return categoryHandleNameMatchesCertificate(collection.handle, collection.title);
}

/**
 * Gdy `parent_category` nie jest zexpandowany, zostaje `parent_category_id`.
 * Idziemy w górę drzewa kategorii tak jak faktyczna taksonomia w Adminie.
 */
export async function productCategoriesMatchCertificateByParentIdWalk(
  productService: IProductModuleService,
  categories: Array<{
    id?: string;
    handle?: string;
    name?: string;
    parent_category_id?: string | null;
  } | null> | null | undefined,
): Promise<boolean> {
  const roots = (categories ?? []).filter(
    (c): c is NonNullable<typeof c> => c != null && typeof c.id === "string" && c.id.length > 0,
  );
  for (const root of roots) {
    let cur:
      | {
          id?: string;
          handle?: string;
          name?: string;
          parent_category_id?: string | null;
        }
      | null = root;
    const seen = new Set<string>();
    while (cur?.id && !seen.has(cur.id)) {
      seen.add(cur.id);
      if (categoryHandleNameMatchesCertificate(cur.handle, cur.name)) return true;
      const pid = cur.parent_category_id?.trim();
      if (!pid) break;
      try {
        cur = await productService.retrieveProductCategory(pid, {
          select: ["id", "handle", "name", "parent_category_id"],
        });
      } catch {
        break;
      }
    }
  }
  return false;
}

export function productCategoriesMatchCertificate(
  categories: CertificateCategoryNode[] | null | undefined,
): boolean {
  return (categories ?? []).some((c) =>
    c ? categoryNodeOrAncestorsMatchCertificate(c) : false,
  );
}

/**
 * Pola do `query.graph` — łańcuch przodków pod każdą kategorią.
 * Np. `prefix = "categories"` (encja product) albo `"product.categories"` (encja variant).
 */
export function buildCategoryGraphFieldsWithPrefix(
  prefix: string,
  maxAncestorDepth: number,
): string[] {
  const fields = [`${prefix}.handle`, `${prefix}.name`];
  let path = prefix;
  for (let i = 0; i < maxAncestorDepth; i++) {
    path += ".parent_category";
    fields.push(`${path}.handle`, `${path}.name`);
  }
  return fields;
}
