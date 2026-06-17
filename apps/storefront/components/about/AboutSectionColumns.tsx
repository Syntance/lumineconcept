import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AboutSectionColumnsProps = {
	text: ReactNode;
	media: ReactNode;
	className?: string;
	textClassName?: string;
	mediaClassName?: string;
	/** Kolejność na mobile: domyślnie media nad tekstem */
	mobileMediaFirst?: boolean;
	/** Desktop: true = tekst lewa kolumna, zdjęcie prawa (domyślnie). false = odwrotnie. */
	mediaOnEnd?: boolean;
};

export function AboutSectionColumns({
	text,
	media,
	className,
	textClassName,
	mediaClassName,
	mobileMediaFirst = true,
	mediaOnEnd = true,
}: AboutSectionColumnsProps) {
	const textOrder = mobileMediaFirst
		? mediaOnEnd
			? "order-2 lg:order-1"
			: "order-2 lg:order-2"
		: mediaOnEnd
			? "order-1 lg:order-1"
			: "order-1 lg:order-2";

	const mediaOrder = mobileMediaFirst
		? mediaOnEnd
			? "order-1 lg:order-2"
			: "order-1 lg:order-1"
		: mediaOnEnd
			? "order-2 lg:order-2"
			: "order-2 lg:order-1";

	return (
		<div
			className={cn(
				"mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-4 sm:gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20",
				"max-lg:gap-8 max-lg:px-5",
				className,
			)}
		>
			<div className={cn("min-w-0", textOrder, textClassName)}>{text}</div>
			<div className={cn("min-w-0", mediaOrder, mediaClassName)}>{media}</div>
		</div>
	);
}
