import type { ReactNode } from "react";

import {
	ABOUT_MOBILE_BODY_BETWEEN_COLUMNS,
	ABOUT_MOBILE_MEDIA_LOWER,
	ABOUT_MEDIA_LABEL_INSET_X,
	ABOUT_MEDIA_LABEL_OVERLAP_BELOW,
	ABOUT_PAGE_GUTTER,
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

	const gridShell = "mx-auto w-full max-w-7xl";

	const desktopGrid = (
		<div
			className={cn(
				gridShell,
				"hidden grid-cols-2 items-start gap-3 md:grid md:gap-16 lg:gap-20",
				ABOUT_PAGE_GUTTER,
				className,
			)}
		>
			<div className={cn("min-w-0", textOrder, textClassName)}>
				{heading}
				<div className={cn(bodyClassName)}>{body}</div>
			</div>

			<div className={cn("min-w-0", mediaOrder, mediaClassName)}>{resolvedDesktopMedia}</div>
		</div>
	);

	const defaultMobileGrid = (
		<div
			className={cn(
				gridShell,
				"grid grid-cols-2 items-start gap-3 md:hidden",
				mobileHeadingAlignImageBottom ? "hidden" : "grid",
				ABOUT_PAGE_GUTTER,
				className,
			)}
		>
			<div className={cn("min-w-0", textOrder, textClassName)}>
				{heading}
				<div className={cn("hidden", bodyClassName)}>{body}</div>
			</div>

			<div className={cn("min-w-0", mediaOrder, mobileMediaLower, mediaClassName)}>{media}</div>

			<div className={cn("min-w-0", ABOUT_MOBILE_BODY_BETWEEN_COLUMNS, bodyClassName)}>{body}</div>
		</div>
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
			<div
				className={cn(
					gridShell,
					"grid grid-cols-2 grid-rows-[auto_auto_auto] items-stretch gap-x-3 gap-y-0 md:hidden",
					ABOUT_PAGE_GUTTER,
					className,
				)}
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
						"col-start-2 row-start-1 row-span-2 flex min-h-0 w-full flex-col justify-start",
						mobileMediaLower,
						mediaClassName,
					)}
				>
					{media}
					{mediaCaption ? (
						<div
							className={cn(
								"w-full min-w-0",
								ABOUT_MEDIA_LABEL_OVERLAP_BELOW,
								ABOUT_MEDIA_LABEL_INSET_X,
							)}
						>
							{mediaCaption}
						</div>
					) : null}
				</div>

				<div
					className={cn(
						"col-span-2 row-start-3 min-w-0 max-md:pt-4 sm:max-md:pt-5",
						mobileBodyWrapperClassName ??
							"max-md:w-full max-md:text-center",
						bodyClassName,
					)}
				>
					{body}
				</div>
			</div>

			{desktopGrid}
		</>
	);
}
