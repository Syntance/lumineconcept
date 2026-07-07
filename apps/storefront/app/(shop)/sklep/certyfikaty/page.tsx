import type { Metadata } from "next";
import { cmsAttr } from "@/lib/cms-preview/attr";
import { Suspense } from "react";
import {
  buildMedusaCategoryScopeMap,
  buildListingCategoryFilters,
  categoryIdByHandle,
  LISTING_CATEGORY_HANDLE,
  medusaCategoryIdsForScope,
  type CategoryTreeNode,
} from "@/lib/medusa/category-tree";
import { getProducts, getProductCategories } from "@/lib/medusa/products";
import { getPageContent, getPageSeo, getSiteSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/content/metadata";
import { pickTestimonials, resolveTrustBarDisplay } from "@/lib/content/cms-wiring";
import { PageFaqSection } from "@/components/content/PageFaqSection";
import { ShopListingBreadcrumbsClient } from "@/components/shop/ShopListingBreadcrumbsClient";
import { ShopListingCategoryProvider } from "@/components/shop/ShopListingCategoryContext";
import { medusaProductToSimple } from "@/lib/products/simple-product";
import { getGlobalProductConfig, EMPTY_GLOBAL_CONFIG } from "@/lib/products/global-config";
import { ShopGridClient } from "../gotowe-wzory/client";

const INITIAL_PAGE_SIZE = 12;

type PageSearchParams = Promise<{ sort?: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([
    getPageSeo("certyfikaty"),
    getSiteSettings(),
  ]);
  return buildMetadata({
    seo,
    fallbackTitle: "Certyfikaty z plexi — dyplomy, podziękowania, vouchery | Lumine Concept",
    fallbackDescription:
      "Eleganckie certyfikaty, dyplomy i vouchery z plexi dla salonów beauty. Kup online — szybka wysyłka.",
    siteSettings: settings,
    path: "/sklep/certyfikaty",
  });
}

export const revalidate = 60;

/** searchParams muszą być czytane w Suspense — inaczej Next 15/16 na Vercel zwraca 500. */
async function CertyfikatyListingWithSearchParams({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const params = await searchParams;
  const order = params.sort ?? "-created_at";

  const globalConfigPromise = getGlobalProductConfig().catch(() => EMPTY_GLOBAL_CONFIG);

  const [allCategories, settings, pageContent] = await Promise.all([
    getProductCategories().catch(() => [] as Awaited<ReturnType<typeof getProductCategories>>),
    getSiteSettings(),
    getPageContent("certyfikaty"),
  ]);

  const trustBar = resolveTrustBarDisplay(settings?.trustBar);
  const displayTestimonials = pickTestimonials(pageContent.testimonials, 2);

  const tree = allCategories as unknown as CategoryTreeNode[];
  const defaultGotoweWzoryId = categoryIdByHandle(tree, LISTING_CATEGORY_HANDLE.gotoweWzory);
  const defaultCertyfikatyId = categoryIdByHandle(tree, LISTING_CATEGORY_HANDLE.certyfikaty);
  const listCategoryId = defaultCertyfikatyId ?? defaultGotoweWzoryId;

  const medusaCategoryScopeMap = buildMedusaCategoryScopeMap(
    tree,
    LISTING_CATEGORY_HANDLE.gotoweWzory,
  );
  const categoryFilters = buildListingCategoryFilters(
    tree,
    LISTING_CATEGORY_HANDLE.gotoweWzory,
  );
  const medusaListingCategoryIds = medusaCategoryIdsForScope(
    listCategoryId,
    medusaCategoryScopeMap,
  );

  const globalConfig = await globalConfigPromise;

  const initialCategoryId = defaultCertyfikatyId ?? defaultGotoweWzoryId;
  const categories = allCategories;

  const productsResponse = await getProducts({
    limit: INITIAL_PAGE_SIZE,
    offset: 0,
    order,
    category_id: medusaListingCategoryIds,
  }).catch(() => null);

  const products = productsResponse?.products ?? [];
  const totalCount = productsResponse?.count ?? 0;
  const initialProducts = products.map((p) =>
    medusaProductToSimple(p as unknown as Record<string, unknown>),
  );

  return (
    <ShopListingCategoryProvider initialCategoryId={listCategoryId}>
      <section className="bg-brand-50 pt-10 pb-14 lg:pt-12 lg:pb-20">
        <div className="container mx-auto px-4">
          <ShopListingBreadcrumbsClient
            className="mb-0"
            tree={tree}
            listingRootHandle={LISTING_CATEGORY_HANDLE.gotoweWzory}
            listingBasePath="/sklep/gotowe-wzory"
          />
        </div>
        <div className="container mx-auto max-w-7xl px-4 pt-10 text-center lg:pt-16">
          <h1 className="font-display text-4xl tracking-[0.06em] text-brand-800 lg:text-5xl">
            Certyfikaty z plexi — dyplomy, podziękowania, vouchery
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-lg text-brand-800 leading-relaxed">
            Eleganckie certyfikaty dla Twoich klientek. Idealne jako podziękowanie po szkoleniu lub voucher prezentowy.
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
              defaultListingCategoryId={defaultCertyfikatyId ?? defaultGotoweWzoryId ?? ""}
              initialSort={params.sort ?? "-created_at"}
              categoryFilters={categoryFilters}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              productBasePath="/sklep/certyfikaty"
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

          {displayTestimonials.length > 0 && (
            <div {...(await cmsAttr("page.certyfikaty.testimonials"))} className="mt-10 grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
              {displayTestimonials.map((t) => (
                <blockquote key={t.id} className="rounded-xl bg-white p-6 text-left shadow-sm">
                  <p className="text-base italic text-brand-800 leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer className="mt-3 text-sm text-brand-500">
                    — {t.name}{t.company ? `, ${t.company}` : ""}
                  </footer>
                </blockquote>
              ))}
            </div>
          )}
        </div>
      </section>

      <div {...(await cmsAttr("page.certyfikaty.faq"))}>
        <PageFaqSection faq={pageContent.faq} />
      </div>
    </ShopListingCategoryProvider>
  );
}

export default function CertyfikatyPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  return (
    <Suspense fallback={null}>
      <CertyfikatyListingWithSearchParams searchParams={searchParams} />
    </Suspense>
  );
}
