import {
  categoryIdByHandle,
  collectSubtreeCategoryIds,
  findCategoryNodeByHandle,
  LISTING_CATEGORY_HANDLE,
  type CategoryTreeNode,
} from "@/lib/medusa/category-tree";

export type ShopBreadcrumbItem = {
  label: string;
  href?: string;
};

const HOME: ShopBreadcrumbItem = { label: "Strona główna", href: "/" };
const SHOP: ShopBreadcrumbItem = { label: "Sklep", href: "/sklep" };

/** URL listingu dla kategorii — dedykowane trasy (certyfikaty) lub `?kat=` na gotowe-wzory. */
export function categoryListingHref(
  handle: string,
  listingBasePath: string,
): string {
  if (handle === LISTING_CATEGORY_HANDLE.certyfikaty) return "/sklep/certyfikaty";
  if (handle === LISTING_CATEGORY_HANDLE.gotoweWzory) return "/sklep/gotowe-wzory";
  if (handle === LISTING_CATEGORY_HANDLE.logo3d) return "/sklep/logo-3d";
  return `${listingBasePath}?kat=${encodeURIComponent(handle)}`;
}

/** Łańcuch od dziecka roota listingu do węzła (bez roota). */
function categoryChainFromListingRoot(
  tree: CategoryTreeNode[],
  listingRootHandle: string,
  targetId: string,
): CategoryTreeNode[] {
  const root = findCategoryNodeByHandle(tree, listingRootHandle);
  if (!root || root.id === targetId) return [];

  const chain: CategoryTreeNode[] = [];

  function visit(node: CategoryTreeNode, acc: CategoryTreeNode[]): boolean {
    const path = [...acc, node];
    if (node.id === targetId) {
      chain.push(...path);
      return true;
    }
    for (const child of node.category_children ?? []) {
      if (visit(child, path)) return true;
    }
    return false;
  }

  for (const child of root.category_children ?? []) {
    if (visit(child, [])) break;
  }

  return chain;
}

function buildListingCategoryTrail(
  tree: CategoryTreeNode[],
  listingRootHandle: string,
  listingBasePath: string,
  activeCategoryId?: string,
): ShopBreadcrumbItem[] {
  const root = findCategoryNodeByHandle(tree, listingRootHandle);
  if (!root) return [];

  const chain =
    activeCategoryId && activeCategoryId !== root.id
      ? categoryChainFromListingRoot(tree, listingRootHandle, activeCategoryId)
      : [];

  if (chain.length === 0) {
    return [{ label: root.name }];
  }

  const items: ShopBreadcrumbItem[] = [];

  for (let i = 0; i < chain.length; i++) {
    const node = chain[i];
    if (!node) continue;
    const isLast = i === chain.length - 1;
    items.push(
      isLast
        ? { label: node.name }
        : {
            label: node.name,
            href: categoryListingHref(node.handle, listingBasePath),
          },
    );
  }

  return items;
}

/** Breadcrumbs listingu sklepu (np. `/sklep/gotowe-wzory`, `/sklep/certyfikaty`). */
export function buildShopListingBreadcrumbs(options: {
  tree: CategoryTreeNode[];
  listingRootHandle: string;
  listingBasePath: string;
  activeCategoryId?: string;
}): ShopBreadcrumbItem[] {
  const trail = buildListingCategoryTrail(
    options.tree,
    options.listingRootHandle,
    options.listingBasePath,
    options.activeCategoryId,
  );

  return [HOME, SHOP, ...trail];
}

function resolveProductCategoryId(
  tree: CategoryTreeNode[],
  listingRootHandle: string,
  productCategories: Array<{ id?: string; handle?: string; name?: string }>,
  sectionHandle?: string,
): string | undefined {
  const root = findCategoryNodeByHandle(tree, listingRootHandle);
  if (!root) return sectionHandle ? categoryIdByHandle(tree, sectionHandle) : undefined;

  const subtreeIds = new Set(collectSubtreeCategoryIds(root));
  let bestId: string | undefined;
  let bestDepth = -1;

  for (const category of productCategories) {
    const resolvedId =
      category.id ??
      (category.handle ? categoryIdByHandle(tree, category.handle) : undefined);
    if (!resolvedId || !subtreeIds.has(resolvedId)) continue;
    const depth = categoryChainFromListingRoot(
      tree,
      listingRootHandle,
      resolvedId,
    ).length;
    if (depth > bestDepth) {
      bestDepth = depth;
      bestId = resolvedId;
    }
  }

  if (bestId) return bestId;
  if (sectionHandle) return categoryIdByHandle(tree, sectionHandle);
  return root.id;
}

/** Breadcrumbs PDP — pełna ścieżka kategorii + tytuł produktu. */
export function buildShopProductBreadcrumbs(options: {
  productTitle: string;
  tree: CategoryTreeNode[];
  listingRootHandle: string;
  listingBasePath: string;
  productCategories: Array<{ id?: string; handle?: string; name?: string }>;
  sectionHandle?: string;
}): ShopBreadcrumbItem[] {
  const root = findCategoryNodeByHandle(options.tree, options.listingRootHandle);
  if (!root) {
    return [HOME, SHOP, { label: options.productTitle }];
  }

  const categoryId = resolveProductCategoryId(
    options.tree,
    options.listingRootHandle,
    options.productCategories,
    options.sectionHandle,
  );

  const chain =
    categoryId && categoryId !== root.id
      ? categoryChainFromListingRoot(
          options.tree,
          options.listingRootHandle,
          categoryId,
        )
      : [];

  const items: ShopBreadcrumbItem[] = [HOME, SHOP];

  if (chain.length === 0) {
    items.push({ label: root.name, href: options.listingBasePath });
  } else {
    for (const node of chain) {
      items.push({
        label: node.name,
        href: categoryListingHref(node.handle, options.listingBasePath),
      });
    }
  }

  items.push({ label: options.productTitle });
  return items;
}

/** Kontekst breadcrumbs z `basePath` produktu. */
export function productBreadcrumbContextFromBasePath(basePath: string): {
  listingRootHandle: string;
  listingBasePath: string;
  sectionHandle?: string;
} {
  if (basePath === "/sklep/certyfikaty") {
    return {
      listingRootHandle: LISTING_CATEGORY_HANDLE.gotoweWzory,
      listingBasePath: "/sklep/gotowe-wzory",
      sectionHandle: LISTING_CATEGORY_HANDLE.certyfikaty,
    };
  }

  if (basePath === "/sklep/logo-3d") {
    return {
      listingRootHandle: LISTING_CATEGORY_HANDLE.logo3d,
      listingBasePath: "/sklep/logo-3d",
    };
  }

  return {
    listingRootHandle: LISTING_CATEGORY_HANDLE.gotoweWzory,
    listingBasePath: "/sklep/gotowe-wzory",
  };
}
