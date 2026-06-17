import Image from "next/image";

import { Breadcrumbs, BREADCRUMBS_ALIGN_CLASS } from "@/components/common/Breadcrumbs";
import type { ResolvedAboutHero } from "@/lib/content/about";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";
import { cn } from "@/lib/utils";

type AboutHeroSectionProps = {
	hero: ResolvedAboutHero;
};

export function AboutHeroSection({ hero }: AboutHeroSectionProps) {
	return (
		<section
			aria-labelledby="about-hero-heading"
			className={cn(
				"relative overflow-hidden bg-brand-900 text-white",
			)}
		>
			<div className="pointer-events-none absolute inset-0" aria-hidden>
				<Image
					src={hero.backgroundUrl}
					alt=""
					fill
					priority
					fetchPriority="high"
					sizes="100vw"
					quality={90}
					unoptimized={isCmsImageUnoptimized(hero.backgroundUrl)}
					className="object-cover object-center opacity-90 max-md:motion-safe:animate-in max-md:motion-safe:fade-in max-md:motion-safe:duration-500"
					draggable={false}
				/>
			</div>

			<div
				className={cn(
					"pointer-events-none absolute inset-0 bg-linear-to-b from-brand-900/35 via-brand-900/10 to-brand-900/55",
					"max-md:from-brand-900/50 max-md:via-brand-900/15 max-md:to-brand-900/60",
				)}
				aria-hidden
			/>

			<div
				className={cn(
					"relative z-10 px-4 pt-8 sm:pt-10",
					BREADCRUMBS_ALIGN_CLASS,
					"max-md:px-5 max-md:pb-0 max-md:pt-4 max-xl:pl-10 max-xl:pr-5 sm:max-xl:pl-12",
				)}
			>
				<Breadcrumbs
					className="mb-0 font-gilroy text-sm [&_a]:text-white/75 [&_a:hover]:text-white [&_span]:text-white/90"
					items={[
						{ label: "Strona główna", href: "/" },
						{ label: "O nas" },
					]}
				/>
			</div>

			<div
				className={cn(
					"relative z-10 mx-auto max-w-7xl px-4 pb-32 pt-10 sm:pb-40 sm:pt-14 lg:pb-48 lg:pt-16",
					"max-md:mx-auto max-md:px-5 max-md:pb-[52px] max-md:pt-3 max-md:text-center",
					"max-xl:pl-10 max-xl:pr-5 sm:max-xl:pl-12",
				)}
			>
				<div className="max-w-xl max-md:mx-auto max-md:mt-[60px]">
					<h1
						id="about-hero-heading"
						className="font-binerka text-5xl leading-none tracking-[0.12em] text-white sm:text-6xl lg:text-7xl max-md:text-[2.75rem]"
					>
						{hero.headline}
					</h1>
					{hero.subtitle ? (
						<p className="-mt-0.5 font-gilroy text-2xl font-normal leading-tight tracking-[0.06em] text-brand-100 sm:text-3xl lg:text-4xl max-md:mt-2 max-md:text-xl">
							{hero.subtitle}
						</p>
					) : null}
				</div>
			</div>
		</section>
	);
}
