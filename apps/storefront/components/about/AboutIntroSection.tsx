import { ABOUT_MEDIA_GUTTER_LEFT, ABOUT_TEXT_GUTTER_RIGHT } from "@/components/about/about-media";
import { AboutBodyText } from "@/components/about/AboutBodyText";
import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutMediaBlock } from "@/components/about/AboutMediaBlock";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import { AboutSectionLabel } from "@/components/about/AboutSectionLabel";
import { ABOUT_SECTION_HEADING_CLASS } from "@/components/about/about-typography";
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
      {sections.sideCaption ? (
        <div className="pointer-events-none absolute inset-y-16 right-3 hidden xl:block" aria-hidden>
          <p className="font-gilroy text-[0.65rem] font-medium uppercase tracking-[0.35em] text-brand-400 [writing-mode:vertical-rl] rotate-180">
            {sections.sideCaption}
          </p>
        </div>
      ) : null}

      <AboutSectionColumns
        className="pb-16 pt-0 sm:pb-20 lg:pb-24"
        textClassName={`${ABOUT_TEXT_GUTTER_RIGHT} lg:pt-14 xl:pt-16`}
        mediaClassName={`relative z-20 flex w-full justify-center sm:-mt-4 md:justify-start ${ABOUT_MEDIA_GUTTER_LEFT} lg:-mt-48 xl:-mt-56`}
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
        }
      />
    </section>
  );
}
