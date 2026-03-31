import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getProducts, getProductCategories } from "@/lib/medusa/products";
import { sanityClient } from "@/lib/sanity/client";
import { SITE_SETTINGS_QUERY } from "@/lib/sanity/queries";
import type { SiteSettings } from "@/lib/sanity/types";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { SITE_URL } from "@/lib/utils";
import { medusaProductToSimple } from "@/lib/products/simple-product";
import { ShopGridClient } from "../gotowe-wzory/client";

const INITIAL_PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "Logo 3D z plexi — gotowe wzory do Twojego salonu | Lumine Concept",
  description:
    "Gotowe logo 3D z plexi i LED. Wybierz wzór, zamów online — szybka wysyłka.",
  alternates: { canonical: `${SITE_URL}/sklep/logo-3d` },
};

export const revalidate = 60;

export default async function Logo3dListingPage({
  searchParams,
}: {
  searchParams: Promise<{ kat?: string; sort?: string }>;
}) {
  const params = await searchParams;

  const [productsResponse, categories, settings] = await Promise.all([
    getProducts({
      limit: INITIAL_PAGE_SIZE,
      offset: 0,
      order: params.sort ?? "-created_at",
    }).catch(() => null),
    getProductCategories().catch(() => []),
    sanityClient
      .fetch<SiteSettings>(SITE_SETTINGS_QUERY, {}, { next: { revalidate: 300 } })
      .catch(() => null),
  ]);

  const products = productsResponse?.products ?? [];
  const totalCount = productsResponse?.count ?? 0;
  const trustBar = settings?.trustBar;

  const initialProducts = products.map((p) =>
    medusaProductToSimple(p as unknown as Record<string, unknown>),
  );

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-50 py-14 lg:py-20">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <Breadcrumbs
            items={[
              { label: "Strona główna", href: "/" },
              { label: "Sklep", href: "/sklep" },
              { label: "Logo 3D" },
            ]}
          />
          <h1 className="font-display text-3xl tracking-[0.06em] text-brand-800 lg:text-4xl">
            Logo 3D z plexi — gotowe wzory do Twojego salonu
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-brand-600 leading-relaxed">
            Gotowe wzory logo 3D i LED. Wybierz model, zamów online — szybka realizacja.
          </p>
        </div>
      </section>

      {/* Bridge banner */}
      <section className="bg-brand-100/50 py-8">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-8 text-center shadow-sm lg:flex-row lg:justify-between lg:text-left lg:px-10">
            <div>
              <p className="font-display text-lg tracking-wide text-brand-800">
                Masz własne logo?
              </p>
              <p className="mt-1 text-sm text-brand-600">
                Zamów indywidualny projekt — logo 3D z Twoim designem, wycena w 24h.
              </p>
            </div>
            <Link
              href="/logo-3d/#formularz"
              className="shrink-0 inline-flex items-center justify-center rounded-md bg-brand-900 px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-brand-800"
            >
              Wyślij logo &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="bg-white py-10 lg:py-14">
        <div className="container mx-auto max-w-7xl px-4">
          <Suspense fallback={null}>
            <ShopGridClient
              initialProducts={initialProducts}
              totalCount={totalCount}
              initialFilter={params.kat}
              initialSort={params.sort ?? "-created_at"}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              productBasePath="/sklep/logo-3d"
            />
          </Suspense>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-brand-100 bg-brand-50 py-12 lg:py-16">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-600">
            <span>📷 {trustBar?.followers ?? "25 000+"} obserwujących</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.realizations ?? "6 000+"} realizacji</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.shippingLabel ?? "Express wysyłka"}</span>
          </div>
        </div>
      </section>
    </>
  );
}
