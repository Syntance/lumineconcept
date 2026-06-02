"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/cn";
import { buildNavItems } from "./nav-items";

const ITEMS = buildNavItems();

export function SidebarNav() {
	const pathname = usePathname();

	return (
		<nav aria-label="Nawigacja panelu" className="flex flex-col gap-1">
			{ITEMS.map(({ href, label, icon: Icon, exact }) => {
				const active = exact ? pathname === href : pathname.startsWith(href);
				return (
					<Link
						key={href}
						href={href}
						aria-current={active ? "page" : undefined}
						className={cn(
							"flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
							active
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
					>
						<Icon className="size-4" aria-hidden />
						{label}
					</Link>
				);
			})}
		</nav>
	);
}
