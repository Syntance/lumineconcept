"use client";

import dynamic from "next/dynamic";
import type { PopupBannerDisplay } from "@/lib/content/popup-banners";
import type { PopupBanner } from "@/lib/content/types";

const PopupBanner = dynamic(
	() => import("./PopupBanner").then((mod) => mod.PopupBanner),
	{ ssr: false },
);

type Props = {
	banners: PopupBannerDisplay[];
	rawItems: PopupBanner[];
};

/** Lazy client boundary — `ssr: false` tylko tutaj (Next.js 16). */
export function PopupBannerClient(props: Props) {
	return <PopupBanner {...props} />;
}
