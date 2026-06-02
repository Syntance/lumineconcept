// app/magazyn/(panel)/layout.tsx
import type { ReactNode } from "react";
import { PanelShell } from "@magazyn/core/layout/panel-shell";

export default function PanelLayout({ children }: { children: ReactNode }) {
	return <PanelShell>{children}</PanelShell>;
}
