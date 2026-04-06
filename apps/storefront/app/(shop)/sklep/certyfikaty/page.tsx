import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts, getProductCategories } from "@/lib/medusa/products";
import { sanityClient } from "@/lib/sanity/client";
import { SITE_SETTINGS_QUERY } from "@/lib/sanity/queries";
import type { SiteSettings } from "@/lib/sanity/types";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { SITE_URL } from "@/lib/utils";
import { medusaProductToSimple } from "@/lib/products/simple-product";
import { getGlobalProductConfig } from "@/lib/products/global-config";
import { ShopGridClient } from "../gotowe-wzory/client";

const INITIAL_PAGE_SIZE = 24;

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

  const [productsResponse, categories, settings, globalConfig] = await Promise.all([
    getProducts({
      limit: INITIAL_PAGE_SIZE,
      offset: 0,
      order: params.sort ?? "-created_at",
    }).catch(() => null),
    getProductCategories().catch(() => []),
    sanityClient
      .fetch<SiteSettings>(SITE_SETTINGS_QUERY, {}, { next: { revalidate: 300 } })
      .catch(() => null),
    getGlobalProductConfig().catch(() => ({
      colors: [] as any[],
      sizes: [],
      materials: [],
      led: [],
      finishes: [],
    })),
  ]);

  const products = productsResponse?.products ?? [];
  const totalCount = productsResponse?.count ?? 0;
  const trustBar = settings?.trustBar;

  const initialProducts = products.map((p) =>
    medusaProductToSimple(p as unknown as Record<string, unknown>),
  );

  return (
    <>
      <section className="bg-brand-50 pt-10 pb-14 lg:pt-12 lg:pb-20">
        <div className="container mx-auto max-w-4xl px-4">
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
          <p className="mt-4 mx-auto max-w-2xl text-lg text-brand-600 leading-relaxed">
            Eleganckie certyfikaty dla Twoich klientek. Idealne jako podziękowanie po szkoleniu lub voucher prezentowy.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-medium uppercase tracking-wider text-brand-500">
            <span className="rounded-full border border-brand-200 px-4 py-1.5">Szybka wysyłka</span>
            <span className="rounded-full border border-brand-200 px-4 py-1.5">Płatność online</span>
            <span className="rounded-full border border-brand-200 px-4 py-1.5">
              {trustBar?.realizations ?? "6 000+"} realizacji
            </span>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 lg:py-14">
        <div className="container mx-auto max-w-7xl px-4">
          <Suspense fallback={null}>
            <ShopGridClient
              initialProducts={initialProducts}
              totalCount={totalCount}
              initialFilter={params.kat}
              initialSort={params.sort ?? "-created_at"}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              productBasePath="/sklep/certyfikaty"
              globalColors={globalConfig.colors}
            />
          </Suspense>
        </div>
      </section>

      <section className="border-t border-brand-100 bg-brand-50 py-12 lg:py-16">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base text-brand-600">
            <span>{trustBar?.followers ?? "25 000+"} obserwujących</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.realizations ?? "6 000+"} realizacji</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.shippingLabel ?? "Realizacja ok. 10 dni rob."}</span>
          </div>
        </div>
      </section>
    </>
  );
}
