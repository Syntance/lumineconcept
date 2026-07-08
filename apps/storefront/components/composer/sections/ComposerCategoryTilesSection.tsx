import Link from "next/link";
import Image from "next/image";
import { cmsAttr } from "@/lib/cms-preview/attr";
import type { CategoryTile, ContentPageId } from "@/lib/content/types";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";
import { BRAND_BLUR_DATA_URL } from "@/lib/images/blur";
import { cn } from "@/lib/utils";

type Props = {
	pageId: ContentPageId;
	sectionId: string;
	items: CategoryTile[];
};

export async function ComposerCategoryTilesSection({ pageId, sectionId, items }: Props) {
	if (!items.length) return null;

	return (
		<nav
			className="grid gap-6 sm:grid-cols-3"
			{...(await cmsAttr(`page.${pageId}.sections.${sectionId}`))}
		>
			{items.map((cat, index) => (
				<Link
					key={cat.href}
					href={cat.href}
					className="group relative flex aspect-4/5 flex-col overflow-hidden border border-brand-200 bg-white transition-shadow hover:shadow-md"
				>
					<div className="relative flex-1 bg-brand-50">
						<Image
							src={cat.imageUrl}
							alt=""
							fill
							className="object-cover transition-transform group-hover:scale-105"
							sizes="(max-width: 640px) 100vw, 33vw"
							unoptimized={isCmsImageUnoptimized(cat.imageUrl)}
							placeholder="blur"
							blurDataURL={cat.blurDataURL ?? BRAND_BLUR_DATA_URL}
							loading={index === 0 ? "eager" : "lazy"}
							aria-hidden
						/>
					</div>
					<div className={cn("p-4 text-center")}>
						<h2 className="font-display text-xl tracking-wide text-brand-800">{cat.title}</h2>
						<p className="mt-2 text-xs font-medium uppercase tracking-[0.15em] text-brand-600">
							{cat.cta}
						</p>
					</div>
				</Link>
			))}
		</nav>
	);
}
