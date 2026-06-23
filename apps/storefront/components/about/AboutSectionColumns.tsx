import type { ReactNode } from "react";

import {
	ABOUT_MOBILE_BODY_BETWEEN_COLUMNS,
	ABOUT_MOBILE_MEDIA_LOWER,
	ABOUT_MEDIA_LABEL_INSET_X,
	ABOUT_MEDIA_LABEL_OVERLAP_BELOW,
	ABOUT_INTRO_DESKTOP_MEDIA_OFFSET,
	ABOUT_INTRO_HEADING_IMAGE_ALIGN_HEIGHT,
	ABOUT_PAGE_CONTENT_MAX,
	ABOUT_PAGE_GUTTER,
	ABOUT_SECTION_SAFE,
} from "@/components/about/about-media";
import { cn } from "@/lib/utils";

type AboutSectionColumnsProps = {
	heading?: ReactNode;
	body: ReactNode;
	media: ReactNode;
	/** Pełny blok mediów na desktop (gdy `media` to samo zdjęcie na mobile). */
	desktopMedia?: ReactNode;
	className?: string;
	textClassName?: string;
	mediaClassName?: string;
	bodyClassName?: string;
	/** Nadpisanie pozycji bloku tekstu na mobile (intro). */
	mobileBodyWrapperClassName?: string;
	/** Podpis pod zdjęciem — osobny wiersz na mobile (intro). */
	mediaCaption?: ReactNode;
	/** Mobile: dół nagłówka w linii z dołem zdjęcia (nad podpisem). */
	mobileHeadingAlignImageBottom?: boolean;
	/** Nadpisanie domyślnego offsetu zdjęcia na mobile (np. intro wyżej). */
	mobileMediaLower?: string;
	/** true = tekst lewa kolumna, zdjęcie prawa (domyślnie). false = zdjęcie lewa, tekst prawa. */
	mediaOnEnd?: boolean;
};

type AboutSectionGridShellProps = {
	className?: string;
	gridClassName: string;
	children: ReactNode;
};

/** Gutter 60px na pełnej szerokości + max-w-7xl wewnątrz — bez przeskoku przy >1280px. */
function AboutSectionGridShell({
	className,
	gridClassName,
	children,
}: AboutSectionGridShellProps) {
	return (
		<div className={cn("w-full min-w-0", ABOUT_PAGE_GUTTER, ABOUT_SECTION_SAFE, className)}>
			<div className={cn(ABOUT_PAGE_CONTENT_MAX, gridClassName)}>{children}</div>
		</div>
	);
}

export function AboutSectionColumns({
	heading,
	body,
	media,
	desktopMedia,
	className,
	textClassName,
	mediaClassName,
	bodyClassName,
	mobileBodyWrapperClassName,
	mediaCaption,
	mobileHeadingAlignImageBottom = false,
	mobileMediaLower = ABOUT_MOBILE_MEDIA_LOWER,
	mediaOnEnd = true,
}: AboutSectionColumnsProps) {
	const textOrder = mediaOnEnd ? "order-1" : "order-2";
	const mediaOrder = mediaOnEnd ? "order-2" : "order-1";
	const resolvedDesktopMedia = desktopMedia ?? media;
	const desktopAlignsHeadingToImage = mobileHeadingAlignImageBottom;

	const desktopGrid = (
		<AboutSectionGridShell
			className={className}
			gridClassName="hidden grid-cols-2 items-start gap-3 lg:grid lg:gap-16 xl:gap-20"
		>
			{desktopAlignsHeadingToImage ? (
				<>
					<div className={cn("min-w-0 overflow-hidden", textOrder, textClassName)}>
						<div
							className={cn(
								"flex flex-col justify-end",
								ABOUT_INTRO_HEADING_IMAGE_ALIGN_HEIGHT,
								ABOUT_INTRO_DESKTOP_MEDIA_OFFSET,
							)}
						>
							{heading}
						</div>
						<div className={cn(bodyClassName)}>{body}</div>
					</div>

					<div
						className={cn(
							"relative z-20 min-w-0 max-w-full overflow-x-clip",
							mediaOrder,
							mediaClassName,
							ABOUT_INTRO_DESKTOP_MEDIA_OFFSET,
						)}
					>
						{resolvedDesktopMedia}
					</div>
				</>
			) : (
				<>
					<div className={cn("min-w-0", textOrder, textClassName)}>
						{heading}
						<div className={cn(bodyClassName)}>{body}</div>
					</div>

					<div className={cn("min-w-0 max-w-full overflow-x-clip", mediaOrder, mediaClassName)}>
						{resolvedDesktopMedia}
					</div>
				</>
			)}
		</AboutSectionGridShell>
	);

	const defaultMobileGrid = (
		<AboutSectionGridShell
			className={className}
			gridClassName={cn(
				"grid grid-cols-2 items-start gap-3 lg:hidden",
				mobileHeadingAlignImageBottom ? "hidden" : "grid",
			)}
		>
			<div className={cn("min-w-0", textOrder, textClassName)}>
				{heading}
				<div className={cn("hidden", bodyClassName)}>{body}</div>
			</div>

			<div className={cn("min-w-0", mediaOrder, mobileMediaLower, mediaClassName)}>{media}</div>

			<div className={cn("min-w-0", ABOUT_MOBILE_BODY_BETWEEN_COLUMNS, bodyClassName)}>{body}</div>
		</AboutSectionGridShell>
	);

	if (!mobileHeadingAlignImageBottom) {
		return (
			<>
				{defaultMobileGrid}
				{desktopGrid}
			</>
		);
	}

	return (
		<>
			<AboutSectionGridShell
				className={className}
				gridClassName="grid grid-cols-2 grid-rows-[auto_auto_auto] items-stretch gap-x-3 gap-y-0 lg:hidden"
			>
				<div
					className={cn(
						"col-start-1 row-start-1 flex min-h-0 flex-col justify-end",
						textClassName,
					)}
				>
					{heading}
				</div>

				<div
					className={cn(
						"col-start-2 row-start-1 flex min-h-0 w-full flex-col justify-start",
						mobileMediaLower,
						mediaClassName,
					)}
				>
					{media}
				</div>

				{mediaCaption ? (
					<div
						className={cn(
							"col-start-2 row-start-2 w-full min-w-0",
							ABOUT_MEDIA_LABEL_OVERLAP_BELOW,
							ABOUT_MEDIA_LABEL_INSET_X,
						)}
					>
						{mediaCaption}
					</div>
				) : null}

				<div
					className={cn(
						"col-span-2 row-start-3 min-w-0 max-lg:pt-4 sm:max-lg:pt-5",
						mobileBodyWrapperClassName ?? "max-lg:w-full max-lg:text-center",
						bodyClassName,
					)}
				>
					{body}
				</div>
			</AboutSectionGridShell>

			{desktopGrid}
		</>
	);
}
