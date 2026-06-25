"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { PopupBannerTabIcon } from "./PopupBannerTabIcon";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";
import type { PopupBannerDisplay } from "@/lib/content/popup-banners";

type Props = {
	active: PopupBannerDisplay;
	view: "open" | "collapsed";
	onCollapse: () => void;
	onReopen: () => void;
};

export function PopupBanner({ active, view, onCollapse, onReopen }: Props) {
	const blurEnabled = active.blurBackground;
	const titleId = `popup-banner-title-${active.id}`;
	const hasText = Boolean(active.title?.trim() || active.body?.trim());

	return (
		<>
			{view === "open" ? (
				<div
					className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6"
					aria-hidden={false}
				>
					<button
						type="button"
						className={`absolute inset-0 border-0 bg-brand-900/30 p-0 ${
							blurEnabled ? "backdrop-blur-[4px]" : ""
						}`}
						onClick={onCollapse}
						aria-label="Zamknij baner"
					/>
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby={active.title ? titleId : undefined}
						className="relative z-10 flex w-[min(92vw,26rem)] max-h-[min(85vh,640px)] flex-col overflow-hidden rounded-2xl border border-brand-100 bg-[#fffdf8] shadow-[0_24px_64px_-12px_rgba(114,87,80,0.28)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300 md:w-[min(44vw,32rem)] lg:w-[min(38vw,28rem)]"
					>
						<button
							type="button"
							onClick={onCollapse}
							className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-brand-50/95 text-brand-700 shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
							aria-label="Schowaj baner"
						>
							<X className="size-4" aria-hidden />
						</button>

						<div className="flex min-h-0 flex-col overflow-y-auto overscroll-contain">
							{active.imageUrl ? (
								<div
									className={`relative w-full shrink-0 bg-brand-50 ${
										hasText ? "aspect-[16/10] max-h-[220px]" : "aspect-[4/3] max-h-[320px]"
									}`}
								>
									<Image
										src={active.imageUrl}
										alt=""
										fill
										sizes="(max-width: 768px) 92vw, 44vw"
										className="object-cover"
										loading="lazy"
										unoptimized={isCmsImageUnoptimized(active.imageUrl)}
									/>
								</div>
							) : null}

							{(hasText || active.link) ? (
								<div
									className={`flex flex-col gap-3 ${
										active.imageUrl ? "p-5 pt-4" : "p-6 pt-8"
									}`}
								>
									{active.title ? (
										<h2
											id={titleId}
											className="pr-8 font-display text-xl leading-tight text-brand-800 sm:text-2xl"
										>
											{active.title}
										</h2>
									) : null}
									{active.body ? (
										<p className="text-sm leading-relaxed text-brand-700 whitespace-pre-line sm:text-[0.9375rem]">
											{active.body}
										</p>
									) : null}
									{active.link ? (
										<Link
											href={active.link}
											onClick={onCollapse}
											className="mt-1 inline-flex w-fit items-center justify-center rounded-md bg-brand-800 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
										>
											{active.linkLabel?.trim() || "Zobacz więcej"}
										</Link>
									) : null}
								</div>
							) : null}
						</div>
					</div>
				</div>
			) : null}

			{view === "collapsed" ? (
				<button
					type="button"
					onClick={onReopen}
					className="fixed left-0 top-1/2 z-[9990] flex -translate-y-1/2 flex-col items-center gap-1 rounded-r-lg border border-l-0 border-brand-200 bg-brand-800 px-2 py-3 text-[#fffdf8] shadow-lg transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-200"
					aria-label={`Otwórz baner: ${active.tabLabel}`}
				>
					<PopupBannerTabIcon icon={active.tabIcon} className="size-4" />
					<span className="max-w-[4.5rem] truncate text-[10px] font-medium uppercase tracking-wider [writing-mode:vertical-rl] rotate-180">
						{active.tabLabel}
					</span>
				</button>
			) : null}
		</>
	);
}
