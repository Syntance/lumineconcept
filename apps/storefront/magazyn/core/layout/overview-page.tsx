import Link from "next/link";
import { magazynConfig } from "../../magazyn.config";
import { buildNavItems } from "./nav-items";

/**
 * Prosty pulpit panelu (kafle do włączonych modułów).
 * Re-eksportuj w `app{basePath}/(panel)/page.tsx`:
 *   export { default } from "@magazyn/core/layout/overview-page";
 */
export default function OverviewPage() {
	const tiles = buildNavItems().filter((item) => item.href !== magazynConfig.basePath);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="font-serif text-2xl text-foreground">Przegląd</h1>
				<p className="mt-1 text-sm text-muted-foreground">Wybierz moduł, którym chcesz zarządzać.</p>
			</header>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{tiles.map(({ href, label, icon: Icon }) => (
					<Link
						key={href}
						href={href}
						className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					>
						<span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
							<Icon className="size-5" aria-hidden />
						</span>
						<span className="font-serif text-lg text-foreground">{label}</span>
					</Link>
				))}
			</div>
		</div>
	);
}
