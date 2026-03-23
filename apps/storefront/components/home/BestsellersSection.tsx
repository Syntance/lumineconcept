import Link from "next/link";
import { getProductsByTag } from "@/lib/medusa/products";
import { ProductCard } from "@/components/product/ProductCard";

export async function BestsellersSection() {
  let products: Array<{
    handle: string;
    title: string;
    thumbnail: string | null;
    variants?: Array<{
      calculated_price?: { calculated_amount: number };
    }>;
  }> = [];

  try {
    products = await getProductsByTag("bestseller", 4);
  } catch {
    return null;
  }

  if (!products.length) return null;

  return (
    <section className="bg-white pt-16 pb-10 lg:pt-24 lg:pb-10">
      <div className="container mx-auto px-4">
        {/* Nagłówek */}
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl tracking-[0.1em] text-brand-900 lg:text-3xl">
            Bestsellery
          </h2>
          <div className="mt-3 mx-auto h-px w-12 bg-accent" />
        </div>

        {/* 4 produkty — jednakowa wysokość w rzędzie (stretch + pełna szerokość karty) */}
        <div className="grid grid-cols-2 items-stretch gap-4 md:grid-cols-4 md:gap-6">
          {products.slice(0, 4).map((product) => (
            <div
              key={product.handle}
              className="flex h-full min-h-0 min-w-0 flex-col self-stretch"
            >
              <ProductCard
                handle={product.handle}
                title={product.title}
                thumbnail={product.thumbnail}
                price={
                  product.variants?.[0]?.calculated_price
                    ?.calculated_amount ?? 0
                }
              />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/produkty"
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand-500 hover:text-brand-900 transition-colors"
          >
            Zobacz cały sklep &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
