import { cache, Suspense } from "react";
import { notFound } from "next/navigation";
import { getProductByHandle, getProducts } from "@/lib/medusa/products";
import { sanityClient, getSiteSettings } from "@/lib/sanity/client";
import { PRODUCT_FAQ_QUERY } from "@/lib/sanity/queries";
import type { ProductFaq, CheckoutCallout } from "@/lib/sanity/types";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductTabs } from "@/components/product/ProductTabs";
import { extractSchemaImage } from "@/lib/products/product-images";
import { SITE_URL } from "@/lib/utils";
import { formatDimensionsWxH, getProductDimensionParts } from "@/lib/products/dimensions";
import { PDP_MATERIAL_ACRYLIC } from "@/lib/product-pdp-copy";
import {
  getGlobalProductConfig,
  type GlobalConfigOption,
} from "@/lib/products/global-config";

export const getProductData = cache((slug: string) => getProductByHandle(slug));

function extractBasePrice(metadata: Record<string, unknown> | undefined | null): number | null {
  const raw = metadata?.base_price;
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Wariant z ceną > 0 nadpisuje base_price; brak ceny wariantu → base_price. */
function extractPrice(variant: unknown, metadata?: Record<string, unknown> | null): number {
  const v = variant as Record<string, unknown> | null;
  const cp = v?.calculated_price as Record<string, unknown> | undefined;
  const variantPrice = Number(cp?.calculated_amount ?? 0);
  if (variantPrice > 0) return variantPrice;
  return extractBasePrice(metadata) ?? 0;
}

interface ProductPageLayoutProps {
  slug: string;
  basePath: string;
  categoryLabel: string;
  categoryHref: string;
  /**
   * Etykieta (tag Medusy) wymagana na produkcie, żeby ta ścieżka była
   * aktywna. Zapobiega crossrenderowaniu produktów pod złymi slugami
   * (np. logo-3d pod gotowe-wzory). Brak tagu → notFound().
   */
  requiredTag?: string;
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
        /** false = produkcja na zamówienie, bez limitu ze stanu magazynowego */
        manage_inventory?: boolean;
      }>;
      metadata?: Record<string, unknown>;
      images?: Array<{ id: string; url: string; alt?: string }>;
    };
    checkoutCallout?: CheckoutCallout | null;
    globalColors?: GlobalConfigOption[];
    schemaImageUrl?: string | null;
    /** PDP certyfikatów — opcja dopłaty za podstawkę w kolorze certyfikatu */
    certificateStandAvailable?: boolean;
  }>;
}

export async function ProductPageLayout({
  slug,
  basePath,
  categoryLabel,
  categoryHref,
  requiredTag,
  ProductPageClient,
}: ProductPageLayoutProps) {
  /**
   * Nie łapiemy tu błędów z Medusy — niech propagują do `error.tsx`.
   * W przeciwnym razie timeout Railway → `catch(() => null)` → `notFound()`
   * wyglądało jak stały 404 przez cały czas życia cache'a.
   * Sanity i globalny config są opcjonalne → fallback OK.
   */
  const [product, siteSettings, productConfig] = await Promise.all([
    getProductData(slug),
    getSiteSettings(),
    getGlobalProductConfig().catch(() => ({
      colors: [] as GlobalConfigOption[],
      sizes: [],
      materials: [],
      led: [],
      finishes: [],
    })),
  ]);
  if (!product) notFound();

  if (requiredTag) {
    const normalised = requiredTag.toLowerCase();
    const hasTag =
      (product.tags as Array<{ value?: string }> | undefined)?.some(
        (t) => t.value?.toLowerCase() === normalised,
      ) ?? false;
    if (!hasTag) notFound();
  }

  const { galleryImages: images, schemaImageUrl } = extractSchemaImage({
    title: product.title,
    images: product.images,
    thumbnail: product.thumbnail as string | null | undefined,
    metadata: (product.metadata ?? null) as Record<string, unknown> | null,
  });
  const variants = (product.variants ?? []) as unknown as Array<{
    id: string;
    title: string;
    options: Record<string, string>;
    calculated_price?: { calculated_amount: number };
    inventory_quantity: number;
    manage_inventory?: boolean;
    metadata?: Record<string, unknown>;
  }>;
  const options = (product.options ?? []) as unknown as Array<{
    id: string;
    title: string;
    values: Array<{ value: string }>;
  }>;
  const metadata = (product.metadata ?? {}) as Record<string, unknown>;
  const firstVariant = variants[0];
  const dimensionParts = getProductDimensionParts(
    metadata,
    firstVariant?.metadata ?? null,
  );
  const dimensionsWxHLine = formatDimensionsWxH(dimensionParts.width, dimensionParts.height);
  const firstVariantPrice = firstVariant?.calculated_price?.calculated_amount ?? 0;
  const price = firstVariantPrice > 0 ? firstVariantPrice : (extractBasePrice(metadata) ?? 0);

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
      // Medusa v2: `calculated_amount` i `metadata.base_price` to już
      // dziesiętne w PLN — JSON-LD oczekuje tego samego formatu.
      price:
        (v.calculated_price?.calculated_amount ?? 0) > 0
          ? (v.calculated_price?.calculated_amount ?? 0)
          : (extractBasePrice(metadata) ?? 0),
      priceCurrency: "PLN",
      availability:
        v.manage_inventory === false || v.inventory_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([productJsonLd]),
        }}
      />

      <div className="container mx-auto max-w-4xl px-4 pt-10 pb-5 lg:pt-12 lg:pb-6">
        <Breadcrumbs
          className="mb-0"
          items={[
            { label: "Strona główna", href: "/" },
            { label: categoryLabel, href: categoryHref },
            { label: product.title },
          ]}
        />
      </div>

      <div className="bg-brand-50">
        <div className="mx-auto max-w-[min(102rem,calc(100vw-2rem))] px-4 py-6 lg:px-8 lg:py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-10">
          <div className="min-w-0 pb-[8px]">
            <div className="lg:sticky lg:z-10 lg:top-[calc(var(--header-sticky-height)+var(--product-gallery-sticky-gap)+env(safe-area-inset-top,0px))]">
              <ProductGallery
                images={images.map((img) => ({
                  id: img.id,
                  url: img.url,
                  alt: img.alt ?? product.title,
                }))}
                productTitle={product.title}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-2xl font-normal uppercase tracking-wider text-brand-800 sm:text-3xl lg:text-4xl lg:leading-tight">
              {product.title}
            </h1>

            {(dimensionParts.width ||
              dimensionParts.height ||
              dimensionParts.dimensionsFallback ||
              dimensionParts.thickness) && (
              <div className="space-y-3 text-base leading-snug text-brand-700">
                {(dimensionParts.width ||
                  dimensionParts.height ||
                  dimensionParts.dimensionsFallback) && (
                  <div className="leading-snug text-brand-700">
                    <span className="font-bold text-brand-800">Wymiary:</span>{" "}
                    {dimensionParts.dimensionsFallback &&
                    !dimensionParts.width &&
                    !dimensionParts.height
                      ? dimensionParts.dimensionsFallback
                      : dimensionsWxHLine}
                  </div>
                )}
                {dimensionParts.thickness && (
                  <div>
                    <span className="font-bold">Materiał:</span> {PDP_MATERIAL_ACRYLIC}{" "}
                    {dimensionParts.thickness} grubości
                  </div>
                )}
              </div>
            )}

            <PriceDisplay amount={price} variant="badge" />
            {basePath === "/sklep/certyfikaty" && (
              <p className="text-sm text-brand-700">
                Opcjonalna podstawka w kolorze certyfikatu: +10 zł / szt. (zaznacz przy zamówieniu).
              </p>
            )}

            <div className="flex items-center gap-4 pt-2 pb-4">
              <span className="h-px flex-1 bg-brand-300" />
              <span className="whitespace-nowrap text-base font-bold uppercase tracking-[0.2em] text-brand-700">
                Skonfiguruj swój produkt
              </span>
              <span className="h-px flex-1 bg-brand-300" />
            </div>

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
                  manage_inventory: v.manage_inventory,
                })),
                metadata,
                images: images.map((img) => ({
                  id: img.id,
                  url: img.url,
                  alt: img.alt,
                })),
              }}
              checkoutCallout={siteSettings?.checkoutCallout ?? null}
              globalColors={productConfig.colors}
              schemaImageUrl={schemaImageUrl}
              certificateStandAvailable={basePath === "/sklep/certyfikaty"}
            />
          </div>
        </div>
        </div>
      </div>

      {/* Tabs */}
      <section className="border-t border-brand-100 bg-brand-50">
        <div className="container mx-auto max-w-[min(102rem,calc(100vw-2rem))] px-4 py-10 lg:py-14">
          <ProductTabs description={product.description ?? null} metadata={metadata} />
        </div>
      </section>

      {/* Cross-sell — streamed via Suspense (nie blokuje galerii / konfiguratora) */}
      <Suspense fallback={<CrossSellSkeleton />}>
        <CrossSellSection metadata={metadata} basePath={basePath} globalColors={productConfig.colors} />
      </Suspense>

      {/* FAQ — streamed via Suspense */}
      <Suspense fallback={null}>
        <FaqSection slug={slug} />
      </Suspense>
    </div>
  );
}

/* ── Async streamed: Cross-sell ─────────────────────────────────── */

async function CrossSellSection({
  metadata,
  basePath,
  globalColors,
}: {
  metadata: Record<string, unknown>;
  basePath: string;
  globalColors: GlobalConfigOption[];
}) {
  const crossSellProducts = await loadCrossSell(metadata, basePath);
  if (crossSellProducts.length === 0) return null;

  return (
    <section className="border-t border-brand-100 bg-white">
      <div className="container mx-auto max-w-[min(102rem,calc(100vw-2rem))] px-4 py-10 lg:py-14">
        <h2 className="mb-8 text-center font-display text-2xl tracking-widest text-brand-800 lg:text-3xl">
          Może Ci się spodobać
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {crossSellProducts.map((p) => {
            const fv = (p.variants as unknown as
              | Array<{ id: string; metadata?: Record<string, unknown> }>
              | undefined)?.[0];
            return (
              <ProductCard
                key={p.id}
                handle={p.handle ?? ""}
                title={p.title}
                thumbnail={p.thumbnail ?? null}
                price={extractPrice(p.variants?.[0], p.metadata as Record<string, unknown> | undefined)}
                href={`${basePath}/${p.handle}`}
                variantId={fv?.id}
                productId={p.id}
                productMetadata={
                  (p.metadata ?? undefined) as Record<string, unknown> | undefined
                }
                variantMetadata={fv?.metadata}
                globalColors={globalColors}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CrossSellSkeleton() {
  return (
    <section className="border-t border-brand-100 bg-white animate-pulse">
      <div className="container mx-auto max-w-[min(102rem,calc(100vw-2rem))] px-4 py-10 lg:py-14">
        <div className="mx-auto mb-8 h-8 w-56 rounded bg-brand-200" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square rounded-lg bg-brand-100" />
              <div className="h-4 w-3/4 rounded bg-brand-200" />
              <div className="h-4 w-1/3 rounded bg-brand-200" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Async streamed: FAQ ────────────────────────────────────────── */

async function FaqSection({ slug }: { slug: string }) {
  const faqs = await sanityClient
    .fetch<ProductFaq[]>(PRODUCT_FAQ_QUERY, { handle: slug }, { next: { revalidate: 300 } })
    .catch(() => []);

  if (faqs.length === 0) return null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }),
        }}
      />
      <section className="border-t border-brand-100 bg-brand-50">
        <div className="container mx-auto max-w-3xl px-4 py-10 lg:py-14">
          <h2 className="mb-8 text-center font-display text-2xl tracking-widest text-brand-800 lg:text-3xl">
            Często zadawane pytania
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq._id}
                className="group rounded-xl bg-white p-5 shadow-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between text-base font-medium text-brand-800">
                  {faq.question}
                  <span className="ml-2 text-brand-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-base leading-relaxed text-brand-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Helper ─────────────────────────────────────────────────────── */

async function loadCrossSell(metadata: Record<string, unknown>, _basePath: string) {
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
