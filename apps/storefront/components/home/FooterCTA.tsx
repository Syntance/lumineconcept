import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";
import { getSiteSettings } from "@/lib/sanity/client";
import {
  homepageInstagramTilesFromSettings,
  type HomepageInstagramTile,
} from "@/lib/homepage-instagram-tiles";

const IG_PROFILE = "https://instagram.com/lumineconcept";

/** Klasy CTA zsynchronizowane z poprzednią wersją sekcji (padding + typografia przycisku). */
const SHOP_CTA_CLASS =
  "inline-flex items-center justify-start border px-10 py-3.5 text-[14.2px] font-medium uppercase tracking-[0.2em] transition-colors";

const IG_GRID_SLOTS = 6;

function InstagramGrid({
  posts,
}: {
  posts: HomepageInstagramTile[];
}) {
  return (
    <div className="mt-10 grid grid-cols-3 gap-2 max-w-xl mx-auto sm:grid-cols-6">
      {Array.from({ length: IG_GRID_SLOTS }, (_, i) => {
        const post = posts[i];
        if (post) {
          return (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Otwórz post na Instagramie"
              className="group relative aspect-square block overflow-hidden bg-brand-100 outline-none ring-brand-800 transition-[transform,box-shadow] hover:z-1 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <Image
                src={post.imageUrl}
                alt={post.alt}
                fill
                sizes="(max-width: 640px) 34vw, 120px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading={i < 3 ? "eager" : "lazy"}
              />
            </a>
          );
        }
        return (
          <a
            key={`ig-placeholder-${i}`}
            href={IG_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Lumine Concept na Instagramie"
            className="aspect-square bg-brand-100 hover:bg-brand-200 transition-colors flex items-center justify-center"
          >
            <Instagram className="h-4 w-4 text-brand-400" />
          </a>
        );
      })}
    </div>
  );
}

/**
 * Footer CTA + sekcja „Jesteśmy na Instagramie”.
 * Kafelki IG z Sanity: Ustawienia strony → Social Media → „Instagram — kafelki na stronie głównej”.
 */
export async function FooterCTA() {
  const settings = await getSiteSettings();
  const igPosts = homepageInstagramTilesFromSettings(settings);

  return (
    <>
      <section id="footer-cta" className="relative isolate overflow-hidden">
        {/* JPG ~1024px — na full width wart podmienić na ~1920px+; unoptimized = bez drugiej kompresji. */}
        <Image
          src="/images/monia-branding-cta-bg.png"
          alt=""
          fill
          className="object-cover object-[80%_center] max-lg:object-[center_top]"
          sizes="100vw"
          unoptimized
          priority={false}
        />

        {/* Grid zamiast flex-a tylko od lg: — wiersz `auto` trzyma kontakt przy dolnej krawędzi sekcji na każdej szerokości. */}
        <div className="relative z-10 grid min-h-[min(56vh,26rem)] w-full grid-rows-[1fr_auto] lg:min-h-[min(52vh,32rem)]">
          <div className="container mx-auto flex min-h-0 w-full flex-col justify-center px-4 pb-10 pt-20 text-left lg:px-8 lg:pb-12 lg:pt-28">
            <div className="w-full max-w-xl sm:max-w-2xl">
              {/* w-fit: szerokość = blok nagłówka — CTA wyśrodkowane względem tej szerokości, nie całej kolumny */}
              <div className="flex w-fit max-w-full flex-col">
                <h2 className="text-left text-balance font-binerka font-medium uppercase leading-[1.1] tracking-[0.06em] text-brand-800 text-[clamp(1.625rem,4.2vw,2.5rem)] lg:text-[40px]">
                  Gotowa na branding,
                </h2>
                <p className="mt-0 text-left text-balance font-gilroy text-[40px] font-light leading-snug tracking-[2px] text-brand-800">
                  który wyróżni Twój salon?
                </p>

                <div className="mt-10 flex w-full justify-center">
                  <Link
                    href="/sklep"
                    className={`${SHOP_CTA_CLASS} border-brand-800 bg-transparent text-brand-800 hover:bg-brand-800 hover:text-white`}
                  >
                    Zobacz sklep &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 pb-5 pt-10 text-left lg:px-8 lg:pb-8 lg:pt-16">
            <p className="text-left text-balance text-lg text-brand-600">
              Wolisz napisać?{" "}
              <a
                href="mailto:kontakt@lumineconcept.pl"
                className="wrap-break-word text-brand-800 underline-offset-2 transition-colors hover:text-brand-900 hover:underline"
              >
                kontakt@lumineconcept.pl
              </a>
              <span className="mx-1.5 text-brand-400">&middot;</span>
              <a
                href="https://ig.me/m/lumineconcept"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-800 underline-offset-2 transition-colors hover:text-brand-900 hover:underline"
              >
                @lumineconcept
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl tracking-widest text-brand-800 lg:text-4xl">
            Jesteśmy na Instagramie
          </h2>
          <div className="mt-3 mx-auto h-px w-12 bg-accent" />

          <InstagramGrid posts={igPosts} />

          <a
            href={IG_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-[14.2px] font-medium uppercase tracking-[0.216em] text-brand-500 hover:text-brand-900 transition-colors"
          >
            Zobacz nasze realizacje &rarr;
          </a>
        </div>
      </section>
    </>
  );
}
