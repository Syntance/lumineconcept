import type { Metadata } from "next";
import { ProductPageLayout, getProductData } from "@/components/product/ProductPageLayout";
import { SITE_URL } from "@/lib/utils";
import { ProductPageClient } from "../../gotowe-wzory/[slug]/client";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductData(slug).catch(() => null);
  if (!product) return { title: "Produkt nie znaleziony" };

  const productUrl = `${SITE_URL}/sklep/pakiety/${slug}`;
  return {
    title: `${product.title} — pakiet | Lumine Concept`,
    description: product.description,
    alternates: { canonical: productUrl },
    openGraph: {
      title: product.title,
      description: product.description ?? "",
      images: product.thumbnail ? [{ url: product.thumbnail, width: 1200, height: 630 }] : [],
      type: "website",
      url: productUrl,
    },
  };
}

export default async function PakietyProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <ProductPageLayout
      slug={slug}
      basePath="/sklep/pakiety"
      categoryLabel="Pakiety"
      categoryHref="/sklep/pakiety"
      ProductPageClient={ProductPageClient}
    />
  );
}
