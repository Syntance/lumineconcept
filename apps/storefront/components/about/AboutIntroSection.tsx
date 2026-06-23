import {
	ABOUT_INTRO_HEADING_RAISE,
	ABOUT_INTRO_MOBILE_BODY_WRAPPER,
	ABOUT_INTRO_MOBILE_CONTENT_LOWER,
	ABOUT_INTRO_MOBILE_MEDIA_LOWER,
	ABOUT_MEDIA_COLUMN_END,
	ABOUT_TEXT_GUTTER_RIGHT,
} from "@/components/about/about-media";
import { AboutBodyText } from "@/components/about/AboutBodyText";
import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutMediaBlock } from "@/components/about/AboutMediaBlock";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import { AboutSectionLabel } from "@/components/about/AboutSectionLabel";
import { ABOUT_SECTION_HEADING_CLASS, ABOUT_INTRO_MOBILE_BODY_TEXT_CLASS, ABOUT_SIDE_CAPTION_CLASS } from "@/components/about/about-typography";
import type { ResolvedAboutSections } from "@/lib/content/about";
import { cn } from "@/lib/utils";

type AboutIntroSectionProps = {
	sections: ResolvedAboutSections;
};

export function AboutIntroSection({ sections }: AboutIntroSectionProps) {
	const introImage = (
		<AboutArchImage
			src={sections.introImageUrl}
			alt={sections.introImageAlt}
			priority
		/>
	);

	const introLabel = sections.introLabel ? (
		<AboutSectionLabel>{sections.introLabel}</AboutSectionLabel>
	) : undefined;

	return (
		<section
			aria-labelledby="about-intro-heading"
			className="relative bg-brand-50 -mt-20 sm:-mt-24 lg:-mt-28"
		>
			<AboutSectionColumns
				className={cn(
					"pb-16 pt-0 sm:pb-20 lg:pb-24",
					ABOUT_INTRO_MOBILE_CONTENT_LOWER,
				)}
				mobileMediaLower={ABOUT_INTRO_MOBILE_MEDIA_LOWER}
				mobileHeadingAlignImageBottom
				mediaCaption={introLabel}
				textClassName={cn(
					ABOUT_TEXT_GUTTER_RIGHT,
					ABOUT_INTRO_HEADING_RAISE,
					"max-md:items-start md:flex md:flex-col md:items-end lg:pt-14 xl:pt-16",
				)}
				mobileBodyWrapperClassName={ABOUT_INTRO_MOBILE_BODY_WRAPPER}
				bodyClassName="max-md:text-right md:text-right"
				mediaClassName={`relative z-20 sm:-mt-4 lg:-mt-48 xl:-mt-56 ${ABOUT_MEDIA_COLUMN_END}`}
				heading={
					<h2
						id="about-intro-heading"
						className={cn(
							"mb-0 text-left md:mb-8 md:text-right",
							ABOUT_SECTION_HEADING_CLASS,
							"max-md:text-4xl sm:text-6xl lg:text-7xl",
						)}
					>
						{sections.introHeading}
					</h2>
				}
				body={<AboutBodyText paragraphs={sections.introParagraphs} className={ABOUT_INTRO_MOBILE_BODY_TEXT_CLASS} />}
				media={introImage}
				desktopMedia={
					<div className="flex items-stretch gap-2 sm:gap-3">
						<AboutMediaBlock image={introImage} label={introLabel} />
						{sections.sideCaption ? (
							<div
								className="hidden items-center md:flex md:translate-x-[60px] md:translate-y-[250px]"
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
