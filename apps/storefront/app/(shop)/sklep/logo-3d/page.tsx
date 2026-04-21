import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getProducts, getProductCategories } from "@/lib/medusa/products";
import { getSiteSettings } from "@/lib/sanity/client";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { SITE_URL } from "@/lib/utils";
import { medusaProductToSimple } from "@/lib/products/simple-product";
import { getGlobalProductConfig, EMPTY_GLOBAL_CONFIG } from "@/lib/products/global-config";
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

  const [productsResponse, categories, settings, globalConfig] = await Promise.all([
    getProducts({
      limit: INITIAL_PAGE_SIZE,
      offset: 0,
      order: params.sort ?? "-created_at",
    }).catch(() => null),
    getProductCategories().catch(() => []),
    getSiteSettings(),
    getGlobalProductConfig().catch(() => EMPTY_GLOBAL_CONFIG),
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
      <section className="bg-brand-50 pt-10 pb-14 lg:pt-12 lg:pb-20">
        <div className="container mx-auto max-w-4xl px-4">
          <Breadcrumbs
            className="mb-0"
            items={[
              { label: "Strona główna", href: "/" },
              { label: "Sklep", href: "/sklep" },
              { label: "Logo 3D" },
            ]}
          />
        </div>
        <div className="container mx-auto max-w-7xl px-4 pt-10 text-center lg:pt-16">
          <h1 className="font-display text-4xl tracking-[0.06em] text-brand-800 lg:text-5xl">
            Logo 3D z plexi — gotowe wzory do Twojego salonu
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-lg text-brand-600 leading-relaxed">
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
              <p className="mt-1 text-base text-brand-600">
                Zamów indywidualny projekt — logo 3D z Twoim designem, wycena w 24h.
              </p>
            </div>
            <Link
              href="/logo-3d/#formularz"
              className="shrink-0 inline-flex items-center justify-center rounded-md bg-brand-900 px-6 py-2.5 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-brand-800"
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
              globalColors={globalConfig.colors}
            />
          </Suspense>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-brand-100 bg-brand-50 py-12 lg:py-16">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base text-brand-600">
            <span>📷 {trustBar?.followers ?? "25 000+"} obserwujących</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.realizations ?? "6 000+"} realizacji</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.shippingLabel ?? "Realizacja ok. 10 dni roboczych"}</span>
          </div>
        </div>
      </section>
    </>
  );
}
