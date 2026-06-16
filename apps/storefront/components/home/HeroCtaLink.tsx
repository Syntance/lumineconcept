"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
	forwardRef,
	type AnchorHTMLAttributes,
	type MouseEvent,
	type ReactNode,
} from "react";

import { normalizeHeroCtaHref } from "@/lib/content/cta-href";
import { useAnalytics } from "@/lib/analytics/useAnalytics";

const MOBILE_MAX_QUERY = "(max-width: 1023px)";

function scrollToElementId(id: string): void {
	if (!id) return;
	const el = document.getElementById(id);
	if (!el) return;

	// Mobile: flush do góry kotwicy — bez scroll-padding html i scroll-margin,
	// żeby hero (80svh) zniknęło w całości.
	if (window.matchMedia(MOBILE_MAX_QUERY).matches) {
		const top = el.getBoundingClientRect().top + window.scrollY;
		window.scrollTo({ top, behavior: "smooth" });
		return;
	}

	el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hashFragment(href: string): string {
	if (href.startsWith("#")) return href;
	try {
		return new URL(href, window.location.origin).hash;
	} catch {
		return "";
	}
}

function isSamePageHashLink(href: string): boolean {
	if (href.startsWith("#")) return true;

	try {
		const target = new URL(href, window.location.origin);
		return target.pathname === window.location.pathname && target.hash.length > 1;
	} catch {
		return false;
	}
}

function shouldUseHashScroll(href: string): boolean {
	if (href.startsWith("#")) return true;
	if (typeof window === "undefined") return false;
	return isSamePageHashLink(href);
}

/** href bez #fragment — czysty URL w pasku adresu. */
function hrefWithoutFragment(href: string): string {
	if (!href.includes("#")) return href;
	return href.split("#")[0] || href;
}

type HeroCtaLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
	href: string;
	children?: ReactNode;
};

/**
 * CTA hero — scroll do kotwicy na tej samej stronie bez zmiany URL (#fragment).
 */
export const HeroCtaLink = forwardRef<HTMLAnchorElement, HeroCtaLinkProps>(
	function HeroCtaLink({ href, onClick, children, ...rest }, ref) {
		const { track } = useAnalytics();
		const normalized = normalizeHeroCtaHref(href);
		const pathname = usePathname();
		const searchParams = useSearchParams();
		const query = searchParams.toString();
		const currentPath = query ? `${pathname}?${query}` : pathname;

		const isHashScroll = shouldUseHashScroll(normalized);
		const displayHref = isHashScroll ? currentPath : hrefWithoutFragment(normalized);

		const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
			track("cta_click", {
				cta_label:
					typeof children === "string"
						? children
						: "hero_cta",
				position: "hero",
				target_url: normalized,
			});
			if (isHashScroll) {
				e.preventDefault();
				const fragment = hashFragment(normalized);
				scrollToElementId(fragment.replace(/^#/, ""));
			}
			onClick?.(e);
		};

		return (
			<a ref={ref} href={displayHref} onClick={handleClick} {...rest}>
				{children}
			</a>
		);
	},
);
