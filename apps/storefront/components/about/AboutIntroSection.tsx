import { ABOUT_MEDIA_COLUMN_END, ABOUT_TEXT_GUTTER_RIGHT } from "@/components/about/about-media";
import { AboutBodyText } from "@/components/about/AboutBodyText";
import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutMediaBlock } from "@/components/about/AboutMediaBlock";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import { AboutSectionLabel } from "@/components/about/AboutSectionLabel";
import {
	ABOUT_SECTION_HEADING_CLASS,
	ABOUT_SIDE_CAPTION_CLASS,
} from "@/components/about/about-typography";
import type { ResolvedAboutSections } from "@/lib/content/about";

type AboutIntroSectionProps = {
	sections: ResolvedAboutSections;
};

export function AboutIntroSection({ sections }: AboutIntroSectionProps) {
	return (
		<section
			aria-labelledby="about-intro-heading"
			className="relative bg-brand-50 max-md:mt-0 -mt-20 sm:-mt-24 lg:-mt-28"
		>
			<AboutSectionColumns
				className="pb-16 pt-0 sm:pb-20 lg:pb-24 max-md:gap-6 max-md:pb-14"
				mobileMediaFirst
				textClassName={`${ABOUT_TEXT_GUTTER_RIGHT} flex flex-col items-end max-md:items-center lg:pt-14 xl:pt-16`}
				mediaClassName={`relative z-20 max-md:mt-0 max-md:flex max-md:justify-center lg:-mt-48 xl:-mt-56 ${ABOUT_MEDIA_COLUMN_END}`}
				text={
					<>
						<h2
							id="about-intro-heading"
							className={`mb-8 text-right max-md:mb-6 max-md:text-center max-xl:mb-6 ${ABOUT_SECTION_HEADING_CLASS}`}
						>
							{sections.introHeading}
						</h2>
						<AboutBodyText
							paragraphs={sections.introParagraphs}
							className="text-right max-md:text-center"
						/>
					</>
				}
				media={
					<div className="flex items-stretch gap-2 sm:gap-3">
						<div className="flex w-full flex-col items-center">
							<AboutMediaBlock
								image={
									<AboutArchImage
										src={sections.introImageUrl}
										alt={sections.introImageAlt}
										priority
										className="w-full lg:max-w-none"
									/>
								}
								label={
									sections.introLabel ? (
										<AboutSectionLabel>{sections.introLabel}</AboutSectionLabel>
									) : undefined
								}
							/>
						</div>
						{sections.sideCaption ? (
							<div
								className="hidden items-center xl:flex xl:translate-x-[60px] xl:translate-y-[250px]"
								aria-hidden
							>
								<p className={ABOUT_SIDE_CAPTION_CLASS}>{sections.sideCaption}</p>
							</div>
						) : null}
					</div>
				}
			/>
		</section>
	);
}
