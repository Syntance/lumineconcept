"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@magazyn/core/lib/cn";
import { magazynConfig } from "@magazyn/magazyn.config";
import type { ContentPageConfig } from "@magazyn/core/config/types";

const BASE = `${magazynConfig.basePath}/panel/cms`;

type Props = {
	pages: ContentPageConfig[];
};

export function CmsNav({ pages }: Props) {
	const pathname = usePathname();

	return (
		<nav aria-label="Zakładki CMS" className="flex shrink-0 flex-row flex-wrap gap-1 lg:w-52 lg:flex-col">
			<CmsTab href={BASE} label="Globalne" active={pathname === BASE} />
			<CmsTab href={`${BASE}/banery-popup`} label="Banery popup" active={pathname === `${BASE}/banery-popup`} />
			{pages.map((page) => (
				<CmsTab
					key={page.id}
					href={`${BASE}/${page.id}`}
					label={page.label}
					active={pathname === `${BASE}/${page.id}`}
				/>
			))}
		</nav>
	);
}

function CmsTab({ href, label, active }: { href: string; label: string; active: boolean }) {
	return (
		<Link
			href={href}
			aria-current={active ? "page" : undefined}
			className={cn(
				"rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
				active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			{label}
		</Link>
	);
}

export function cmsRevalidatePaths(): string[] {
	const paths = new Set<string>(["/"]);
	for (const page of magazynConfig.content.pages) {
		paths.add(page.path);
	}
	return [...paths];
}
