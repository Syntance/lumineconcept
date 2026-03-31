import Link from "next/link";
import Image from "next/image";
import { getProductsByTag } from "@/lib/medusa/products";
import { ProductCard } from "@/components/product/ProductCard";
import { PriceDisplay } from "@/components/product/PriceDisplay";

export async function BestsellersSection() {
  let products: Awaited<ReturnType<typeof getProductsByTag>> = [];

  try {
    products = await getProductsByTag("bestseller", 4);
  } catch (err) {
    console.error("[BestsellersSection] Failed to fetch products:", err);
    return null;
  }

  if (!products.length) return null;

  return (
    <section>
      {/* Jasne tło: sygnet siedzi na dolnej krawędzi (linia = przejście do kremu — jak mockup) */}
      <div className="bg-white pt-4 pb-0 md:pt-5">
        <div className="container mx-auto flex justify-center px-4">
          {/* Szerokość ~28% szerokości bloku tytułu (max ~17rem ≈ słowo „Bestsellery” w display) */}
          <div className="mx-auto flex w-full max-w-[17rem] justify-center">
            <div className="relative aspect-[421/396] w-[42%] min-w-[3.9375rem] max-w-[7.5rem]">
              {/* Krem #EEE8E0 od połowy wysokości sygnetu w dół (pełna szerokość ekranu) */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 bottom-0 z-0 w-screen -translate-x-1/2 bg-brand-50"
                aria-hidden
              />
              <Image
                src="/images/lumine-signet-brown.png"
                alt="Sygnet Lumine Concept"
                fill
                className="relative z-10 object-contain object-center"
                sizes="120px"
                priority={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Krem #EEE8E0: odstęp do tytułu ≈ wysokość kapitalików */}
      <div className="bg-brand-50 pt-3 pb-10 md:pt-4 lg:pt-4 lg:pb-10">
        <div className="container mx-auto px-4">
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="font-display text-2xl tracking-[0.1em] text-brand-800 lg:text-3xl">
            Bestsellery
          </h2>
          <div className="mt-3 mx-auto h-px w-12 bg-accent" />
        </div>

        {/* Zdjęcie (wyższe) → nazwa → cena; cała kolumna to jeden link */}
        <div className="mx-auto grid grid-cols-2 items-start gap-x-4 gap-y-6 md:grid-cols-4 md:gap-x-6 md:gap-y-8">
          {products.slice(0, 4).map((product, index) => {
            const frameVariant =
              index === 0
                ? "arch-up"
                : index === 2
                  ? "arch-down"
                  : "square";
            const sharpCorners = index === 1 || index === 3;
            const price =
              product.variants?.[0]?.calculated_price?.calculated_amount ?? 0;
            return (
              <Link
                key={product.handle}
                href={`/sklep/gotowe-wzory/${product.handle}`}
                className="group flex min-h-0 min-w-0 flex-col items-center gap-2.5 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <div className="w-full">
                  <ProductCard
                    handle={product.handle}
                    title={product.title}
                    thumbnail={product.thumbnail ?? (product.images as unknown as Array<{ url: string }> | undefined)?.[0]?.url ?? null}
                    price={price}
                    frameVariant={frameVariant}
                    imageOnly
                    linkless
                    sharpCorners={sharpCorners}
                    imageAspectClassName="aspect-[10/11]"
                    imageAreaClassName="bg-white"
                  />
                </div>
                <p className="text-center text-base font-medium leading-snug text-brand-800 line-clamp-2 px-0.5">
                  {product.title}
                </p>
                <div className="flex w-full justify-center">
                  <PriceDisplay amount={price} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/sklep"
            className="text-[13.2px] font-medium uppercase tracking-[0.216em] text-brand-500 hover:text-brand-900 transition-colors"
          >
            Zobacz cały sklep &rarr;
          </Link>
        </div>
        </div>
      </div>
    </section>
  );
}
