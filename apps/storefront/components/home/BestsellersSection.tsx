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
    products = await getProductsByTag("bestseller", 6);
  } catch {
    return null;
  }

  if (!products.length) return null;

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Nagłówek */}
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl tracking-[0.1em] text-brand-900 lg:text-3xl">
            Bestsellery
          </h2>
          <div className="mt-3 mx-auto h-px w-12 bg-accent" />
        </div>

        {/* Carousel mobile / grid desktop */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible md:pb-0">
          {products.map((product) => (
            <div
              key={product.handle}
              className="shrink-0 w-[70vw] snap-start sm:w-[45vw] md:w-auto"
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

        {/* Marka z twarzą */}
        <div className="mt-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <div className="h-14 w-14 rounded-full bg-brand-200 shrink-0" />
          <p className="text-sm text-brand-600 text-center sm:text-left max-w-sm">
            <span className="font-semibold text-brand-800">
              Za Lumine stoją trzy siostry
            </span>
            {" "}— od projektu do paczki, każdy produkt przechodzi przez nasze
            ręce.
          </p>
        </div>
      </div>
    </section>
  );
}
