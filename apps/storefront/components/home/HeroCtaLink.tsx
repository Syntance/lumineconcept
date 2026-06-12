"use client";

import {
	forwardRef,
	type AnchorHTMLAttributes,
	type MouseEvent,
	type ReactNode,
} from "react";

import { normalizeHeroCtaHref } from "@/lib/content/cta-href";

function scrollToHash(fragment: string): void {
	const id = fragment.replace(/^#/, "");
	if (!id) return;

	const el = document.getElementById(id);
	if (el) {
		el.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	const path = window.location.pathname + window.location.search;
	history.replaceState(null, "", `${path}#${id}`);
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

type HeroCtaLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
	href: string;
	children?: ReactNode;
};

/**
 * CTA hero — scroll do kotwicy na tej samej stronie (bez Next Link),
 * żeby nie doklejać #fragment#fragment przy kolejnych klikach.
 */
export const HeroCtaLink = forwardRef<HTMLAnchorElement, HeroCtaLinkProps>(
	function HeroCtaLink({ href, onClick, children, ...rest }, ref) {
		const normalized = normalizeHeroCtaHref(href);

		const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
			if (shouldUseHashScroll(normalized)) {
				e.preventDefault();
				const fragment = normalized.startsWith("#")
					? normalized
					: new URL(normalized, window.location.origin).hash;
				scrollToHash(fragment);
			}
			onClick?.(e);
		};

		return (
			<a ref={ref} href={normalized} onClick={handleClick} {...rest}>
				{children}
			</a>
		);
	},
);
