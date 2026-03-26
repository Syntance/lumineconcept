import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";
import { sanityClient } from "@/lib/sanity/client";
import { INSTAGRAM_POSTS_QUERY } from "@/lib/sanity/queries";
import type { InstagramPost } from "@/lib/sanity/types";

const IG_PROFILE = "https://instagram.com/lumineconcept";

async function getInstagramPosts(): Promise<InstagramPost[]> {
  try {
    const posts = await sanityClient.fetch<InstagramPost[]>(
      INSTAGRAM_POSTS_QUERY,
      {},
      { next: { revalidate: 60 } },
    );
    return posts ?? [];
  } catch (err) {
    console.error("[FooterCTA] Nie udało się pobrać postów IG z Sanity:", err);
    return [];
  }
}

export async function FooterCTA() {
  const posts = await getInstagramPosts();
  const hasRealPosts = posts.length > 0;

  return (
    <>
      <section id="footer-cta" className="relative py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 bg-brand-800"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-brand-800/75" />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl text-white tracking-[0.08em] lg:text-4xl">
            Gotowa na branding, który wyróżni Twój salon?
          </h2>
          <div className="mt-4 mx-auto h-px w-12 bg-accent-light" />

          <div className="mt-10 flex justify-center">
            <Link
              href="/sklep"
              className="inline-flex items-center justify-center border border-white px-10 py-3.5 text-[13.2px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-brand-900"
            >
              Zobacz sklep &rarr;
            </Link>
          </div>

          <p className="mt-8 text-base text-brand-400">
            Wolisz napisać?{" "}
            <a
              href="mailto:kontakt@lumineconcept.pl"
              className="text-brand-200 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              kontakt@lumineconcept.pl
            </a>
            <span className="mx-1.5 text-brand-500">&middot;</span>
            <a
              href="https://ig.me/m/lumineconcept"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-200 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              @lumineconcept
            </a>
          </p>
        </div>
      </section>

      <section className="py-14 lg:py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl tracking-widest text-brand-800 lg:text-3xl">
            Jesteśmy na Instagramie
          </h2>
          <div className="mt-3 mx-auto h-px w-12 bg-accent" />

          <div className="mt-10 grid grid-cols-3 gap-2 max-w-xl mx-auto sm:grid-cols-6">
            {hasRealPosts
              ? posts.slice(0, 6).map((post) => (
                  <a
                    key={post._id}
                    href={post.url ?? IG_PROFILE}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={post.image?.alt ?? "Post Lumine Concept na Instagramie"}
                    className="group relative aspect-square overflow-hidden bg-brand-100"
                  >
                    <Image
                      src={post.image.asset.url}
                      alt={post.image.alt ?? ""}
                      fill
                      sizes="(max-width: 640px) 33vw, 96px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      placeholder={post.image.asset.metadata?.lqip ? "blur" : "empty"}
                      blurDataURL={post.image.asset.metadata?.lqip}
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                  </a>
                ))
              : Array.from({ length: 6 }, (_, i) => (
                  <a
                    key={i}
                    href={IG_PROFILE}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Lumine Concept na Instagramie"
                    className="aspect-square bg-brand-100 hover:bg-brand-200 transition-colors flex items-center justify-center"
                  >
                    <Instagram className="h-4 w-4 text-brand-400" />
                  </a>
                ))}
          </div>

          <a
            href={IG_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-[13.2px] font-medium uppercase tracking-[0.216em] text-brand-500 hover:text-brand-900 transition-colors"
          >
            Zobacz nasze realizacje &rarr;
          </a>
        </div>
      </section>
    </>
  );
}
