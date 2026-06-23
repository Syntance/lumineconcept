import { ABOUT_MEDIA_COLUMN_END, ABOUT_TEXT_GUTTER_RIGHT } from "@/components/about/about-media";
import { AboutBodyText } from "@/components/about/AboutBodyText";
import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutMediaBlock } from "@/components/about/AboutMediaBlock";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import { AboutSectionLabel } from "@/components/about/AboutSectionLabel";
import { ABOUT_SECTION_HEADING_CLASS, ABOUT_SIDE_CAPTION_CLASS } from "@/components/about/about-typography";
import type { ResolvedAboutSections } from "@/lib/content/about";

type AboutIntroSectionProps = {
  sections: ResolvedAboutSections;
};

export function AboutIntroSection({ sections }: AboutIntroSectionProps) {
  return (
    <section
      aria-labelledby="about-intro-heading"
      className="relative bg-brand-50 -mt-20 sm:-mt-24 lg:-mt-28"
    >
      <AboutSectionColumns
        className="pb-16 pt-0 sm:pb-20 lg:pb-24"
        textClassName={`${ABOUT_TEXT_GUTTER_RIGHT} lg:pt-14 xl:pt-16`}
        mediaClassName={`relative z-20 sm:-mt-4 lg:-mt-48 xl:-mt-56 ${ABOUT_MEDIA_COLUMN_END}`}
        text={
          <>
            <h2
              id="about-intro-heading"
              className={`mb-8 text-right ${ABOUT_SECTION_HEADING_CLASS}`}
            >
              {sections.introHeading}
            </h2>
            <AboutBodyText paragraphs={sections.introParagraphs} className="text-right" />
          </>
        }
        media={
          <div className="flex items-stretch gap-2 sm:gap-3">
            <AboutMediaBlock
              image={
                <AboutArchImage
                  src={sections.introImageUrl}
                  alt={sections.introImageAlt}
                  priority
                  className="w-full max-w-none"
                />
              }
              label={
                sections.introLabel ? (
                  <AboutSectionLabel>{sections.introLabel}</AboutSectionLabel>
                ) : undefined
              }
            />
            {sections.sideCaption ? (
              <div className="hidden items-center md:flex md:translate-x-[60px] md:translate-y-[250px]" aria-hidden>
                <p className={ABOUT_SIDE_CAPTION_CLASS}>
                  {sections.sideCaption}
                </p>
              </div>
            ) : null}
          </div>
        }
      />
    </section>
  );
}
