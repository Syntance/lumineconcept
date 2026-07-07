import Link from "next/link";
import { cmsAttr } from "@/lib/cms-preview/attr";
import { getSiteSettings } from "@/lib/content";
import { resolveAnnouncementBar } from "@/lib/content/cms-wiring";

export async function AnnouncementBar() {
	const settings = await getSiteSettings();
	const bar = resolveAnnouncementBar(settings);
	if (!bar) return null;

	const content = <p>{bar.text}</p>;

	return (
		<div {...(await cmsAttr("settings.announcementBar"))} className="bg-brand-800 px-3 py-2 text-center text-[11px] font-medium uppercase leading-snug tracking-[0.08em] text-brand-100 sm:px-4 sm:text-[12px] sm:tracking-[0.12em] lg:text-[13px] lg:tracking-[0.15em]">
			{bar.link ? (
				<Link href={bar.link} className="transition-colors hover:text-white">
					{content}
				</Link>
			) : (
				content
			)}
		</div>
	);
}
