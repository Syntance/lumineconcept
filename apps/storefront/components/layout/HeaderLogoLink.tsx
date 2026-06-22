"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";

import type { HeroPrefetchBundles } from "@/lib/content/hero-prefetch";
import { prefetchHeroUrls } from "@/components/home/HeroImageCacheWarmer";

type HeaderLogoLinkProps = {
	heroPrefetch: HeroPrefetchBundles;
};

export function HeaderLogoLink({ heroPrefetch }: HeaderLogoLinkProps) {
	const pathname = usePathname();
	const router = useRouter();
	const isHome = pathname === "/";
	const scrollHomeOnArrival = useRef(false);

	useEffect(() => {
		if (pathname !== "/" || !scrollHomeOnArrival.current) return;
		scrollHomeOnArrival.current = false;
		window.scrollTo({ top: 0, behavior: "auto" });
	}, [pathname]);

	const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();

		if (isHome) {
			window.scrollTo({ top: 0, behavior: "smooth" });
			return;
		}

		scrollHomeOnArrival.current = true;
		router.push("/");
	};

	const handlePointerEnter = () => {
		prefetchHeroUrls(heroPrefetch.home.desktop, heroPrefetch.home.mobile);
	};

	return (
		<Link
			href="/"
			onClick={handleClick}
			onPointerEnter={handlePointerEnter}
			aria-label="Strona główna Lumine Concept"
			className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none"
		>
			<Image
				src="/images/logo.png"
				alt=""
				width={204}
				height={46}
				draggable={false}
				className="pointer-events-none h-[46.2px] w-auto select-none"
				loading="eager"
				fetchPriority="low"
			/>
		</Link>
	);
}
