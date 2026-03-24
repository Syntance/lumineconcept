import type { Metadata } from "next";
import { getProducts, getProductCategories } from "@/lib/medusa/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { SegmentCards } from "@/components/home/SegmentCards";
import { SortSelect } from "./sort-select";

export const metadata: Metadata = {
  title: "Produkty",
  description:
    "Przeglądaj naszą kolekcję produktów z plexi dla salonów beauty. Loga 3D, stojaki, organizery, tablice cennikowe i więcej.",
};

export const revalidate = 60;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const limit = 12;
  const offset = (page - 1) * limit;

  const [productsResponse, categories] = await Promise.all([
    getProducts({
      limit,
      offset,
      category_id: params.category ? [params.category] : undefined,
      order: params.sort ?? "-created_at",
    }).catch(() => null),
    getProductCategories().catch(() => []),
  ]);

  const products = productsResponse?.products ?? [];
  const totalCount = productsResponse?.count ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs
          items={[
            { label: "Strona główna", href: "/" },
            { label: "Produkty" },
          ]}
        />
      </div>

      <SegmentCards />

      <div className="container mx-auto px-4 pb-8 pt-4 lg:pt-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <h2 className="font-display text-lg font-semibold text-brand-800 mb-4">
            Kategorie
          </h2>
          <nav aria-label="Kategorie produktów">
            <ul className="space-y-1">
              <li>
                <a
                  href="/produkty"
                  className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                    !params.category
                      ? "bg-accent/10 text-accent-dark font-medium"
                      : "text-brand-600 hover:bg-brand-50"
                  }`}
                >
                  Wszystkie
                </a>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`/produkty?category=${cat.id}`}
                    className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                      params.category === cat.id
                        ? "bg-accent/10 text-accent-dark font-medium"
                        : "text-brand-600 hover:bg-brand-50"
                    }`}
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-bold text-brand-800">
              Produkty
            </h1>
            <SortSelect defaultValue={params.sort ?? "-created_at"} />
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  handle={product.handle ?? ""}
                  title={product.title}
                  thumbnail={product.thumbnail ?? null}
                  price={
                    (product.variants?.[0] as unknown as Record<string, unknown>)
                      ?.calculated_price
                      ? Number(
                          (
                            (product.variants![0] as unknown as Record<string, unknown>)
                              .calculated_price as Record<string, unknown>
                          )?.calculated_amount ?? 0,
                        )
                      : 0
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-brand-500 py-12">
              Brak produktów w tej kategorii.
            </p>
          )}

          {totalPages > 1 && (
            <nav className="mt-8 flex justify-center gap-2" aria-label="Paginacja">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/produkty?page=${p}${params.category ? `&category=${params.category}` : ""}${params.sort ? `&sort=${params.sort}` : ""}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-md text-sm transition-colors ${
                    p === page
                      ? "bg-accent text-white"
                      : "border border-brand-200 text-brand-700 hover:bg-brand-50"
                  }`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
