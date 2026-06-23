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
  ABOUT_SIGNET_WIDTH_CLASS,
  ABOUT_TEXT_GUTTER_RIGHT,
  ABOUT_SECTION_SAFE,
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
    <section
      aria-labelledby="about-closing-heading"
      className={cn(
        "relative bg-brand-50 pb-[150px] pt-4 sm:pb-[170px]",
        ABOUT_SECTION_SAFE,
        "max-lg:overflow-x-clip",
      )}
    >
      {/* Desktop — opaska brand-100. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 z-0 max-lg:hidden -translate-y-1/2 bg-brand-100",
          ABOUT_CLOSING_BRAND100_BAND_TOP,
          ABOUT_CLOSING_BRAND100_BAND_HEIGHT,
        )}
      />

      {/* Desktop — sygnet. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1/2 z-[2] hidden -translate-x-1/2 -translate-y-1/2 lg:block",
          ABOUT_SIGNET_WIDTH_CLASS,
          ABOUT_CLOSING_SIGNET_TOP,
        )}
      >
        <div className={cn("relative w-full", ABOUT_SIGNET_ASPECT_CLASS)}>
          <Image
            src={ABOUT_SIGNET_IMAGE}
            alt=""
            fill
            className="object-contain object-center"
            sizes="144px"
          />
        </div>
      </div>

      {/* Mobile — sygnet na opasce. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[calc(50%-10rem)] z-[2] w-24 -translate-x-1/2 -translate-y-1/2 lg:hidden"
      >
        <div className={cn("relative w-full", ABOUT_SIGNET_ASPECT_CLASS)}>
          <Image
            src={ABOUT_SIGNET_IMAGE}
            alt=""
            fill
            className="object-contain object-center"
            sizes="96px"
          />
        </div>
      </div>

      {/* Desktop — biały pas nad footerem. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-0 max-lg:hidden bg-white",
          ABOUT_CLOSING_FOOTER_WHITE_BAND_HEIGHT,
        )}
      />

      {/* Mobile — krótka linia dekoracyjna. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-16 left-1/2 z-[1] -translate-x-1/2 lg:hidden"
      >
        <span className="block h-px w-16 bg-brand-400" />
      </div>

      {/* Desktop — separator pionowy + półkole. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 z-[1] hidden lg:block"
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
        textClassName={cn(
          ABOUT_TEXT_GUTTER_RIGHT,
          ABOUT_MISSION_TEXT_TOP_OFFSET,
          ABOUT_CLOSING_TEXT_TOP_OFFSET,
          "lg:flex lg:flex-col lg:items-end",
        )}
        bodyClassName="max-lg:text-center lg:text-right"
        mediaClassName={cn(
          "relative z-20 max-lg:flex max-lg:justify-center",
          ABOUT_MEDIA_COLUMN_END,
          ABOUT_CLOSING_MEDIA_TOP_OFFSET,
        )}
        body={
          <>
            <h2 id="about-closing-heading" className="sr-only">
              {sections.closingLabel || "Domknięcie strony"}
            </h2>
            <AboutBodyText paragraphs={sections.closingParagraphs} />
          </>
        }
        media={
          <AboutMediaBlock
            labelPosition="above"
            image={
              <AboutArchImage
                src={sections.closingImageUrl}
                alt={sections.closingImageAlt}
                className="lg:max-w-none"
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
