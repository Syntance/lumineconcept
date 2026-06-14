// app/magazyn/(panel)/layout.tsx
import dynamic from "next/dynamic";
import type { ReactNode } from "react";

/** Duże assety CMS (hero) — upload przez Server Actions do R2. */
export const maxDuration = 120;

const PanelShell = dynamic(
	() => import("@magazyn/core/layout/panel-shell").then((m) => ({ default: m.PanelShell })),
	{
		ssr: false,
		loading: () => (
			<div className="flex min-h-screen items-center justify-center text-muted-foreground">
				Ładowanie panelu...
			</div>
		),
	},
);

export default function PanelLayout({ children }: { children: ReactNode }) {
	return <PanelShell>{children}</PanelShell>;
}
