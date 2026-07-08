import type { Metadata } from "next";
import { Suspense } from "react";
import {
  buildMedusaCategoryScopeMap,
  buildListingCategoryFilters,
  categoryIdByHandle,
  categoryIdFromKatParam,
  findCategoryNodeByHandle,
  LISTING_CATEGORY_HANDLE,
  medusaCategoryIdsForScope,
  type CategoryTreeNode,
} from "@/lib/medusa/category-tree";
import { categoryListingHref } from "@/lib/medusa/shop-breadcrumbs";
import { getProducts, getProductCategories } from "@/lib/medusa/products";
import { getPageSeo, getSiteSettings } from "@/lib/content";
import { getPageSections } from "@/lib/content/sections";
import { buildMetadata } from "@/lib/content/metadata";
import { resolveTrustBarDisplay } from "@/lib/content/cms-wiring";
import { SectionRenderer } from "@/components/composer/SectionRenderer";
import { ShopListingBreadcrumbsClient } from "@/components/shop/ShopListingBreadcrumbsClient";
import { ShopListingCategoryProvider } from "@/components/shop/ShopListingCategoryContext";
import { medusaProductToSimple } from "@/lib/products/simple-product";
import { getGlobalProductConfig, EMPTY_GLOBAL_CONFIG } from "@/lib/products/global-config";
import { ShopGridClient } from "@/app/(shop)/sklep/gotowe-wzory/client";

const INITIAL_PAGE_SIZE = 12;
const LISTING_BASE_PATH = "/sklep/gotowe-wzory";

export type GotoweWzoryListingSearchParams = {
  sort?: string;
};

export async function generateGotoweWzoryListingMetadata(
  categoryHandle?: string,
): Promise<Metadata> {
  const [seo, settings, categories] = await Promise.all([
    getPageSeo("gotowe-wzory"),
    getSiteSettings(),
    getProductCategories().catch(() => []),
  ]);

  const tree = categories as unknown as CategoryTreeNode[];
  const categoryNode = categoryHandle
    ? findCategoryNodeByHandle(tree, categoryHandle)
    : null;

  const path = categoryHandle
    ? categoryListingHref(categoryHandle, LISTING_BASE_PATH)
    : LISTING_BASE_PATH;

  const fallbackTitle = categoryNode
    ? `${categoryNode.name} — gotowe wzory z plexi | Lumine Concept`
    : "Gotowe wzory z plexi — cenniki, tabliczki, menu, QR | Lumine Concept";

  const fallbackDescription = categoryNode
    ? `${categoryNode.name} z plexi dla salonów beauty. Kup online — realizacja ok. 10 dni roboczych.`
    : "Gotowe cenniki, tabliczki, menu, QR i wizytowniki z plexi. Kup online — realizacja ok. 10 dni roboczych.";

  return buildMetadata({
    seo,
    fallbackTitle,
    fallbackDescription,
    siteSettings: settings,
    path,
  });
}

export async function GotoweWzoryListingPage({
  categoryHandle,
  searchParams,
}: {
  categoryHandle?: string;
  searchParams: GotoweWzoryListingSearchParams;
}) {
  const order = searchParams.sort ?? "-created_at";

  const globalConfigPromise = getGlobalProductConfig().catch(
    () => EMPTY_GLOBAL_CONFIG,
  );

  const [allCategories, settings, tailSections] = await Promise.all([
    getProductCategories().catch(() => [] as Awaited<ReturnType<typeof getProductCategories>>),
    getSiteSettings(),
    getPageSections("gotowe-wzory"),
  ]);

  const composerTail = tailSections.filter(
    (s) => s.type === "testimonials" || s.type === "faq",
  );

  const categoryTree = allCategories as unknown as CategoryTreeNode[];
  const defaultGotoweWzoryId = categoryIdByHandle(
    categoryTree,
    LISTING_CATEGORY_HANDLE.gotoweWzory,
  );
  const resolvedKatId = categoryHandle
    ? categoryIdFromKatParam(categoryTree, categoryHandle)
    : undefined;

  const listCategoryId = categoryHandle ? resolvedKatId : defaultGotoweWzoryId;
  const activeCategoryNode = categoryHandle
    ? findCategoryNodeByHandle(categoryTree, categoryHandle)
    : null;

  const medusaCategoryScopeMap = buildMedusaCategoryScopeMap(
    categoryTree,
    LISTING_CATEGORY_HANDLE.gotoweWzory,
  );
  const categoryFilters = buildListingCategoryFilters(
    categoryTree,
    LISTING_CATEGORY_HANDLE.gotoweWzory,
  );
  const medusaListingCategoryIds = medusaCategoryIdsForScope(
    listCategoryId,
    medusaCategoryScopeMap,
  );

  const productsResponse = await getProducts({
    limit: INITIAL_PAGE_SIZE,
    offset: 0,
    order,
    category_id: medusaListingCategoryIds,
  }).catch(() => null);

  const globalConfig = await globalConfigPromise;

  const initialCategoryId = categoryHandle ? resolvedKatId : defaultGotoweWzoryId;
  const products = productsResponse?.products ?? [];
  const totalCount = productsResponse?.count ?? 0;
  const trustBar = resolveTrustBarDisplay(settings.trustBar);

  const initialProducts = products.map((p) =>
    medusaProductToSimple(p as unknown as Record<string, unknown>),
  );

  const pageTitle = activeCategoryNode?.name ?? "Gotowe wzory z plexi";
  const pageSubtitle = activeCategoryNode
    ? `Produkty z kategorii ${activeCategoryNode.name.toLowerCase()} — spersonalizuj na własne potrzeby.`
    : "Cenniki, tabliczki, oznaczenia, logo — spersonalizuj na własne potrzeby.";

  return (
    <ShopListingCategoryProvider initialCategoryId={listCategoryId}>
      <section className="bg-brand-50 pt-10 pb-14 lg:pt-12 lg:pb-20">
        <div className="container mx-auto px-4">
          <ShopListingBreadcrumbsClient
            className="mb-0"
            tree={categoryTree}
            listingRootHandle={LISTING_CATEGORY_HANDLE.gotoweWzory}
            listingBasePath={LISTING_BASE_PATH}
          />
        </div>
        <div className="container mx-auto max-w-7xl px-4 pt-10 text-center lg:pt-16">
          <h1 className="font-display text-4xl tracking-[0.06em] text-brand-800 lg:text-5xl">
            {pageTitle}
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-lg text-brand-800 leading-relaxed">
            {pageSubtitle}
          </p>
        </div>
      </section>

      <section className="bg-white py-10 lg:py-14">
        <div className="container mx-auto max-w-7xl px-4">
          <Suspense fallback={null}>
            <ShopGridClient
              initialProducts={initialProducts}
              totalCount={totalCount}
              initialFilter={initialCategoryId}
              defaultListingCategoryId={defaultGotoweWzoryId ?? ""}
              initialSort={searchParams.sort ?? "-created_at"}
              categoryFilters={categoryFilters}
              categories={allCategories.map((c) => ({ id: c.id, name: c.name }))}
              productBasePath={LISTING_BASE_PATH}
              globalColors={globalConfig.colors}
              medusaCategoryScopeMap={medusaCategoryScopeMap}
            />
          </Suspense>
        </div>
      </section>

      <section className="border-t border-brand-100 bg-brand-50 py-12 lg:py-16">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base text-brand-800">
            <span>{trustBar.followers} obserwujących</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar.realizations} realizacji</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar.shippingLabel}</span>
          </div>
        </div>
      </section>

      <div className="border-t border-brand-100 bg-brand-50">
        <SectionRenderer pageId="gotowe-wzory" sections={composerTail} />
      </div>
    </ShopListingCategoryProvider>
  );
}
