"use client";

import {
	Bell,
	Gift,
	Heart,
	Mail,
	Megaphone,
	Percent,
	Sparkles,
	Star,
	Tag,
	Ticket,
	type LucideIcon,
} from "lucide-react";
import {
	DEFAULT_POPUP_TAB_ICON,
	resolvePopupTabIcon,
	type PopupBannerTabIcon,
} from "@/lib/content/popup-banner-tab-icons";

const ICON_MAP: Record<PopupBannerTabIcon, LucideIcon> = {
	mail: Mail,
	gift: Gift,
	tag: Tag,
	percent: Percent,
	sparkles: Sparkles,
	bell: Bell,
	megaphone: Megaphone,
	star: Star,
	heart: Heart,
	ticket: Ticket,
};

type Props = {
	icon?: PopupBannerTabIcon | string;
	className?: string;
};

export function PopupBannerTabIcon({ icon, className }: Props) {
	const resolved = resolvePopupTabIcon(icon ?? DEFAULT_POPUP_TAB_ICON);
	const Icon = ICON_MAP[resolved];
	return <Icon className={className} aria-hidden />;
}
