import {
  ABOUT_MEDIA_GUTTER_RIGHT,
  ABOUT_MEDIA_WIDTH_CLASS,
  ABOUT_MISSION_TEXT_TOP_OFFSET,
  ABOUT_TEXT_GUTTER_LEFT,
} from "@/components/about/about-media";
import { AboutBodyText } from "@/components/about/AboutBodyText";
import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import { AboutSectionLabel } from "@/components/about/AboutSectionLabel";
import type { ResolvedAboutSections } from "@/lib/content/about";
import { cn } from "@/lib/utils";

/** Wcięcie etykiety do widocznej szerokości wyciętego webp. */
const LABEL_INSET_X = "px-[2.9%]" as const;

type AboutMissionSectionProps = {
  sections: ResolvedAboutSections;
};

export function AboutMissionSection({ sections }: AboutMissionSectionProps) {
  return (
    <section aria-labelledby="about-mission-heading" className="relative bg-brand-50">
      {/* Dolna połowa — biała; górna zostaje kremowa (jak mockup). */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[15%] bottom-0 bg-white" />

      {/* Pionowy separator — dokładnie środek szerokości strony (nie krawędź kolumny z gap). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 z-[1] hidden w-px -translate-x-1/2 bg-brand-200 md:block"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:pb-20 lg:pb-24">
        <AboutSectionColumns
          className="px-0 pt-4 sm:pt-6 lg:pt-8"
          mediaOnEnd={false}
          mobileMediaFirst
          mediaClassName={`flex w-full justify-center md:justify-end ${ABOUT_MEDIA_GUTTER_RIGHT}`}
          textClassName={cn(ABOUT_TEXT_GUTTER_LEFT, ABOUT_MISSION_TEXT_TOP_OFFSET)}
          media={
            <div className={cn("relative w-full", ABOUT_MEDIA_WIDTH_CLASS)}>
              {sections.missionLabel ? (
                <div
                  className={cn(
                    "mb-1 w-full shrink-0",
                    LABEL_INSET_X,
                    "md:absolute md:inset-x-0 md:bottom-full md:mb-1",
                  )}
                >
                  <AboutSectionLabel>{sections.missionLabel}</AboutSectionLabel>
                </div>
              ) : null}
              <AboutArchImage
                src={sections.missionImageUrl}
                alt={sections.missionImageAlt}
                className="w-full max-w-none"
              />
            </div>
          }
          text={
            <>
              <h2 id="about-mission-heading" className="sr-only">
                Nasza misja
              </h2>
              <AboutBodyText paragraphs={sections.missionParagraphs} />
            </>
          }
        />
      </div>
    </section>
  );
}
