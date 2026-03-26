import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getProducts, getProductCategories } from "@/lib/medusa/products";
import { sanityClient } from "@/lib/sanity/client";
import { SITE_SETTINGS_QUERY, TESTIMONIALS_QUERY } from "@/lib/sanity/queries";
import type { SiteSettings, Testimonial } from "@/lib/sanity/types";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { SITE_URL } from "@/lib/utils";
import { ShopGridClient } from "./client";

export const metadata: Metadata = {
  title: "Gotowe wzory z plexi — cenniki, tabliczki, menu, QR | Lumine Concept",
  description:
    "Gotowe cenniki, tabliczki, menu, QR i wizytowniki z plexi. Kup online — szybka wysyłka w 48h.",
  alternates: { canonical: `${SITE_URL}/sklep/gotowe-wzory` },
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

export default async function GotoweWzoryPage({
  searchParams,
}: {
  searchParams: Promise<{ kat?: string; sort?: string }>;
}) {
  const params = await searchParams;

  const [productsResponse, categories, settings, testimonials] = await Promise.all([
    getProducts({
      limit: 12,
      offset: 0,
      order: params.sort ?? "-created_at",
    }).catch(() => null),
    getProductCategories().catch(() => []),
    sanityClient
      .fetch<SiteSettings>(SITE_SETTINGS_QUERY, {}, { next: { revalidate: 300 } })
      .catch(() => null),
    sanityClient
      .fetch<Testimonial[]>(TESTIMONIALS_QUERY, {}, { next: { revalidate: 300 } })
      .catch(() => []),
  ]);

  const products = productsResponse?.products ?? [];
  const totalCount = productsResponse?.count ?? 0;
  const trustBar = settings?.trustBar;

  const initialProducts = products.map((p) => ({
    id: p.id,
    handle: p.handle ?? "",
    title: p.title,
    thumbnail: p.thumbnail ?? null,
    price: getMinPrice(p.variants as unknown[] | null),
    hasVariantPrices: hasMultiplePrices(p.variants as unknown[] | null),
    tags: (p.tags ?? []).map((t) => (t as unknown as { value: string }).value?.toLowerCase() ?? ""),
  }));

  const displayTestimonials = testimonials.slice(0, 2);

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-50 py-14 lg:py-20">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <Breadcrumbs
            items={[
              { label: "Strona główna", href: "/" },
              { label: "Sklep", href: "/sklep" },
              { label: "Gotowe wzory" },
            ]}
          />
          <h1 className="font-display text-3xl tracking-[0.06em] text-brand-800 lg:text-4xl">
            Gotowe wzory z plexi — cenniki, tabliczki, menu, QR
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-brand-600 leading-relaxed">
            Wybierz gotowy wzór, zamów online i odbierz w ciągu 48h. Bez czekania na projekt.
          </p>
        </div>
      </section>

      {/* Product grid with infinite scroll */}
      <section className="bg-white py-10 lg:py-14">
        <div className="container mx-auto max-w-7xl px-4">
          <Suspense fallback={null}>
            <ShopGridClient
              initialProducts={initialProducts}
              totalCount={totalCount}
              initialFilter={params.kat}
              initialSort={params.sort ?? "-created_at"}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              productBasePath="/sklep/gotowe-wzory"
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

          {displayTestimonials.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
              {displayTestimonials.map((t) => (
                <blockquote key={t._id} className="rounded-xl bg-white p-6 text-left shadow-sm">
                  <p className="text-sm italic text-brand-700 leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer className="mt-3 text-xs text-brand-500">
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
