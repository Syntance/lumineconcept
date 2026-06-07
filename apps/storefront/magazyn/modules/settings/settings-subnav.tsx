"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@magazyn/core/lib/cn";
import { magazynConfig } from "@magazyn/magazyn.config";

const TABS = [
	{
		href: `${magazynConfig.basePath}/panel/ustawienia/kolory`,
		label: "Kolory globalne produktów",
	},
] as const;

export function SettingsSubnav() {
	const pathname = usePathname();

	return (
		<nav aria-label="Ustawienia sklepu" className="flex flex-wrap gap-2 border-b border-border pb-3">
			{TABS.map(({ href, label }) => {
				const active = pathname === href || pathname.startsWith(`${href}/`);
				return (
					<Link
						key={href}
						href={href}
						aria-current={active ? "page" : undefined}
						className={cn(
							"rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
							active
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
					>
						{label}
					</Link>
				);
			})}
		</nav>
	);
}
