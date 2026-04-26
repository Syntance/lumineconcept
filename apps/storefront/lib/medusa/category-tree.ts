/**
 * Taksonomia zsynchronizowana z Medusą (`sync-storefront-categories` w backendzie).
 */
export const LISTING_CATEGORY_HANDLE = {
  gotoweWzory: "gotowe-wzory",
  logo3d: "logo-3d",
  certyfikaty: "certyfikaty",
} as const;

export type CategoryTreeNode = {
  id: string;
  handle: string;
  name: string;
  category_children?: CategoryTreeNode[] | null;
};

export function flattenCategoryTree(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  const out: CategoryTreeNode[] = [];
  for (const n of nodes) {
    out.push(n);
    if (n.category_children?.length) {
      out.push(...flattenCategoryTree(n.category_children));
    }
  }
  return out;
}

export function categoryIdByHandle(
  nodes: CategoryTreeNode[],
  handle: string,
): string | undefined {
  return flattenCategoryTree(nodes).find((c) => c.handle === handle)?.id;
}

export function categoryIdFromKatParam(
  nodes: CategoryTreeNode[],
  kat: string | undefined,
): string | undefined {
  if (!kat) return undefined;
  return flattenCategoryTree(nodes).find((c) => c.handle === kat || c.id === kat)?.id;
}

export function findCategoryNodeByHandle(
  nodes: CategoryTreeNode[],
  handle: string,
): CategoryTreeNode | null {
  for (const n of nodes) {
    if (n.handle === handle) return n;
    const found = findCategoryNodeByHandle(n.category_children ?? [], handle);
    if (found) return found;
  }
  return null;
}

/** ID węzła i wszystkich potomków — do `category_id[]` w Medusie (produkt w którejkolwiek). */
export function collectSubtreeCategoryIds(node: CategoryTreeNode): string[] {
  const ids: string[] = [node.id];
  for (const ch of node.category_children ?? []) {
    ids.push(...collectSubtreeCategoryIds(ch));
  }
  return ids;
}

/**
 * Dla każdej kategorii w poddrzewie listingu: id → [ten węzeł + potomkowie].
 * Sam root bez potomków w zapytaniu Medusy pomija produkty przypisane tylko do podkategorii.
 */
export function buildMedusaCategoryScopeMap(
  tree: CategoryTreeNode[],
  listingRootHandle: string,
): Record<string, string[]> {
  const root = findCategoryNodeByHandle(tree, listingRootHandle);
  if (!root) return {};

  const map: Record<string, string[]> = {};
  function visit(node: CategoryTreeNode): void {
    map[node.id] = collectSubtreeCategoryIds(node);
    for (const ch of node.category_children ?? []) {
      visit(ch);
    }
  }
  visit(root);
  return map;
}

/** Rozwiń aktywną kategorię UI do listy ID dla API Medusy. */
export function medusaCategoryIdsForScope(
  activeCategoryId: string | undefined,
  scopeMap: Record<string, string[]>,
): string[] | undefined {
  if (!activeCategoryId) return undefined;
  const ids = scopeMap[activeCategoryId];
  if (ids?.length) return ids;
  return [activeCategoryId];
}
