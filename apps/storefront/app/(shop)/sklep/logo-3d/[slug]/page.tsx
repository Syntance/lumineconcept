import type { Metadata } from "next";
import { ProductPageLayout, getProductData } from "@/components/product/ProductPageLayout";
import { getProducts } from "@/lib/medusa/products";
import { SITE_URL } from "@/lib/utils";
import { ProductPageClient } from "../../gotowe-wzory/[slug]/client";

export const revalidate = 3600;

export async function generateStaticParams() {
  const response = await getProducts({ limit: 50, offset: 0 }).catch(() => null);
  if (!response?.products) return [];
  return response.products
    .filter((p) => p.handle)
    .map((p) => ({ slug: p.handle! }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductData(slug).catch(() => null);
  if (!product) return { title: "Produkt nie znaleziony" };

  const productUrl = `${SITE_URL}/sklep/logo-3d/${slug}`;
  return {
    title: product.title,
    description: product.description,
    alternates: { canonical: productUrl },
    openGraph: {
      title: product.title,
      description: product.description ?? "",
      images: product.thumbnail
        ? [{ url: product.thumbnail, width: 1200, height: 630 }]
        : [{ url: `${SITE_URL}/images/logo.png`, width: 1200, height: 630 }],
      type: "website",
      url: productUrl,
    },
  };
}

export default async function Logo3dProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <ProductPageLayout
      slug={slug}
      basePath="/sklep/logo-3d"
      categoryLabel="Logo 3D"
      categoryHref="/sklep/logo-3d"
      ProductPageClient={ProductPageClient}
    />
  );
}
