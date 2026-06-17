import {
  ABOUT_CLOSING_MEDIA_TOP_OFFSET,
  ABOUT_MEDIA_COLUMN_END,
  ABOUT_MISSION_TEXT_TOP_OFFSET,
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
    <section aria-labelledby="about-closing-heading" className="relative bg-brand-50 pb-20 pt-4 sm:pb-24">
      {/* Poziomy opasek — środek sekcji, brand-100 (#EEE8E0). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[calc(50%-120px)] z-0 h-[500px] -translate-y-1/2 bg-brand-100"
      />

      {/* Pionowy separator + półkole u dołu — dolna połowa kuli pod footerem. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 z-[1] hidden md:block"
      >
        <span className="absolute bottom-10 left-1/2 h-[150px] w-0.5 -translate-x-1/2 bg-brand-400" />
        <span className="absolute bottom-0 left-1/2 size-20 -translate-x-1/2 translate-y-1/2 rounded-full bg-brand-400" />
      </div>

      <AboutSectionColumns
        className="relative z-10"
        mobileMediaFirst={false}
        textClassName={cn(ABOUT_TEXT_GUTTER_RIGHT, ABOUT_MISSION_TEXT_TOP_OFFSET)}
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
