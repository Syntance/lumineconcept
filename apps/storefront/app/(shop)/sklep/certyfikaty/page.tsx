import type { Metadata } from "next";
import { Suspense } from "react";
import {
  buildMedusaCategoryScopeMap,
  categoryIdByHandle,
  categoryIdFromKatParam,
  LISTING_CATEGORY_HANDLE,
  medusaCategoryIdsForScope,
  type CategoryTreeNode,
} from "@/lib/medusa/category-tree";
import { getProducts, getProductCategories } from "@/lib/medusa/products";
import { sanityClient, getSiteSettings } from "@/lib/sanity/client";
import { TESTIMONIALS_BY_PAGE_QUERY } from "@/lib/sanity/queries";
import type { Testimonial } from "@/lib/sanity/types";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { isPriceSort } from "@/components/product/filter-types";
import { SITE_URL } from "@/lib/utils";
import {
  medusaProductToSimple,
  type SimpleProduct,
} from "@/lib/products/simple-product";
import {
  productPassesFilters,
  type ProductFilterParams,
} from "@/lib/products/product-filters";
import { getGlobalProductConfig, EMPTY_GLOBAL_CONFIG } from "@/lib/products/global-config";
import { ShopGridClient } from "../gotowe-wzory/client";

const INITIAL_PAGE_SIZE = 24;
const MEDUSA_BATCH = 50;

const DEFAULT_CERT_PILL: ProductFilterParams = {
  sizes: [],
  materials: [],
  finishes: [],
  pill: "certyfikaty",
};

/** Jak przy kliknięciu „Certyfikaty” w filtrze: całe poddrzewo gotowe-wzory + pill (także w `/api/products`). */
async function fetchDefaultCertyfikatyListing(args: {
  categoryIds: string[] | undefined;
  sort: string;
  pageSize: number;
}): Promise<{ products: SimpleProduct[]; count: number } | null> {
  const { categoryIds, sort, pageSize } = args;
  const priceSort = isPriceSort(sort);
  const medusaOrder = priceSort ? "-created_at" : sort;
  const allSimple: SimpleProduct[] = [];
  let medusaOffset = 0;
  let totalMedusa = Infinity;

  try {
    while (medusaOffset < totalMedusa) {
      const response = await getProducts({
        limit: MEDUSA_BATCH,
        offset: medusaOffset,
        category_id: categoryIds,
        order: medusaOrder,
      });
      totalMedusa = response.count;
      for (const raw of response.products) {
        allSimple.push(medusaProductToSimple(raw as unknown as Record<string, unknown>));
      }
      medusaOffset += response.products.length;
      if (response.products.length === 0) break;
    }
  } catch {
    return null;
  }

  const collected = allSimple.filter((p) => productPassesFilters(p, DEFAULT_CERT_PILL));

  if (priceSort) {
    collected.sort((a, b) =>
      sort === "price_asc" ? a.price - b.price : b.price - a.price,
    );
  }

  return {
    products: collected.slice(0, pageSize),
    count: collected.length,
  };
}

export const metadata: Metadata = {
  title: "Certyfikaty z plexi — dyplomy, podziękowania, vouchery | Lumine Concept",
  description:
    "Eleganckie certyfikaty, dyplomy i vouchery z plexi dla salonów beauty. Kup online — szybka wysyłka.",
  alternates: { canonical: `${SITE_URL}/sklep/certyfikaty` },
};

export const revalidate = 60;

export default async function CertyfikatyPage({
  searchParams,
}: {
  searchParams: Promise<{ kat?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const order = params.sort ?? "-created_at";

  const globalConfigPromise = getGlobalProductConfig().catch(() => EMPTY_GLOBAL_CONFIG);

  const [allCategories, settings, testimonials] = await Promise.all([
    getProductCategories().catch(() => [] as Awaited<ReturnType<typeof getProductCategories>>),
    getSiteSettings(),
    sanityClient
      .fetch<Testimonial[]>(
        TESTIMONIALS_BY_PAGE_QUERY,
        { page: "gotowe-wzory" },
        { next: { revalidate: 300, tags: ["sanity"] } },
      )
      .catch(() => []),
  ]);

  const tree = allCategories as unknown as CategoryTreeNode[];
  const defaultGotoweWzoryId = categoryIdByHandle(tree, LISTING_CATEGORY_HANDLE.gotoweWzory);
  const resolvedKatId = params.kat ? categoryIdFromKatParam(tree, params.kat) : undefined;
  const listCategoryId = params.kat ? resolvedKatId : defaultGotoweWzoryId;

  const medusaCategoryScopeMap = buildMedusaCategoryScopeMap(
    tree,
    LISTING_CATEGORY_HANDLE.gotoweWzory,
  );
  const medusaListingCategoryIds = medusaCategoryIdsForScope(
    listCategoryId,
    medusaCategoryScopeMap,
  );

  const globalConfig = await globalConfigPromise;

  const initialCategoryId = params.kat ? resolvedKatId : defaultGotoweWzoryId;
  const initialPill = params.kat ? undefined : "certyfikaty";

  const categories = allCategories;

  let initialProducts: SimpleProduct[];
  let totalCount: number;

  if (!params.kat) {
    const pillListing = await fetchDefaultCertyfikatyListing({
      categoryIds: medusaListingCategoryIds,
      sort: order,
      pageSize: INITIAL_PAGE_SIZE,
    });
    initialProducts = pillListing?.products ?? [];
    totalCount = pillListing?.count ?? 0;
  } else {
    const productsResponse = await getProducts({
      limit: INITIAL_PAGE_SIZE,
      offset: 0,
      order,
      category_id: medusaListingCategoryIds,
    }).catch(() => null);
    const products = productsResponse?.products ?? [];
    totalCount = productsResponse?.count ?? 0;
    initialProducts = products.map((p) =>
      medusaProductToSimple(p as unknown as Record<string, unknown>),
    );
  }

  const trustBar = settings?.trustBar;

  const displayTestimonials = testimonials.slice(0, 2);

  return (
    <>
      <section className="bg-brand-50 pt-10 pb-14 lg:pt-12 lg:pb-20">
        <div className="container mx-auto px-4">
          <Breadcrumbs
            className="mb-0"
            items={[
              { label: "Strona główna", href: "/" },
              { label: "Sklep", href: "/sklep" },
              { label: "Certyfikaty" },
            ]}
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
              initialPill={initialPill}
              defaultListingCategoryId={defaultGotoweWzoryId ?? ""}
              initialSort={params.sort ?? "-created_at"}
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
            <span>{trustBar?.followers ?? "25 000+"} obserwujących</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.realizations ?? "6 000+"} realizacji</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.shippingLabel ?? "Realizacja ok. 10 dni roboczych"}</span>
          </div>

          {displayTestimonials.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
              {displayTestimonials.map((t) => (
                <blockquote key={t._id} className="rounded-xl bg-white p-6 text-left shadow-sm">
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
    </>
  );
}
