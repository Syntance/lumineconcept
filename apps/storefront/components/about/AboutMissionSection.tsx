import {
	ABOUT_MEDIA_COLUMN_START,
	ABOUT_MISSION_MOBILE_BODY_WRAPPER,
	ABOUT_MISSION_MOBILE_MEDIA_BLOCK,
	ABOUT_MISSION_MOBILE_MEDIA_LOWER,
	ABOUT_MISSION_MOBILE_HEADING_RAISE,
	ABOUT_MISSION_TEXT_TOP_OFFSET,
	ABOUT_MISSION_WHITE_BAND_HEIGHT,
	ABOUT_MISSION_WHITE_BAND_TOP,
	ABOUT_SECTION_SAFE,
	ABOUT_TEXT_GUTTER_LEFT,
} from "@/components/about/about-media";
import { AboutBodyText } from "@/components/about/AboutBodyText";
import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutMediaBlock } from "@/components/about/AboutMediaBlock";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import { AboutSectionLabel } from "@/components/about/AboutSectionLabel";
import { ABOUT_SECTION_HEADING_CLASS, ABOUT_SECTION_MOBILE_BESIDE_IMAGE_HEADING_CLASS, ABOUT_SECTION_MOBILE_BODY_TEXT_CLASS } from "@/components/about/about-typography";
import type { ResolvedAboutSections } from "@/lib/content/about";
import { cn } from "@/lib/utils";

type AboutMissionSectionProps = {
	sections: ResolvedAboutSections;
};

export function AboutMissionSection({ sections }: AboutMissionSectionProps) {
	return (
		<section
			aria-labelledby="about-mission-heading"
			className={cn("relative bg-brand-50", ABOUT_SECTION_SAFE, "max-lg:overflow-x-clip")}
		>
			{/* Biały pas misji — jak desktop. */}
			<div
				aria-hidden
				className={cn(
					"pointer-events-none absolute inset-x-0 z-0 bg-white",
					ABOUT_MISSION_WHITE_BAND_TOP,
					ABOUT_MISSION_WHITE_BAND_HEIGHT,
				)}
			/>

			<div
				aria-hidden
				className="pointer-events-none absolute left-1/2 top-[calc(15%-100px)] z-[1] hidden h-[150px] w-px -translate-x-1/2 bg-brand-800 lg:block"
			/>

			<div className="relative z-10 w-full pb-16 pt-0 sm:pb-20 lg:mx-auto lg:max-w-7xl lg:px-4 lg:pb-24 lg:pt-8">
				<AboutSectionColumns
					className="lg:pt-0"
					mediaOnEnd={false}
					mobileStackedLayout="media-start"
					mobileMediaLower={ABOUT_MISSION_MOBILE_MEDIA_LOWER}
					mobileBodyWrapperClassName={ABOUT_MISSION_MOBILE_BODY_WRAPPER}
					mediaClassName={cn(
						"relative z-20 max-lg:flex max-lg:w-full max-lg:flex-col max-lg:items-start max-lg:justify-start",
						ABOUT_MEDIA_COLUMN_START,
					)}
					textClassName={cn(
						ABOUT_TEXT_GUTTER_LEFT,
						ABOUT_MISSION_TEXT_TOP_OFFSET,
						"lg:flex lg:flex-col lg:items-start",
					)}
					bodyClassName="max-lg:w-full max-lg:text-left lg:text-left"
					heading={
						<h2
							id="about-mission-heading"
							className={cn(
								ABOUT_SECTION_MOBILE_BESIDE_IMAGE_HEADING_CLASS,
								ABOUT_MISSION_MOBILE_HEADING_RAISE,
								"text-left",
								ABOUT_SECTION_HEADING_CLASS,
								"lg:sr-only",
							)}
						>
							{sections.missionLabel || "Nasza misja"}
						</h2>
					}
					media={
						<AboutMediaBlock
							className={ABOUT_MISSION_MOBILE_MEDIA_BLOCK}
							labelPosition="above"
							image={
								<AboutArchImage
									src={sections.missionImageUrl}
									alt={sections.missionImageAlt}
									className="max-lg:mx-0 lg:max-w-none"
								/>
							}
							label={
								sections.missionLabel ? (
									<AboutSectionLabel>{sections.missionLabel}</AboutSectionLabel>
								) : undefined
							}
						/>
					}
					body={
						<AboutBodyText
							paragraphs={sections.missionParagraphs}
							className={ABOUT_SECTION_MOBILE_BODY_TEXT_CLASS}
						/>
					}
				/>
			</div>
		</section>
	);
}
