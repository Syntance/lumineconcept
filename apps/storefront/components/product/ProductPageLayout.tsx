import { cache } from "react";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProductByHandle, getProducts } from "@/lib/medusa/products";
import { sanityClient } from "@/lib/sanity/client";
import { PRODUCT_FAQ_QUERY } from "@/lib/sanity/queries";
import type { ProductFaq } from "@/lib/sanity/types";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { TrustBadges } from "@/components/marketing/TrustBadges";
import { PayPoPromo } from "@/components/marketing/PayPoPromo";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { ProductCard } from "@/components/product/ProductCard";
import { SITE_URL } from "@/lib/utils";

export const getProductData = cache((slug: string) => getProductByHandle(slug));

function extractPrice(variant: unknown): number {
  const v = variant as Record<string, unknown> | null;
  const cp = v?.calculated_price as Record<string, unknown> | undefined;
  return Number(cp?.calculated_amount ?? 0);
}

interface ProductPageLayoutProps {
  slug: string;
  basePath: string;
  categoryLabel: string;
  categoryHref: string;
  ProductPageClient: React.ComponentType<{
    product: {
      id: string;
      title: string;
      options: Array<{ id: string; title: string; values: string[] }>;
      variants: Array<{
        id: string;
        title: string;
        options: Record<string, string>;
        price: number;
        inventory_quantity: number;
      }>;
    };
  }>;
}

export async function ProductPageLayout({
  slug,
  basePath,
  categoryLabel,
  categoryHref,
  ProductPageClient,
}: ProductPageLayoutProps) {
  const product = await getProductData(slug);
  if (!product) notFound();

  const images =
    (product.images as unknown as Array<{ id: string; url: string; alt?: string }>) ?? [];
  const variants = (product.variants ?? []) as unknown as Array<{
    id: string;
    title: string;
    options: Record<string, string>;
    calculated_price?: { calculated_amount: number };
    inventory_quantity: number;
  }>;
  const options = (product.options ?? []) as unknown as Array<{
    id: string;
    title: string;
    values: Array<{ value: string }>;
  }>;
  const metadata = (product.metadata ?? {}) as Record<string, unknown>;

  const firstVariant = variants[0];
  const price = firstVariant?.calculated_price?.calculated_amount ?? 0;

  const [faqs, crossSellProducts] = await Promise.all([
    sanityClient
      .fetch<ProductFaq[]>(PRODUCT_FAQ_QUERY, { handle: slug }, { next: { revalidate: 300 } })
      .catch(() => []),
    loadCrossSell(metadata, basePath),
  ]);

  const productUrl = `${SITE_URL}${basePath}/${slug}`;

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: images.map((img) => img.url),
    url: productUrl,
    offers: variants.map((v) => ({
      "@type": "Offer",
      price: (v.calculated_price?.calculated_amount ?? 0) / 100,
      priceCurrency: "PLN",
      availability:
        v.inventory_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Strona główna", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Sklep", item: `${SITE_URL}/sklep` },
      { "@type": "ListItem", position: 3, name: categoryLabel, item: `${SITE_URL}${categoryHref}` },
      { "@type": "ListItem", position: 4, name: product.title, item: productUrl },
    ],
  };

  const faqJsonLd =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([productJsonLd, breadcrumbJsonLd, ...(faqJsonLd ? [faqJsonLd] : [])]),
        }}
      />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Strona główna", href: "/" },
            { label: "Sklep", href: "/sklep" },
            { label: categoryLabel, href: categoryHref },
            { label: product.title },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductGallery
            images={images.map((img) => ({
              id: img.id,
              url: img.url,
              alt: img.alt ?? product.title,
            }))}
            productTitle={product.title}
          />

          <div className="space-y-6">
            <h1 className="font-display text-2xl tracking-wide text-brand-800 lg:text-3xl">
              {product.title}
            </h1>

            <PriceDisplay amount={price} size="lg" />
            <PayPoPromo price={price} />

            <Suspense fallback={null}>
              <ShippingTimer />
            </Suspense>

            <ProductPageClient
              product={{
                id: product.id,
                title: product.title,
                options: options.map((o) => ({
                  id: o.id,
                  title: o.title,
                  values: o.values.map((v) => v.value),
                })),
                variants: variants.map((v) => ({
                  id: v.id,
                  title: v.title,
                  options: v.options,
                  price: v.calculated_price?.calculated_amount ?? 0,
                  inventory_quantity: v.inventory_quantity,
                })),
              }}
            />

            <TrustBadges />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <section className="border-t border-brand-100 bg-brand-50">
        <div className="container mx-auto max-w-7xl px-4 py-10 lg:py-14">
          <ProductTabs description={product.description ?? null} metadata={metadata} />
        </div>
      </section>

      {/* Reviews placeholder */}
      <section className="border-t border-brand-100">
        <div className="container mx-auto max-w-7xl px-4 py-10 lg:py-14 text-center">
          <h2 className="font-display text-xl tracking-widest text-brand-800 mb-4">
            Opinie klientów
          </h2>
          <p className="text-brand-500 text-sm">
            Bądź pierwszą osobą, która podzieli się opinią o tym produkcie.
          </p>
        </div>
      </section>

      {/* Cross-sell */}
      {crossSellProducts.length > 0 && (
        <section className="border-t border-brand-100 bg-white">
          <div className="container mx-auto max-w-7xl px-4 py-10 lg:py-14">
            <h2 className="mb-8 text-center font-display text-xl tracking-widest text-brand-800">
              Może Ci się spodobać
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {crossSellProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  handle={p.handle ?? ""}
                  title={p.title}
                  thumbnail={p.thumbnail ?? null}
                  price={extractPrice(p.variants?.[0])}
                  href={`${basePath}/${p.handle}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="border-t border-brand-100 bg-brand-50">
          <div className="container mx-auto max-w-3xl px-4 py-10 lg:py-14">
            <h2 className="mb-8 text-center font-display text-xl tracking-widest text-brand-800">
              Często zadawane pytania
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq._id}
                  className="group rounded-xl bg-white p-5 shadow-sm"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-brand-800">
                    {faq.question}
                    <span className="ml-2 text-brand-400 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-brand-600">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function ShippingTimer() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  let label: string;
  if (day === 0 || day === 6) {
    label = "Zamów teraz — wysyłka w poniedziałek";
  } else if (hour < 14) {
    label = "Zamów do 14:00 — wysyłka dziś";
  } else if (day === 5) {
    label = "Zamów teraz — wysyłka w poniedziałek";
  } else {
    label = "Zamów teraz — wysyłka jutro";
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-4 py-2.5 text-sm text-green-800">
      <span aria-hidden="true">🚚</span>
      <span>{label}</span>
    </div>
  );
}

function ProductTabs({
  description,
  metadata,
}: {
  description: string | null;
  metadata: Record<string, unknown>;
}) {
  const spec = metadata.specyfikacja as string | undefined;
  const tabs: Array<{ title: string; content: React.ReactNode }> = [];

  if (description) {
    tabs.push({
      title: "Opis",
      content: <div className="prose prose-sm text-brand-700 max-w-none"><p>{description}</p></div>,
    });
  }

  if (spec) {
    tabs.push({
      title: "Specyfikacja",
      content: <div className="prose prose-sm text-brand-700 max-w-none"><p>{spec}</p></div>,
    });
  }

  tabs.push({
    title: "Wysyłka",
    content: (
      <div className="space-y-3 text-sm text-brand-700">
        <p>Realizacja zamówienia: <strong>1-3 dni robocze</strong></p>
        <p>Wysyłka kurierem InPost lub Paczkomaty 24/7.</p>
        <p>Darmowa wysyłka od 299 PLN.</p>
      </div>
    ),
  });

  tabs.push({
    title: "Zwroty",
    content: (
      <div className="space-y-3 text-sm text-brand-700">
        <p>Masz <strong>14 dni</strong> na zwrot produktu bez podawania przyczyny.</p>
        <p>Produkty personalizowane (na zamówienie) nie podlegają zwrotowi.</p>
      </div>
    ),
  });

  return (
    <div className="space-y-6">
      {tabs.map((tab, i) => (
        <details key={tab.title} className="group" open={i === 0}>
          <summary className="cursor-pointer border-b border-brand-200 pb-3 text-sm font-medium text-brand-500 group-open:text-brand-900 transition-colors">
            {tab.title}
          </summary>
          <div className="pt-4">{tab.content}</div>
        </details>
      ))}
    </div>
  );
}

async function loadCrossSell(metadata: Record<string, unknown>, basePath: string) {
  const handles =
    (metadata.crossSellHandles as string | undefined)
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  if (handles.length === 0) {
    const response = await getProducts({ limit: 4, offset: 0 }).catch(() => null);
    return response?.products ?? [];
  }

  const all = await Promise.all(
    handles.slice(0, 4).map((h) => getProductByHandle(h).catch(() => null)),
  );
  return all.filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getProductByHandle>>>[];
}
