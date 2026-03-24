import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductByHandle } from "@/lib/medusa/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductVariantSelector } from "@/components/product/ProductVariantSelector";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { PayPoPromo } from "@/components/marketing/PayPoPromo";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { TrustBadges } from "@/components/marketing/TrustBadges";
import { SITE_URL } from "@/lib/utils";
import { ProductPageClient } from "./client";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductByHandle(slug).catch(() => null);
  if (!product) return { title: "Produkt nie znaleziony" };

  const productUrl = `${SITE_URL}/produkty/${slug}`;

  return {
    title: product.title,
    description: product.description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: product.title,
      description: product.description ?? "",
      images: product.thumbnail ? [{ url: product.thumbnail, width: 1200, height: 630 }] : [],
      type: "website",
      url: productUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description ?? "",
      ...(product.thumbnail ? { images: [product.thumbnail] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductByHandle(slug);

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

  const firstVariant = variants[0];
  const price = firstVariant?.calculated_price?.calculated_amount ?? 0;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: images.map((img) => img.url),
    url: `${SITE_URL}/produkty/${slug}`,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Strona główna", href: "/" },
            { label: "Produkty", href: "/produkty" },
            { label: product.title },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <ProductGallery
            images={images.map((img) => ({
              id: img.id,
              url: img.url,
              alt: img.alt ?? product.title,
            }))}
            productTitle={product.title}
          />

          <div className="space-y-6">
            <h1 className="font-display text-2xl font-bold text-brand-800 lg:text-3xl">
              {product.title}
            </h1>

            <PriceDisplay amount={price} size="lg" />

            <PayPoPromo price={price} />

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

            {product.description && (
              <div className="border-t border-brand-100 pt-6">
                <h2 className="text-sm font-semibold text-brand-800 mb-2">
                  Opis produktu
                </h2>
                <div className="prose prose-sm text-brand-700">
                  <p>{product.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TrustBadges />
    </>
  );
}
