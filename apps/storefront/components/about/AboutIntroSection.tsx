import {
	ABOUT_INTRO_DESKTOP_MEDIA_OFFSET,
	ABOUT_INTRO_DESKTOP_MEDIA_ROW,
	ABOUT_INTRO_MOBILE_BODY_WRAPPER,
	ABOUT_INTRO_DESKTOP_BODY_EDGE,
	ABOUT_INTRO_MOBILE_IMAGE_OVERLAP,
	ABOUT_INTRO_SECTION_OVERLAP,
	ABOUT_INTRO_SIDE_CAPTION_ALIGN,
	ABOUT_INTRO_SIDE_CAPTION_VISIBILITY,
	ABOUT_MEDIA_COLUMN_END,
	ABOUT_SECTION_SAFE,
	ABOUT_TEXT_GUTTER_RIGHT,
} from "@/components/about/about-media";
import { AboutBodyText } from "@/components/about/AboutBodyText";
import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutMediaBlock } from "@/components/about/AboutMediaBlock";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import { AboutSectionLabel } from "@/components/about/AboutSectionLabel";
import { ABOUT_SECTION_HEADING_CLASS, ABOUT_SECTION_MOBILE_BESIDE_IMAGE_HEADING_CLASS, ABOUT_SECTION_MOBILE_BODY_TEXT_CLASS, ABOUT_SIDE_CAPTION_CLASS } from "@/components/about/about-typography";
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
			className={cn("max-lg:mx-0 max-lg:max-w-none", ABOUT_INTRO_MOBILE_IMAGE_OVERLAP)}
		/>
	);

	const introLabel = sections.introLabel ? (
		<AboutSectionLabel>{sections.introLabel}</AboutSectionLabel>
	) : undefined;

	return (
		<section
			aria-labelledby="about-intro-heading"
			className={cn(
				"relative z-10 bg-brand-50 overflow-x-clip",
				ABOUT_SECTION_SAFE,
				ABOUT_INTRO_SECTION_OVERLAP,
			)}
		>
			<AboutSectionColumns
				className="pb-16 pt-0 sm:pb-20 lg:pb-24"
				mobileMediaLower="lg:mt-0"
				mobileHeadingAlignImageBottom
				mediaCaption={introLabel}
				textClassName={cn(
					ABOUT_TEXT_GUTTER_RIGHT,
					"max-lg:flex max-lg:w-full max-lg:flex-col max-lg:items-start max-lg:justify-end",
					"lg:flex lg:flex-col lg:items-end lg:pt-14 xl:pt-16",
				)}
				mobileBodyWrapperClassName={ABOUT_INTRO_MOBILE_BODY_WRAPPER}
				bodyClassName={cn(
					"max-lg:w-full max-lg:text-right lg:text-right",
					ABOUT_INTRO_DESKTOP_BODY_EDGE,
				)}
				mediaClassName={cn(
					"relative z-20 max-lg:flex max-lg:w-full max-lg:flex-col max-lg:items-end max-lg:justify-start",
					ABOUT_MEDIA_COLUMN_END,
				)}
				heading={
					<h2
						id="about-intro-heading"
						className={cn(
							ABOUT_SECTION_MOBILE_BESIDE_IMAGE_HEADING_CLASS,
							"text-left lg:text-right",
							ABOUT_SECTION_HEADING_CLASS,
						)}
					>
						{sections.introHeading}
					</h2>
				}
				body={<AboutBodyText paragraphs={sections.introParagraphs} className={ABOUT_SECTION_MOBILE_BODY_TEXT_CLASS} />}
				media={introImage}
				desktopMedia={
					<div className={ABOUT_INTRO_DESKTOP_MEDIA_ROW}>
						<div className="flex w-full flex-col items-center lg:items-start">
							<AboutMediaBlock image={introImage} label={introLabel} />
						</div>
						{sections.sideCaption ? (
							<div
								className={cn("items-center", ABOUT_INTRO_SIDE_CAPTION_VISIBILITY, ABOUT_INTRO_SIDE_CAPTION_ALIGN)}
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
