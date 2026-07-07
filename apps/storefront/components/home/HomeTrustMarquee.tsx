import Image from "next/image";
import { cmsAttr } from "@/lib/cms-preview/attr";
import { getGlobalContent, getSiteSettings } from "@/lib/content";
import {
	mapSalonLogosForMarquee,
	resolveTrustBarDisplay,
} from "@/lib/content/cms-wiring";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";

export async function HomeTrustMarquee() {
	const [global, settings] = await Promise.all([getGlobalContent(), getSiteSettings()]);
	const salons = mapSalonLogosForMarquee(global);
	if (salons.length === 0) return null;
	const trust = resolveTrustBarDisplay(settings.trustBar);
	const doubled = [...salons, ...salons];

	return (
		<div {...(await cmsAttr("settings.trustBar"))} className="shrink-0 overflow-hidden bg-brand-50 pb-4 pt-4 md:pb-4 md:pt-5">
			<p className="mb-4 text-center text-sm font-medium uppercase tracking-[0.25em] text-brand-400">
				Zaufały nam
			</p>
			<div className="relative">
				<div className="absolute bottom-0 left-0 top-0 z-10 w-20 bg-linear-to-r from-brand-50 to-transparent" />
				<div className="absolute bottom-0 right-0 top-0 z-10 w-20 bg-linear-to-l from-brand-50 to-transparent" />
				<div className="trust-scroll">
					{doubled.map((salon, i) => (
						<div
							key={`${salon.name}-${i}`}
							className="mx-8 flex h-11 items-center opacity-40 transition-opacity duration-300 hover:opacity-80"
						>
							{salon.type === "logo" ? (
								<Image
									src={salon.src}
									alt={salon.name}
									width={133}
									height={43}
									className="h-8 w-auto object-contain"
									unoptimized={isCmsImageUnoptimized(salon.src)}
								/>
							) : (
								<span className="whitespace-nowrap text-base font-medium uppercase tracking-[0.15em] text-brand-600">
									{salon.name}
								</span>
							)}
						</div>
					))}
				</div>
			</div>
			<p className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-sm text-brand-400">
				<span className="font-medium text-brand-600">{trust.followers} obserwujących</span>
				<span className="mx-1.5 text-brand-300">&middot;</span>
				<span className="text-brand-600">{trust.realizations} realizacji</span>
			</p>
		</div>
	);
}
