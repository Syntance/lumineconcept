"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

export function HeaderLogoLink() {
	const pathname = usePathname();
	const isHome = pathname === "/";

	const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
		if (!isHome) return;

		event.preventDefault();
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<Link
			href="/"
			onClick={handleClick}
			className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
		>
			<Image
				src="/images/logo.png"
				alt="Lumine Concept"
				width={204}
				height={46}
				className="h-[46.2px] w-auto"
				loading="eager"
				fetchPriority="low"
			/>
		</Link>
	);
}
