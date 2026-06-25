"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";
import {
	pickPopupBannerForPath,
	type PopupBannerDisplay,
} from "@/lib/content/popup-banners";
import type { PopupBanner } from "@/lib/content/types";

const DISMISS_PREFIX = "lumine_popup_collapsed_";
const SHOW_DELAY_MS = 1800;

type Props = {
	banners: PopupBannerDisplay[];
	rawItems: PopupBanner[];
};

type ViewState = "hidden" | "open" | "collapsed";

function readCollapsed(id: string): boolean {
	try {
		return sessionStorage.getItem(`${DISMISS_PREFIX}${id}`) === "1";
	} catch {
		return false;
	}
}

function writeCollapsed(id: string, collapsed: boolean): void {
	try {
		const key = `${DISMISS_PREFIX}${id}`;
		if (collapsed) sessionStorage.setItem(key, "1");
		else sessionStorage.removeItem(key);
	} catch {
		/* ignore */
	}
}

export function PopupBanner({ banners, rawItems }: Props) {
	const pathname = usePathname() ?? "/";
	const [canMount, setCanMount] = useState(false);
	const [view, setView] = useState<ViewState>("hidden");

	const active = pickPopupBannerForPath(banners, rawItems, pathname);

	useEffect(() => {
		const timer = window.setTimeout(() => setCanMount(true), SHOW_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (!canMount || !active) {
			setView("hidden");
			return;
		}
		setView(readCollapsed(active.id) ? "collapsed" : "open");
	}, [canMount, active?.id, pathname]);

	const collapse = useCallback(() => {
		if (!active) return;
		writeCollapsed(active.id, true);
		setView("collapsed");
	}, [active]);

	const reopen = useCallback(() => {
		if (!active) return;
		writeCollapsed(active.id, false);
		setView("open");
	}, [active]);

	if (!canMount || !active || view === "hidden") return null;

	const blurEnabled = active.blurBackground;
	const titleId = `popup-banner-title-${active.id}`;

	return (
		<>
			{view === "open" ? (
				<div className="fixed inset-0 z-[9990]" aria-hidden={false}>
					<button
						type="button"
						className={`absolute inset-0 border-0 bg-brand-900/25 p-0 ${
							blurEnabled ? "backdrop-blur-[3px]" : ""
						}`}
						onClick={collapse}
						aria-label="Zamknij baner"
					/>
					<aside
						role="dialog"
						aria-modal="true"
						aria-labelledby={active.title ? titleId : undefined}
						className="absolute bottom-0 left-0 top-0 flex w-full max-w-[min(100vw,22rem)] flex-col border-r border-brand-100 bg-[#fffdf8] shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-300 sm:max-w-sm"
					>
						<button
							type="button"
							onClick={collapse}
							className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
							aria-label="Schowaj baner"
						>
							<X className="size-4" aria-hidden />
						</button>

						<div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
							{active.imageUrl ? (
								<div className="relative aspect-[4/3] w-full shrink-0 bg-brand-50">
									<Image
										src={active.imageUrl}
										alt=""
										fill
										sizes="(max-width: 640px) 100vw, 384px"
										className="object-cover"
										loading="lazy"
										unoptimized={isCmsImageUnoptimized(active.imageUrl)}
									/>
								</div>
							) : null}

							<div className="flex flex-col gap-3 p-5 pt-6">
								{active.title ? (
									<h2 id={titleId} className="font-display text-xl text-brand-800">
										{active.title}
									</h2>
								) : null}
								{active.body ? (
									<p className="text-sm leading-relaxed text-brand-700 whitespace-pre-line">
										{active.body}
									</p>
								) : null}
								{active.link ? (
									<Link
										href={active.link}
										onClick={collapse}
										className="mt-1 inline-flex w-fit items-center justify-center rounded-md bg-brand-800 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
									>
										{active.linkLabel?.trim() || "Zobacz więcej"}
									</Link>
								) : null}
							</div>
						</div>
					</aside>
				</div>
			) : null}

			{view === "collapsed" ? (
				<button
					type="button"
					onClick={reopen}
					className="fixed left-0 top-1/2 z-[9990] flex -translate-y-1/2 flex-col items-center gap-1 rounded-r-lg border border-l-0 border-brand-200 bg-brand-800 px-2 py-3 text-[#fffdf8] shadow-lg transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-200"
					aria-label="Otwórz baner promocyjny"
				>
					<Mail className="size-4" aria-hidden />
					<span className="text-[10px] font-medium uppercase tracking-wider [writing-mode:vertical-rl] rotate-180">
						Oferta
					</span>
				</button>
			) : null}
		</>
	);
}
