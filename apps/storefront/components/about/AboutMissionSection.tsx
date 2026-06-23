import Image from "next/image";

import {
	ABOUT_MEDIA_COLUMN_START,
	ABOUT_MISSION_MOBILE_MEDIA_ALIGN,
	ABOUT_MISSION_MOBILE_MEDIA_BLOCK,
	ABOUT_MISSION_MOBILE_MEDIA_LOWER,
	ABOUT_MISSION_MOBILE_TEXT_BESIDE_OFFSET,
	ABOUT_MISSION_TEXT_TOP_OFFSET,
	ABOUT_SECTION_SAFE,
	ABOUT_SIGNET_ASPECT_CLASS,
	ABOUT_SIGNET_IMAGE,
	ABOUT_SIGNET_WIDTH_CLASS,
	ABOUT_TEXT_GUTTER_LEFT,
} from "@/components/about/about-media";
import { AboutBodyText } from "@/components/about/AboutBodyText";
import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutMediaBlock } from "@/components/about/AboutMediaBlock";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import { AboutSectionLabel } from "@/components/about/AboutSectionLabel";
import { ABOUT_SECTION_MOBILE_BODY_TEXT_CLASS } from "@/components/about/about-typography";
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
				className="pointer-events-none absolute inset-x-0 top-[16%] z-0 h-[47%] bg-white"
			/>

			<div
				aria-hidden
				className="pointer-events-none absolute left-1/2 top-[calc(15%-100px)] z-[1] hidden h-[150px] w-px -translate-x-1/2 bg-brand-800 lg:block"
			/>

			<div className="relative z-10 w-full pb-16 pt-0 sm:pb-20 lg:mx-auto lg:max-w-7xl lg:px-4 lg:pb-24 lg:pt-8">
				<AboutSectionColumns
					className="lg:pt-0"
					mediaOnEnd={false}
					mobileBodyBesideMedia
					mobileMediaLower={ABOUT_MISSION_MOBILE_MEDIA_LOWER}
					mediaClassName={cn(ABOUT_MEDIA_COLUMN_START, ABOUT_MISSION_MOBILE_MEDIA_ALIGN)}
					textClassName={cn(
						ABOUT_TEXT_GUTTER_LEFT,
						ABOUT_MISSION_MOBILE_TEXT_BESIDE_OFFSET,
						ABOUT_MISSION_TEXT_TOP_OFFSET,
						"max-lg:flex max-lg:flex-col max-lg:items-start",
						"lg:flex lg:flex-col lg:items-start",
					)}
					bodyClassName="max-lg:text-left lg:text-left"
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
						<>
							<h2 id="about-mission-heading" className="sr-only">
								Nasza misja
							</h2>
							<div
								aria-hidden
								className={cn(
									"relative mb-3 hidden max-lg:block",
									ABOUT_SIGNET_WIDTH_CLASS,
								)}
							>
								<div className={cn("relative w-full", ABOUT_SIGNET_ASPECT_CLASS)}>
									<Image
										src={ABOUT_SIGNET_IMAGE}
										alt=""
										fill
										className="object-contain object-center"
										sizes="96px"
									/>
								</div>
							</div>
							<AboutBodyText
								paragraphs={sections.missionParagraphs}
								className={ABOUT_SECTION_MOBILE_BODY_TEXT_CLASS}
							/>
						</>
					}
				/>
			</div>
		</section>
	);
}
