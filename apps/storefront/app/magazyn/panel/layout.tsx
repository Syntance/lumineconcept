// app/magazyn/(panel)/layout.tsx
import type { ReactNode } from "react";
import { PanelShell } from "@magazyn/core/layout/panel-shell";

/** Duże assety CMS (hero) — upload przez Server Actions do R2. */
export const maxDuration = 120;

export default function PanelLayout({ children }: { children: ReactNode }) {
	return <PanelShell>{children}</PanelShell>;
}
