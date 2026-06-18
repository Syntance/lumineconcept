"use client";

import Image from "next/image";
import { Instagram } from "lucide-react";
import { TrackedOutboundLink } from "@/components/analytics/TrackedOutboundLink";

const IG_GRID_SLOTS = 6;

export type InstagramGridPost = {
  id: string;
  permalink: string;
  imageUrl: string;
  alt: string;
};

type Props = {
  posts: InstagramGridPost[];
  profileUrl: string;
};

export function InstagramGridTracked({ posts, profileUrl }: Props) {
  return (
    <>
      <div className="mt-10 mx-auto flex w-full max-w-6xl gap-2 sm:gap-3 md:gap-4">
        {Array.from({ length: IG_GRID_SLOTS }, (_, i) => {
          const post = posts[i];
          if (post) {
            return (
              <TrackedOutboundLink
                key={post.id}
                href={post.permalink}
                cta_label="Instagram post"
                aria-label="Otwórz post na Instagramie"
                className="group relative aspect-[4/5] min-w-0 flex-1 overflow-hidden bg-white outline-none ring-brand-800 transition-shadow hover:z-1 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <div className="absolute inset-0">
                  <Image
                    src={post.imageUrl}
                    alt={post.alt}
                    fill
                    sizes="(max-width: 640px) 16vw, (max-width: 1024px) 14vw, 160px"
                    className="object-contain object-center"
                    loading={i < 3 ? "eager" : "lazy"}
                    quality={90}
                  />
                </div>
              </TrackedOutboundLink>
            );
          }
          return (
            <TrackedOutboundLink
              key={`ig-placeholder-${i}`}
              href={profileUrl}
              cta_label="Instagram profil"
              aria-label="Lumine Concept na Instagramie"
              className="flex aspect-[4/5] min-w-0 flex-1 items-center justify-center bg-brand-100 transition-colors hover:bg-brand-200"
            >
              <Instagram className="h-5 w-5 text-brand-400" />
            </TrackedOutboundLink>
          );
        })}
      </div>
      <TrackedOutboundLink
        href={profileUrl}
        cta_label="Instagram realizacje"
        className="mt-6 inline-flex items-center gap-2 text-[14.2px] font-medium uppercase tracking-[0.216em] text-brand-500 hover:text-brand-900 transition-colors"
      >
        Zobacz nasze realizacje &rarr;
      </TrackedOutboundLink>
    </>
  );
}
