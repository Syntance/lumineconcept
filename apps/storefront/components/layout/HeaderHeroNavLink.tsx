"use client";

import Link from "next/link";

import { prefetchHeroUrls } from "@/components/home/HeroImageCacheWarmer";

type HeaderHeroNavLinkProps = {
	href: string;
	className: string;
	label: string;
	desktopUrls: string[];
	mobileUrls: string[];
};

export function HeaderHeroNavLink({
	href,
	className,
	label,
	desktopUrls,
	mobileUrls,
}: HeaderHeroNavLinkProps) {
	return (
		<Link
			href={href}
			className={className}
			onPointerEnter={() => prefetchHeroUrls(desktopUrls, mobileUrls)}
		>
			{label}
		</Link>
	);
}
