import type { Metadata } from "next";
import {
  ProductPageLayout,
  getProductData,
} from "@/components/product/ProductPageLayout";
import { getProducts } from "@/lib/medusa/products";
import { buildMetadata } from "@/lib/content/metadata";
import { parseProductSeoFromMetadata } from "@/lib/content/parsers";
import { getSiteSettings } from "@/lib/content";
import { SITE_URL } from "@/lib/utils";
import { ProductPageClient } from "@/app/(shop)/sklep/gotowe-wzory/[slug]/client";

/**
 * Fabryka dla stron produktów w podkategoriach sklepu.
 * Każda strona `/sklep/<kategoria>/[slug]` różni się jedynie `basePath`,
 * `categoryLabel`/`Href` oraz ewentualnym `requiredTag`. Zamiast kopiować
 * 60 linii dla każdej kategorii, generujemy komplet (default export,
 * `generateMetadata`, `generateStaticParams`, `revalidate`) z jednego
 * wywołania fabryki.
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

  async function generateStaticParams() {
    const response = await getProducts({ limit: 200, offset: 0 }).catch(
      () => null,
    );
    if (!response?.products) return [];
    /**
     * Prefiltrujemy po tagu, żeby nie generować tej samej statycznej strony
     * dla produktu z innej kategorii (wcześniej wszystkie `[slug]` generowały
     * params ze wszystkich produktów → cross-render + kolizje).
     */
    return response.products
      .filter((p) => {
        if (!p.handle) return false;
        if (!requiredTag) return true;
        return (
          p.tags?.some(
            (t) => t.value?.toLowerCase() === requiredTag.toLowerCase(),
          ) ?? false
        );
      })
      .map((p) => ({ slug: p.handle! }));
  }

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

    return buildMetadata({
      seo: seo ?? undefined,
      fallbackTitle: product.title ?? "Produkt",
      fallbackDescription: product.description ?? undefined,
      fallbackImage: product.thumbnail ?? `${SITE_URL}/images/logo.png`,
      siteSettings: settings,
      path: `${basePath}/${slug}`,
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

  return { Page, generateMetadata, generateStaticParams };
}
