import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutMediaBlock } from "@/components/about/AboutMediaBlock";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import { AboutSectionLabel } from "@/components/about/AboutSectionLabel";
import { ABOUT_BODY_TEXT_CLASS } from "@/components/about/about-typography";
import type { ResolvedAboutSections } from "@/lib/content/about";

type AboutMissionSectionProps = {
  sections: ResolvedAboutSections;
};

function DoubleArchDivider() {
  return (
    <svg
      viewBox="0 0 48 32"
      className="mx-auto h-8 w-12 text-brand-300"
      aria-hidden
    >
      <path
        d="M4 28 Q24 4 44 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M8 30 Q24 10 40 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}

export function AboutMissionSection({ sections }: AboutMissionSectionProps) {
  return (
    <section aria-labelledby="about-mission-heading" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:pb-20 lg:pb-24">
        <DoubleArchDivider />

        <AboutSectionColumns
          className="mt-12 px-0"
          mediaOnEnd={false}
          mobileMediaFirst
          mediaClassName="flex w-full justify-center md:justify-start"
          textClassName="md:border-l md:border-brand-200 md:pl-10 lg:pl-14 xl:pl-16"
          media={
            <AboutMediaBlock
              labelPosition="above"
              label={
                sections.missionLabel ? (
                  <AboutSectionLabel>{sections.missionLabel}</AboutSectionLabel>
                ) : undefined
              }
              image={
                <AboutArchImage
                  src={sections.missionImageUrl}
                  alt={sections.missionImageAlt}
                  className="w-full max-w-none"
                />
              }
            />
          }
          text={
            <>
              <h2 id="about-mission-heading" className="sr-only">
                Nasza misja
              </h2>
              <div className={`space-y-5 text-brand-700 ${ABOUT_BODY_TEXT_CLASS}`}>
                {sections.missionParagraphs.map((paragraph) => (
                  <p key={paragraph} className="text-pretty">
                    {paragraph}
                  </p>
                ))}
              </div>
            </>
          }
        />
      </div>
    </section>
  );
}
