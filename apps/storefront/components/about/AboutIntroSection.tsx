import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutMediaBlock } from "@/components/about/AboutMediaBlock";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import { AboutSectionLabel } from "@/components/about/AboutSectionLabel";
import { ABOUT_BODY_TEXT_CLASS } from "@/components/about/about-typography";
import type { ResolvedAboutSections } from "@/lib/content/about";

type AboutIntroSectionProps = {
  sections: ResolvedAboutSections;
};

export function AboutIntroSection({ sections }: AboutIntroSectionProps) {
  return (
    <section
      aria-labelledby="about-intro-heading"
      className="relative z-10 -mt-20 bg-brand-50 sm:-mt-24 lg:-mt-28"
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
        textClassName="md:pr-4 lg:pt-14 xl:pt-16"
        mediaClassName="relative z-20 flex w-full justify-center sm:-mt-4 md:justify-end lg:-mt-48 xl:-mt-56"
        text={
          <>
            <h2
              id="about-intro-heading"
              className="mb-8 text-right font-binerka text-3xl tracking-[0.14em] text-brand-800 sm:text-4xl"
            >
              {sections.introHeading}
            </h2>
            <div className={`space-y-5 text-right text-brand-700 ${ABOUT_BODY_TEXT_CLASS}`}>
              {sections.introParagraphs.map((paragraph) => (
                <p key={paragraph} className="text-pretty">
                  {paragraph}
                </p>
              ))}
            </div>
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
