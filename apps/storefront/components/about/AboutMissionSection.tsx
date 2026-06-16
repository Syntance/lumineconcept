import {
  ABOUT_MEDIA_GUTTER_RIGHT,
  ABOUT_MISSION_TEXT_TOP_OFFSET,
  ABOUT_TEXT_GUTTER_LEFT,
} from "@/components/about/about-media";
import { AboutBodyText } from "@/components/about/AboutBodyText";
import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutMediaBlock } from "@/components/about/AboutMediaBlock";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import { AboutSectionLabel } from "@/components/about/AboutSectionLabel";
import type { ResolvedAboutSections } from "@/lib/content/about";
import { cn } from "@/lib/utils";

type AboutMissionSectionProps = {
  sections: ResolvedAboutSections;
};

export function AboutMissionSection({ sections }: AboutMissionSectionProps) {
  return (
    <section aria-labelledby="about-mission-heading" className="relative bg-brand-50">
      {/* Dolna połowa — biała; górna zostaje kremowa (jak mockup). */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[15%] bottom-0 bg-white" />

      {/* Pionowy separator — środek strony, 150px, kolor nagłówków. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[calc(15%-100px)] z-[1] hidden h-[150px] w-px -translate-x-1/2 bg-brand-800 md:block"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:pb-20 lg:pb-24">
        <AboutSectionColumns
          className="px-0 pt-4 sm:pt-6 lg:pt-8"
          mediaOnEnd={false}
          mobileMediaFirst
          mediaClassName={`flex w-full justify-center md:justify-end ${ABOUT_MEDIA_GUTTER_RIGHT}`}
          textClassName={cn(ABOUT_TEXT_GUTTER_LEFT, ABOUT_MISSION_TEXT_TOP_OFFSET)}
          media={
            <AboutMediaBlock
              labelPosition="above"
              image={
                <AboutArchImage
                  src={sections.missionImageUrl}
                  alt={sections.missionImageAlt}
                  className="w-full max-w-none"
                />
              }
              label={
                sections.missionLabel ? (
                  <AboutSectionLabel>{sections.missionLabel}</AboutSectionLabel>
                ) : undefined
              }
            />
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
