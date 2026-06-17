import Image from "next/image";

import {
  ABOUT_CLOSING_BRAND100_BAND_HEIGHT,
  ABOUT_CLOSING_BRAND100_BAND_TOP,
  ABOUT_CLOSING_FOOTER_WHITE_BAND_HEIGHT,
  ABOUT_CLOSING_MEDIA_TOP_OFFSET,
  ABOUT_CLOSING_SEPARATOR_CENTER_BOTTOM,
  ABOUT_CLOSING_SEPARATOR_LINE_BOTTOM,
  ABOUT_CLOSING_SIGNET_TOP,
  ABOUT_CLOSING_TEXT_TOP_OFFSET,
  ABOUT_MEDIA_COLUMN_END,
  ABOUT_MISSION_TEXT_TOP_OFFSET,
  ABOUT_SIGNET_ASPECT_CLASS,
  ABOUT_SIGNET_IMAGE,
  ABOUT_TEXT_GUTTER_RIGHT,
} from "@/components/about/about-media";
import { AboutBodyText } from "@/components/about/AboutBodyText";
import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutMediaBlock } from "@/components/about/AboutMediaBlock";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import { AboutSectionLabel } from "@/components/about/AboutSectionLabel";
import type { ResolvedAboutSections } from "@/lib/content/about";
import { cn } from "@/lib/utils";

type AboutClosingSectionProps = {
  sections: ResolvedAboutSections;
};

export function AboutClosingSection({ sections }: AboutClosingSectionProps) {
  return (
    <section aria-labelledby="about-closing-heading" className="relative bg-brand-50 pb-[150px] pt-4 sm:pb-[170px]">
      {/* Poziomy opasek — środek sekcji, brand-100 (#EEE8E0). */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 z-0 -translate-y-1/2 bg-brand-100",
          ABOUT_CLOSING_BRAND100_BAND_TOP,
          ABOUT_CLOSING_BRAND100_BAND_HEIGHT,
        )}
      />

      {/* Sygnet Lumine — środek na górnej krawędzi opaski brand-100 (jak Bestsellery). */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1/2 z-[2] hidden w-30 -translate-x-1/2 -translate-y-1/2 md:block",
          ABOUT_CLOSING_SIGNET_TOP,
        )}
      >
        <div className={cn("relative w-full", ABOUT_SIGNET_ASPECT_CLASS)}>
          <Image
            src={ABOUT_SIGNET_IMAGE}
            alt=""
            fill
            className="object-contain object-center"
            sizes="120px"
          />
        </div>
      </div>

      {/* Biały pas między separatorem a footerem. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-0 bg-white",
          ABOUT_CLOSING_FOOTER_WHITE_BAND_HEIGHT,
        )}
      />

      {/* Pionowy separator + półkole — środek kuli na krawędzi footera. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 z-[1] hidden md:block"
      >
        <span
          className={cn(
            "absolute left-1/2 h-[150px] w-0.5 -translate-x-1/2 bg-brand-400",
            ABOUT_CLOSING_SEPARATOR_LINE_BOTTOM,
          )}
        />
        <span
          className={cn(
            "absolute left-1/2 size-20 -translate-x-1/2 translate-y-1/2 rounded-full bg-brand-400",
            ABOUT_CLOSING_SEPARATOR_CENTER_BOTTOM,
          )}
        />
      </div>

      <AboutSectionColumns
        className="relative z-10"
        mobileMediaFirst={false}
        textClassName={cn(ABOUT_TEXT_GUTTER_RIGHT, ABOUT_MISSION_TEXT_TOP_OFFSET, ABOUT_CLOSING_TEXT_TOP_OFFSET)}
        mediaClassName={cn(
          "relative z-20",
          ABOUT_MEDIA_COLUMN_END,
          ABOUT_CLOSING_MEDIA_TOP_OFFSET,
        )}
        text={
          <>
            <h2 id="about-closing-heading" className="sr-only">
              {sections.closingLabel || "Domknięcie strony"}
            </h2>
            <AboutBodyText paragraphs={sections.closingParagraphs} className="text-right" />
          </>
        }
        media={
          <AboutMediaBlock
            labelPosition="above"
            image={
              <AboutArchImage
                src={sections.closingImageUrl}
                alt={sections.closingImageAlt}
                className="w-full max-w-none"
              />
            }
            label={
              sections.closingLabel ? (
                <AboutSectionLabel>{sections.closingLabel}</AboutSectionLabel>
              ) : undefined
            }
          />
        }
      />
    </section>
  );
}
