"use client";

import { useMemo } from "react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { buildShopListingBreadcrumbs } from "@/lib/medusa/shop-breadcrumbs";
import type { CategoryTreeNode } from "@/lib/medusa/category-tree";
import { useShopListingCategory } from "@/components/shop/ShopListingCategoryContext";

export function ShopListingBreadcrumbsClient({
  tree,
  listingRootHandle,
  listingBasePath,
  className,
}: {
  tree: CategoryTreeNode[];
  listingRootHandle: string;
  listingBasePath: string;
  className?: string;
}) {
  const { activeCategoryId } = useShopListingCategory();

  const items = useMemo(
    () =>
      buildShopListingBreadcrumbs({
        tree,
        listingRootHandle,
        listingBasePath,
        activeCategoryId,
      }),
    [tree, listingRootHandle, listingBasePath, activeCategoryId],
  );

  return <Breadcrumbs className={className} items={items} />;
}
