import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getProductsByTag } from "@/lib/medusa/products";
import { sanityClient, getSiteSettings } from "@/lib/sanity/client";
import { TESTIMONIALS_QUERY } from "@/lib/sanity/queries";
import type { Testimonial } from "@/lib/sanity/types";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ProductCard } from "@/components/product/ProductCard";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { cn, SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sklep — cenniki, tabliczki, logo z plexi do salonu beauty | Lumine Concept",
  description:
    "Gotowe cenniki, tabliczki, logo i oznaczenia z plexi dla salonów beauty. Kup online — szybka wysyłka. 6 000+ realizacji. Sprawdź ceny.",
  alternates: { canonical: `${SITE_URL}/sklep` },
};

export const revalidate = 60;

function extractBasePrice(metadata: Record<string, unknown> | undefined | null): number | null {
  const raw = metadata?.base_price;
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractPrice(variant: unknown, metadata?: Record<string, unknown> | null): number {
  const v = variant as Record<string, unknown> | null;
  const cp = v?.calculated_price as Record<string, unknown> | undefined;
  const variantPrice = Number(cp?.calculated_amount ?? 0);
  if (variantPrice > 0) return variantPrice;
  return extractBasePrice(metadata) ?? 0;
}

const CATEGORIES = [
  {
    title: "Gotowe wzory",
    subtitle: "Kup od ręki · realizacja ok. 10 dni roboczych",
    description: "Cenniki, tabliczki, menu, kody QR — gotowe wzory do Twojego salonu.",
    cta: "PRZEGLĄDAJ WZORY",
    href: "/sklep/gotowe-wzory",
    image: "/images/categories/gotowe-wzory-personel.png",
  },
  {
    title: "Logo 3D",
    subtitle: "Plexi · LED · matowe UV",
    description: "Tablica z Twoim Logo 3D",
    cta: "Zobacz logo 3D",
    href: "/sklep/logo-3d",
    image: "/images/categories/logo-kategoria-nail-boss.png",
  },
  {
    title: "Certyfikaty",
    subtitle: "Dyplomy · podziękowania · vouchery",
    description: "Eleganckie certyfikaty z plexi dla Twoich klientek.",
    cta: "Zobacz certyfikaty",
    href: "/sklep/certyfikaty",
    image: "/images/categories/certyfikat-kategoria.png",
  },
] as const;

export default async function ShopHubPage() {
  const [bestsellers, settings, testimonials] = await Promise.all([
    getProductsByTag("bestseller", 4).catch(() => []),
    getSiteSettings(),
    sanityClient
      .fetch<Testimonial[]>(TESTIMONIALS_QUERY, {}, { next: { revalidate: 300 } })
      .catch(() => []),
  ]);

  const trustBar = settings?.trustBar;
  const displayTestimonials = testimonials.slice(0, 3);

  return (
    <>
      {/* Schema.org ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Sklep Lumine Concept",
            url: `${SITE_URL}/sklep`,
            numberOfItems: 3,
            itemListElement: CATEGORIES.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}${c.href}`,
              name: c.title,
            })),
          }),
        }}
      />

      <section className="relative overflow-x-hidden bg-brand-100">
        <div className="relative z-10 bg-white pt-10 pb-0 lg:pt-12 lg:pb-0">
          <div className="container mx-auto max-w-4xl px-4">
            <Breadcrumbs
              className="mb-0"
              items={[
                { label: "Strona główna", href: "/" },
                { label: "Sklep" },
              ]}
            />
          </div>
        </div>
        <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
          <div className="relative inline-block">
            <div
              className="pointer-events-none absolute left-1/2 top-0 z-0 h-full w-screen -translate-x-1/2 bg-[linear-gradient(to_bottom,white_0%,white_50%,var(--color-brand-100)_50%,var(--color-brand-100)_100%)]"
              aria-hidden
            />
            <h1 className="relative z-10 mt-0 font-display text-4xl tracking-widest text-brand-800 lg:text-5xl">
              Sklep
            </h1>
          </div>
          <div className="relative z-10 mt-1 mx-auto h-px w-12 bg-accent" />
        </div>
      </section>

      {/* Kategorie obok siebie */}
      <section className="bg-brand-100 pb-16 pt-10 lg:pb-24 lg:pt-14">
        <nav className="container mx-auto max-w-4xl px-4">
          <div className="grid gap-6 sm:grid-cols-3 sm:items-stretch">
            {CATEGORIES.map((cat, index) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="shop-category-card group relative flex aspect-4/5 h-full w-full flex-col overflow-hidden border border-brand-200 bg-white px-10 pb-11 pt-11 transition-colors hover:border-brand-400"
              >
                {/* Zdjęcie na pełny kafelek (object-cover); desktop: widoczne po najechaniu */}
                <div className="pointer-events-none absolute inset-0 z-0">
                  <div className="shop-category-image-wrap relative h-full w-full">
                    <Image
                      src={cat.image}
                      alt={cat.title}
                      fill
                      className={cn(
                        "object-cover",
                        index === 0
                          ? "origin-bottom -translate-x-[1%] translate-y-[3.5%] scale-[1.05] object-bottom"
                          : "object-center",
                      )}
                      sizes="(max-width: 640px) 90vw, 33vw"
                    />
                  </div>
                </div>

                {/* Układ: stały pas na tytuł + flex-1 na treść + CTA na dole — wyrównanie między kafelkami */}
                <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col">
                  {/* Title zone – slides up; blur tylko wokół wiersza tytułu */}
                  <div className="shop-category-title flex min-h-18 shrink-0 items-center justify-center transition-transform duration-700 ease-in-out group-hover:-translate-y-6">
                    <div className="inline-block max-w-[min(100%,13rem)] transition-all duration-300 group-hover:rounded-md group-hover:px-1.5 group-hover:py-0.5 group-hover:bg-white/25 group-hover:backdrop-blur-sm">
                      <h2
                        className={cn(
                          "text-center font-display text-2xl tracking-wide text-brand-800 transition-colors duration-300 lg:text-3xl",
                          index === 0 && "group-hover:text-black",
                        )}
                      >
                        {cat.title}
                      </h2>
                    </div>
                  </div>

                  <div className="h-6 shrink-0" aria-hidden="true" />

                  {/* Opis + CTA – blur przy CTA; mt-auto wyrównuje linki na dole kafelka */}
                  <div className="shop-category-body relative flex min-h-0 flex-1 flex-col items-center text-center transition-transform duration-700 ease-in-out group-hover:translate-y-6">
                    <p className="w-full max-w-[min(100%,13rem)] shrink-0 text-base leading-relaxed text-brand-400 transition-opacity duration-300 group-hover:opacity-0">
                      {cat.description}
                    </p>
                    <span className="mt-auto inline-flex w-fit max-w-full items-center justify-center gap-2 self-center whitespace-nowrap pt-4 text-sm font-medium uppercase tracking-[0.18em] text-brand-500 transition-colors group-hover:rounded-md group-hover:px-1 group-hover:py-0.5 group-hover:bg-white/25 group-hover:backdrop-blur-sm group-hover:text-brand-900">
                      {cat.cta}
                      <span aria-hidden="true" className="shrink-0">
                        &rarr;
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </nav>
      </section>

      {/* Bestsellery */}
      {bestsellers.length > 0 && (
        <section>
          <div className="bg-white pt-4 pb-0 md:pt-5">
            <div className="container mx-auto flex justify-center px-4">
              <div className="mx-auto flex w-full max-w-68 justify-center">
                <div className="relative aspect-421/396 w-[42%] min-w-15.75 max-w-30">
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
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-50 pt-3 pb-10 md:pt-4 lg:pt-4 lg:pb-10">
            <div className="container mx-auto px-4">
              <div className="text-center mb-10 lg:mb-12">
                <h2 className="font-display text-3xl tracking-widest text-brand-800 lg:text-4xl">
                  Bestsellery
                </h2>
                <div className="mt-3 mx-auto h-px w-12 bg-accent" />
              </div>

              <div className="mx-auto grid grid-cols-2 items-start gap-x-4 gap-y-6 md:grid-cols-4 md:gap-x-6 md:gap-y-8">
                {bestsellers.slice(0, 4).map((product, index) => {
                  const frameVariant =
                    index === 0
                      ? "arch-up"
                      : index === 2
                        ? "arch-down"
                        : "square";
                  const sharpCorners = index === 1 || index === 3;
                  const price = extractPrice(product.variants?.[0], product.metadata as Record<string, unknown> | undefined);
                  return (
                    <Link
                      key={product.handle ?? product.id}
                      href={`/sklep/gotowe-wzory/${product.handle}`}
                      className="group flex min-h-0 min-w-0 flex-col items-center gap-2.5 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <div className="w-full">
                        <ProductCard
                          handle={product.handle ?? ""}
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
                      <p className="text-center text-lg font-medium leading-snug text-brand-800 line-clamp-2 px-0.5">
                        {product.title}
                      </p>
                      <div className="flex w-full justify-center">
                        <PriceDisplay amount={price} listing />
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/sklep/gotowe-wzory"
                  className="text-[14.2px] font-medium uppercase tracking-[0.216em] text-brand-500 hover:text-brand-900 transition-colors"
                >
                  Zobacz cały sklep &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Custom CTA */}
      <section className="bg-white py-16 lg:py-20">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <p className="font-display text-2xl tracking-wide text-brand-800 lg:text-3xl">
            Szukasz czegoś na zamówienie?
          </p>
          <p className="mt-3 text-base text-brand-500">
            Logo z własnym projektem, cennik pod wymiar — wycena w 24h
          </p>
          <Link
            href="/logo-3d/#formularz"
            className="mt-6 inline-flex items-center justify-center rounded border border-brand-300 px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-900"
          >
            Zamów wycenę &rarr;
          </Link>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-brand-100 bg-brand-50 py-12 lg:py-16">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base text-brand-500">
            <span>{trustBar?.followers ?? "25 000+"} obserwujących</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.realizations ?? "6 000+"} realizacji</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.shippingLabel ?? "Realizacja ok. 10 dni roboczych"}</span>
          </div>

          {displayTestimonials.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
              {displayTestimonials.map((t) => (
                <blockquote key={t._id} className="text-center">
                  <p className="text-base italic leading-relaxed text-brand-600">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer className="mt-2 text-sm text-brand-400">
                    — {t.name}{t.company ? `, ${t.company}` : ""}
                  </footer>
                </blockquote>
              ))}
            </div>
          )}

          <Link
            href="/dlaczego-lumine#opinie"
            className="mt-8 inline-block text-sm font-medium uppercase tracking-[0.2em] text-brand-500 hover:text-brand-900 transition-colors"
          >
            Więcej opinii &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
