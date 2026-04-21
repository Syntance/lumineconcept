import type { Metadata } from "next";
import { Fragment, Suspense } from "react";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { getProducts, getProductCategories } from "@/lib/medusa/products";
import { sanityClient, getSiteSettings } from "@/lib/sanity/client";
import { TESTIMONIALS_QUERY } from "@/lib/sanity/queries";
import type { SiteSettings, Testimonial } from "@/lib/sanity/types";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { SITE_URL } from "@/lib/utils";
import { medusaProductToSimple } from "@/lib/products/simple-product";
import { getGlobalProductConfig, EMPTY_GLOBAL_CONFIG } from "@/lib/products/global-config";
import { ShopGridClient } from "./client";

const INITIAL_PAGE_SIZE = 24;

const PURCHASE_STEPS: readonly { label: string; Icon?: LucideIcon }[] = [
  { label: "Personalizacja", Icon: Sparkles },
  { label: "💳 Płatność" },
  { label: "📐 Przygotowujemy projekt" },
  { label: "✅ Twoja akceptacja" },
  { label: "📦 Realizacja i wysyłka" },
];

export const metadata: Metadata = {
  title: "Gotowe wzory z plexi — cenniki, tabliczki, menu, QR | Lumine Concept",
  description:
    "Gotowe cenniki, tabliczki, menu, QR i wizytowniki z plexi. Kup online — realizacja ok. 10 dni roboczych.",
  alternates: { canonical: `${SITE_URL}/sklep/gotowe-wzory` },
};

export const revalidate = 60;

export default async function GotoweWzoryPage({
  searchParams,
}: {
  searchParams: Promise<{ kat?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const order = params.sort ?? "-created_at";

  let allCategories: Awaited<ReturnType<typeof getProductCategories>>;
  let settings: SiteSettings | null;
  let testimonials: Testimonial[];
  let productsResponse: Awaited<ReturnType<typeof getProducts>> | null;

  const globalConfigPromise = getGlobalProductConfig().catch(
    () => EMPTY_GLOBAL_CONFIG,
  );

  if (params.kat) {
    [allCategories, settings, testimonials] = await Promise.all([
      getProductCategories().catch(() => [] as Awaited<ReturnType<typeof getProductCategories>>),
      getSiteSettings(),
      sanityClient
        .fetch<Testimonial[]>(TESTIMONIALS_QUERY, {}, { next: { revalidate: 300 } })
        .catch(() => []),
    ]);

    const initialCategoryId = allCategories.find(
      (c) => c.handle === params.kat || c.id === params.kat,
    )?.id;

    productsResponse = await getProducts({
      limit: INITIAL_PAGE_SIZE,
      offset: 0,
      category_id: initialCategoryId ? [initialCategoryId] : undefined,
      order,
    }).catch(() => null);
  } else {
    const results = await Promise.all([
      getProductCategories().catch(() => [] as Awaited<ReturnType<typeof getProductCategories>>),
      getSiteSettings(),
      sanityClient
        .fetch<Testimonial[]>(TESTIMONIALS_QUERY, {}, { next: { revalidate: 300 } })
        .catch(() => []),
      getProducts({ limit: INITIAL_PAGE_SIZE, offset: 0, order }).catch(() => null),
    ]);
    allCategories = results[0];
    settings = results[1];
    testimonials = results[2];
    productsResponse = results[3];
  }

  const globalConfig = await globalConfigPromise;

  const initialCategoryId = params.kat
    ? allCategories.find(
        (c) => c.handle === params.kat || c.id === params.kat,
      )?.id
    : undefined;

  const categories = allCategories;

  const products = productsResponse?.products ?? [];
  const totalCount = productsResponse?.count ?? 0;
  const trustBar = settings?.trustBar;

  const initialProducts = products.map((p) =>
    medusaProductToSimple(p as unknown as Record<string, unknown>),
  );

  const displayTestimonials = testimonials.slice(0, 2);

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
              { label: "Gotowe wzory" },
            ]}
          />
        </div>
        <div className="container mx-auto max-w-7xl px-4 pt-10 text-center lg:pt-16">
          <h1 className="font-display text-4xl tracking-[0.06em] text-brand-800 lg:text-5xl">
            Gotowe wzory z plexi
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-lg text-brand-600 leading-relaxed">
            Cenniki, tabliczki, oznaczenia, logo — spersonalizuj na własne potrzeby.
          </p>
          <nav
            aria-label="Etapy zakupu"
            className="mt-8 flex flex-wrap items-center justify-center gap-x-1 gap-y-3 text-sm font-medium leading-snug text-brand-700 sm:text-base"
          >
            {PURCHASE_STEPS.map((step, i) => {
              const StepIcon = step.Icon;
              return (
                <Fragment key={step.label}>
                  {i > 0 && (
                    <span className="mx-1.5 text-brand-400 lg:mx-2" aria-hidden>
                      →
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    {StepIcon && (
                      <StepIcon
                        className="h-4 w-4 shrink-0 text-accent"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    )}
                    {step.label}
                  </span>
                </Fragment>
              );
            })}
          </nav>
        </div>
      </section>

      {/* Product grid with infinite scroll */}
      <section className="bg-white py-10 lg:py-14">
        <div className="container mx-auto max-w-7xl px-4">
          <Suspense fallback={null}>
            <ShopGridClient
              initialProducts={initialProducts}
              totalCount={totalCount}
              initialFilter={initialCategoryId}
              initialSort={params.sort ?? "-created_at"}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              productBasePath="/sklep/gotowe-wzory"
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

          {displayTestimonials.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
              {displayTestimonials.map((t) => (
                <blockquote key={t._id} className="rounded-xl bg-white p-6 text-left shadow-sm">
                  <p className="text-base italic text-brand-700 leading-relaxed">
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
