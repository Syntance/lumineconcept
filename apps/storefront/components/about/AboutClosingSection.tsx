import { ABOUT_MEDIA_GUTTER_LEFT, ABOUT_MEDIA_WIDTH_CLASS } from "@/components/about/about-media";
import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import type { ResolvedAboutSections } from "@/lib/content/about";
import { cn } from "@/lib/utils";

type AboutClosingSectionProps = {
  sections: ResolvedAboutSections;
};

/** Wizualne domknięcie strony — bez dodatkowego copy, zgodnie z materiałem od klienta. */
export function AboutClosingSection({ sections }: AboutClosingSectionProps) {
  return (
    <section aria-label="Domknięcie strony" className="bg-brand-50 pb-20 pt-4 sm:pb-24">
      <AboutSectionColumns
        mobileMediaFirst={false}
        textClassName="hidden md:block"
        mediaClassName={`flex w-full justify-center md:justify-start ${ABOUT_MEDIA_GUTTER_LEFT}`}
        text={<span aria-hidden />}
        media={
          <div className={cn("flex w-full flex-col items-center md:items-start", ABOUT_MEDIA_WIDTH_CLASS)}>
            <AboutArchImage
              src={sections.closingImageUrl}
              alt={sections.closingImageAlt}
              className="w-full max-w-none"
            />
            <div className="mt-10 flex w-full flex-col items-center md:items-start" aria-hidden>
              <span className="h-16 w-px bg-brand-300" />
              <span className="mt-2 size-2 rounded-full bg-brand-400" />
            </div>
          </div>
        }
      />
    </section>
  );
}
