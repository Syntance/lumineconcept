"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CONSENT_EVENT, hasConsentDecision } from "@/lib/consent/consent";
import {
	hasPopupBannerEntryShown,
	markPopupBannerEntryShown,
} from "@/lib/content/popup-banner-session";
import {
	pickPopupBannerForPath,
	type PopupBannerDisplay,
} from "@/lib/content/popup-banners";
import type { PopupBanner } from "@/lib/content/types";

const PopupBanner = dynamic(
	() => import("./PopupBanner").then((mod) => mod.PopupBanner),
	{ ssr: false },
);

/** Opóźnienie po decyzji cookies (zgodne z banerem cookie). */
const POST_CONSENT_DELAY_MS = 2000;

type Props = {
	banners: PopupBannerDisplay[];
	rawItems: PopupBanner[];
};

export type PopupBannerViewState = "hidden" | "open" | "collapsed";

/** Lazy client boundary — stan trzymany tutaj, żeby przetrwał remount dynamicznego PopupBanner. */
export function PopupBannerClient({ banners, rawItems }: Props) {
	const pathname = usePathname() ?? "/";
	const [canMount, setCanMount] = useState(false);
	const [view, setView] = useState<PopupBannerViewState>("hidden");

	const active = pickPopupBannerForPath(banners, rawItems, pathname);

	useEffect(() => {
		let timer: number | undefined;

		function scheduleShow() {
			const delayMs = hasPopupBannerEntryShown() ? 0 : POST_CONSENT_DELAY_MS;
			timer = window.setTimeout(() => setCanMount(true), delayMs);
		}

		if (hasConsentDecision()) {
			scheduleShow();
		} else {
			const onConsent = () => scheduleShow();
			window.addEventListener(CONSENT_EVENT, onConsent, { once: true });
			return () => {
				window.removeEventListener(CONSENT_EVENT, onConsent);
				if (timer !== undefined) window.clearTimeout(timer);
			};
		}

		return () => {
			if (timer !== undefined) window.clearTimeout(timer);
		};
	}, []);

	useEffect(() => {
		if (!canMount || !active) {
			setView("hidden");
			return;
		}

		if (hasPopupBannerEntryShown()) {
			setView("collapsed");
			return;
		}

		markPopupBannerEntryShown();
		setView("open");
	}, [canMount, active?.id, pathname]);

	const collapse = useCallback(() => {
		markPopupBannerEntryShown();
		setView("collapsed");
	}, []);

	const reopen = useCallback(() => {
		setView("open");
	}, []);

	if (!canMount || !active || view === "hidden") return null;

	return (
		<PopupBanner
			active={active}
			view={view}
			onCollapse={collapse}
			onReopen={reopen}
		/>
	);
}
