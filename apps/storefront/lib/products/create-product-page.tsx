import type { Metadata } from "next";
import {
  ProductPageLayout,
  getProductData,
} from "@/components/product/ProductPageLayout";
import { buildMetadata } from "@/lib/content/metadata";
import { parseProductSeoFromMetadata } from "@/lib/content/parsers";
import { getSiteSettings } from "@/lib/content";
import { SITE_URL } from "@/lib/utils";
import { canonicalProductPath, productTagValues } from "@/lib/products/product-canonical";
import { ProductPageClient } from "@/app/(shop)/sklep/gotowe-wzory/[slug]/client";

/**
 * Fabryka dla stron produktów w podkategoriach sklepu.
 * Każda strona `/sklep/<kategoria>/[slug]` różni się jedynie `basePath`,
 * `categoryLabel`/`Href` oraz ewentualnym `requiredTag`. Zamiast kopiować
 * 60 linii dla każdej kategorii, generujemy komplet (default export,
 * `generateMetadata`, `revalidate`) z jednego wywołania fabryki.
 *
 * UWAGA: celowo NIE eksportujemy `generateStaticParams`. Root layout woła
 * `headers()` (CSP nonce) — pre-render wszystkich slugów przy buildzie
 * kończy się na Vercel błędem DYNAMIC_SERVER_USAGE → 500 na PDP.
 * ISR (`revalidate`) cache'uje stronę po pierwszym żądaniu; webhook Medusy
 * invaliduje tag `medusa-products`.
 */
interface CreateProductPageOptions {
  /** Ścieżka kategorii bez końcowego slasha, np. `/sklep/gotowe-wzory`. */
  basePath: string;
  categoryLabel: string;
  categoryHref: string;
  /** Tag Medusy wymagany na produkcie (np. "gotowe-wzory"). */
  requiredTag?: string;
}

type SlugParams = Promise<{ slug: string }>;

export function createProductPage(options: CreateProductPageOptions) {
  const { basePath, categoryLabel, categoryHref, requiredTag } = options;

  async function generateMetadata({
    params,
  }: {
    params: SlugParams;
  }): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProductData(slug).catch(() => null);
    if (!product) return { title: "Produkt nie znaleziony" };

    const meta = (product.metadata ?? {}) as Record<string, unknown>;
    const seo = parseProductSeoFromMetadata(meta);
    const settings = await getSiteSettings().catch(() => null);

    // Jeden kanoniczny URL na produkt (cert→certyfikaty, logo→logo-3d, reszta→
    // gotowe-wzory) — niezależnie od ścieżki, pod którą produkt jest oglądany.
    // Eliminuje duplicate content między kategoriami.
    const canonicalPath = canonicalProductPath(slug, productTagValues(product));

    return buildMetadata({
      seo: seo ?? undefined,
      fallbackTitle: product.title ?? "Produkt",
      fallbackDescription: product.description ?? undefined,
      fallbackImage: product.thumbnail ?? `${SITE_URL}/images/logo.png`,
      siteSettings: settings,
      path: canonicalPath,
    });
  }

  async function Page({ params }: { params: SlugParams }) {
    const { slug } = await params;
    return (
      <ProductPageLayout
        slug={slug}
        basePath={basePath}
        categoryLabel={categoryLabel}
        categoryHref={categoryHref}
        requiredTag={requiredTag}
        ProductPageClient={ProductPageClient}
      />
    );
  }

  return { Page, generateMetadata };
}
