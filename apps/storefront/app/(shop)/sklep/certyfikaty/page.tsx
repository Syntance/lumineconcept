import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts, getProductCategories } from "@/lib/medusa/products";
import { sanityClient } from "@/lib/sanity/client";
import { SITE_SETTINGS_QUERY } from "@/lib/sanity/queries";
import type { SiteSettings } from "@/lib/sanity/types";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { SITE_URL } from "@/lib/utils";
import { ShopGridClient } from "../gotowe-wzory/client";

export const metadata: Metadata = {
  title: "Certyfikaty z plexi — dyplomy, podziękowania, vouchery | Lumine Concept",
  description:
    "Eleganckie certyfikaty, dyplomy i vouchery z plexi dla salonów beauty. Kup online — szybka wysyłka.",
  alternates: { canonical: `${SITE_URL}/sklep/certyfikaty` },
};

export const revalidate = 60;

function extractPrice(variant: unknown): number {
  const v = variant as Record<string, unknown> | null;
  const cp = v?.calculated_price as Record<string, unknown> | undefined;
  return Number(cp?.calculated_amount ?? 0);
}

function getMinPrice(variants: unknown[] | null | undefined): number {
  if (!variants?.length) return 0;
  const prices = variants.map(extractPrice).filter((p) => p > 0);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

function hasMultiplePrices(variants: unknown[] | null | undefined): boolean {
  if (!variants || variants.length <= 1) return false;
  const prices = new Set(variants.map(extractPrice).filter((p) => p > 0));
  return prices.size > 1;
}

export default async function CertyfikatyPage({
  searchParams,
}: {
  searchParams: Promise<{ kat?: string; sort?: string }>;
}) {
  const params = await searchParams;

  const [productsResponse, categories, settings] = await Promise.all([
    getProducts({
      limit: 12,
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

  const initialProducts = products.map((p) => {
    const options = (p.options ?? []) as unknown as Array<{
      title: string;
      values: Array<{ value: string }>;
    }>;
    const optionsMap: Record<string, string[]> = {};
    for (const opt of options) {
      optionsMap[opt.title] = (opt.values ?? []).map((v) => v.value);
    }
    const variants = (p.variants ?? []) as unknown as Array<{ id: string }>;
    return {
      id: p.id,
      handle: p.handle ?? "",
      title: p.title,
      thumbnail: p.thumbnail ?? null,
      price: getMinPrice(p.variants as unknown[] | null),
      hasVariantPrices: hasMultiplePrices(p.variants as unknown[] | null),
      variantId: variants[0]?.id ?? null,
      tags: (p.tags ?? []).map((t) => (t as unknown as { value: string }).value?.toLowerCase() ?? ""),
      options: optionsMap,
    };
  });

  return (
    <>
      <section className="bg-brand-50 py-14 lg:py-20">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <Breadcrumbs
            items={[
              { label: "Strona główna", href: "/" },
              { label: "Sklep", href: "/sklep" },
              { label: "Certyfikaty" },
            ]}
          />
          <h1 className="font-display text-3xl tracking-[0.06em] text-brand-800 lg:text-4xl">
            Certyfikaty z plexi — dyplomy, podziękowania, vouchery
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-brand-600 leading-relaxed">
            Eleganckie certyfikaty dla Twoich klientek. Idealne jako podziękowanie po szkoleniu lub voucher prezentowy.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-medium uppercase tracking-wider text-brand-500">
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
            />
          </Suspense>
        </div>
      </section>

      <section className="border-t border-brand-100 bg-brand-50 py-12 lg:py-16">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-600">
            <span>{trustBar?.followers ?? "25 000+"} obserwujących</span>
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
