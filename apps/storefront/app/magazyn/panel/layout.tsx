// app/magazyn/(panel)/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PanelShell } from "@magazyn/core/layout/panel-shell";

/** Duże assety CMS (hero) — upload przez Server Actions do R2. */
export const maxDuration = 120;

/**
 * Cały panel poza indeksem. Niezalogowany robot i tak dostaje redirect na
 * `/magazyn`, ale `robots` z layoutu dziedziczą wszystkie podstrony panelu
 * (Next scala metadane po segmentach), więc żadna nie wypadnie z `noindex`
 * przez własne `export const metadata` bez pola `robots`.
 */
export const metadata: Metadata = {
	robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: ReactNode }) {
	return <PanelShell>{children}</PanelShell>;
}
