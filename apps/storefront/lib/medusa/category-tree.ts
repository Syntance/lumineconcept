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
