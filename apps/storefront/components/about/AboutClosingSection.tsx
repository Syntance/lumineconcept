import Image from "next/image";

import {
  ABOUT_CLOSING_BRAND100_BAND_HEIGHT,
  ABOUT_CLOSING_BRAND100_BAND_TOP,
  ABOUT_CLOSING_BRAND100_BAND_TRANSFORM,
  ABOUT_CLOSING_FOOTER_WHITE_BAND_HEIGHT,
  ABOUT_CLOSING_MEDIA_TOP_OFFSET,
  ABOUT_CLOSING_MOBILE_BRAND50_HEIGHT,
  ABOUT_CLOSING_MOBILE_BRAND50_TOP,
  ABOUT_CLOSING_MOBILE_BODY_LOWER,
  ABOUT_CLOSING_MOBILE_WHITE_COVER_HEIGHT,
  ABOUT_CLOSING_MOBILE_WHITE_COVER_TOP,
  ABOUT_CLOSING_MOBILE_HEADING_COLUMN,
  ABOUT_CLOSING_MOBILE_HEADING_INSET,
  ABOUT_CLOSING_MOBILE_HEADING_LOWER,
  ABOUT_CLOSING_SEPARATOR_CENTER_BOTTOM,
  ABOUT_CLOSING_SEPARATOR_LINE_BOTTOM,
  ABOUT_CLOSING_SIGNET_TOP,
  ABOUT_CLOSING_TEXT_TOP_OFFSET,
  ABOUT_INTRO_DESKTOP_BODY_EDGE,
  ABOUT_INTRO_MOBILE_BODY_WRAPPER,
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
import { ABOUT_SECTION_HEADING_CLASS, ABOUT_SECTION_MOBILE_BESIDE_IMAGE_HEADING_CLASS, ABOUT_SECTION_MOBILE_BODY_TEXT_CLASS } from "@/components/about/about-typography";
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
        "relative max-lg:bg-white bg-brand-50 pb-[150px] pt-4 sm:pb-[170px]",
        ABOUT_SECTION_SAFE,
        "max-lg:overflow-x-clip",
      )}
    >
      {/* Mobile — biały pas do połowy zdjęcia (bez kremu nad zdjęciem). */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 z-[1] hidden bg-white max-lg:block",
          ABOUT_CLOSING_MOBILE_WHITE_COVER_TOP,
          ABOUT_CLOSING_MOBILE_WHITE_COVER_HEIGHT,
        )}
      />

      {/* Mobile — brand-50 od połowy zdjęcia do ciemnego kremu. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 z-0 hidden bg-brand-50 max-lg:block",
          ABOUT_CLOSING_MOBILE_BRAND50_TOP,
          ABOUT_CLOSING_MOBILE_BRAND50_HEIGHT,
        )}
      />

      {/* Opaska brand-100 — mobile pod nagłówkiem; desktop jak wcześniej. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 z-0 bg-brand-100",
          ABOUT_CLOSING_BRAND100_BAND_TRANSFORM,
          ABOUT_CLOSING_BRAND100_BAND_TOP,
          ABOUT_CLOSING_BRAND100_BAND_HEIGHT,
        )}
      />

      {/* Desktop — sygnet na styku brand-50 / brand-100. */}
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

      {/* Biały pas nad footerem — jak desktop. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-0 bg-white",
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
        className="relative z-10 pb-16 pt-0 sm:pb-20 lg:pb-0 lg:pt-0"
        mobileStackedLayout="media-end"
        mobileBodyWrapperClassName={ABOUT_INTRO_MOBILE_BODY_WRAPPER}
        textClassName={cn(
          ABOUT_TEXT_GUTTER_RIGHT,
          ABOUT_MISSION_TEXT_TOP_OFFSET,
          ABOUT_CLOSING_TEXT_TOP_OFFSET,
          ABOUT_CLOSING_MOBILE_HEADING_COLUMN,
          "lg:flex lg:flex-col lg:items-end",
        )}
        bodyClassName={cn(
          "max-lg:w-full max-lg:text-right lg:text-right",
          ABOUT_CLOSING_MOBILE_BODY_LOWER,
          ABOUT_INTRO_DESKTOP_BODY_EDGE,
        )}
        mediaClassName={cn(
          "relative z-20 max-lg:flex max-lg:w-full max-lg:flex-col max-lg:items-end max-lg:justify-start",
          ABOUT_MEDIA_COLUMN_END,
          ABOUT_CLOSING_MEDIA_TOP_OFFSET,
        )}
        heading={
          <h2
            id="about-closing-heading"
            className={cn(
              ABOUT_SECTION_MOBILE_BESIDE_IMAGE_HEADING_CLASS,
              ABOUT_CLOSING_MOBILE_HEADING_INSET,
              ABOUT_CLOSING_MOBILE_HEADING_LOWER,
              "lg:text-right",
              ABOUT_SECTION_HEADING_CLASS,
              "lg:sr-only",
            )}
          >
            {sections.closingLabel || "Dla kogo tworzymy?"}
          </h2>
        }
        body={
          <AboutBodyText
            paragraphs={sections.closingParagraphs}
            className={ABOUT_SECTION_MOBILE_BODY_TEXT_CLASS}
          />
        }
        media={
          <AboutMediaBlock
            className="max-lg:mx-0 max-lg:items-end"
            labelPosition="above"
            image={
              <AboutArchImage
                src={sections.closingImageUrl}
                alt={sections.closingImageAlt}
                className="max-lg:mx-0 lg:max-w-none"
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
