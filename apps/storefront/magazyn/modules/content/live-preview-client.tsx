"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";
import Link from "next/link";
import { magazynConfig } from "@magazyn/magazyn.config";
import type { ContentPageConfig } from "@magazyn/core/config/types";
import { cn } from "@magazyn/core/lib/cn";
import type {
	GlobalContent,
	PageContent,
	SiteSettings,
} from "@/lib/content/types";
import type { ThemeTokens } from "@/lib/composer/theme";
import {
	CMS_PREVIEW_RELOAD,
	CMS_PREVIEW_SELECT,
} from "@/lib/cms-preview/messages";
import { PageContentEditor } from "./page-content-editor";
import { GlobalContentEditor } from "./global-content-editor";
import type { CmsProductOption } from "./product-options";

type Device = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTH: Record<Device, number | null> = {
	desktop: null, // pełna szerokość dostępnego obszaru
	tablet: 820,
	mobile: 390,
};

const DEVICE_META: Array<{ id: Device; label: string; icon: typeof Monitor }> = [
	{ id: "desktop", label: "Desktop", icon: Monitor },
	{ id: "tablet", label: "Tablet", icon: Tablet },
	{ id: "mobile", label: "Mobile", icon: Smartphone },
];

type EditorTab = "page" | "global";

type Props = {
	page: ContentPageConfig;
	initial: PageContent;
	siteSettings: SiteSettings;
	globalContent: GlobalContent;
	themeTokens: ThemeTokens;
	productOptions: CmsProductOption[];
};

/**
 * Pełnoekranowa „edycja na żywo": iframe strony (draftMode — świeże treści
 * i nieopublikowane zdjęcia widoczne od razu) + szuflada edytora. Klik
 * elementu na stronie → właściwa zakładka (Strona/Globalne) + scroll i
 * podświetlenie bloku. Zapis → natychmiastowy reload podglądu.
 *
 * Fullscreen przez fixed inset-0 PONAD powłoką panelu — edytor dostaje całą
 * szerokość ekranu, a przełącznik Desktop/Tablet/Mobile steruje realną
 * szerokością viewportu iframe'a (media queries strony działają jak u klienta).
 */
export function LivePreviewClient({
	page,
	initial,
	siteSettings,
	globalContent,
	themeTokens,
	productOptions,
}: Props) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const editorColumnRef = useRef<HTMLDivElement>(null);
	const [device, setDevice] = useState<Device>("desktop");
	const [tab, setTab] = useState<EditorTab>("page");
	const [unmappedNotice, setUnmappedNotice] = useState<string | null>(null);
	const pendingFieldRef = useRef<string | null>(null);

	function scrollToField(field: string) {
		const column = editorColumnRef.current;
		if (!column) return false;
		const segments = field.split(".");
		let target: HTMLElement | null = null;
		for (let len = segments.length; len >= 2 && !target; len--) {
			const selector = `[data-cms-input="${segments.slice(0, len).join(".")}"]`;
			target = column.querySelector<HTMLElement>(selector);
		}
		if (!target) return false;

		target.scrollIntoView({ behavior: "smooth", block: "center" });
		target.classList.add("ring-3", "ring-amber-400", "rounded-xl");
		window.setTimeout(() => {
			target?.classList.remove("ring-3", "ring-amber-400");
		}, 1600);
		target.querySelector<HTMLElement>("input, textarea")?.focus({
			preventScroll: true,
		});
		return true;
	}

	useEffect(() => {
		function onMessage(e: MessageEvent) {
			if (e.origin !== window.location.origin) return;
			const data = e.data as { type?: string; field?: string } | null;
			if (data?.type !== CMS_PREVIEW_SELECT || !data.field) return;

			const wantsGlobal =
				data.field.startsWith("global.") || data.field.startsWith("settings.");
			const targetTab: EditorTab = wantsGlobal ? "global" : "page";

			if (targetTab !== tab) {
				// Edytor docelowej zakładki jeszcze nie jest w DOM — scroll po przełączeniu.
				pendingFieldRef.current = data.field;
				setTab(targetTab);
				return;
			}
			if (!scrollToField(data.field)) {
				setUnmappedNotice(data.field);
				window.setTimeout(() => setUnmappedNotice(null), 3200);
			}
		}

		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [tab]);

	// Po przełączeniu zakładki dokończ nawigację do klikniętego pola.
	useEffect(() => {
		const field = pendingFieldRef.current;
		if (!field) return;
		pendingFieldRef.current = null;
		const t = window.setTimeout(() => scrollToField(field), 80);
		return () => window.clearTimeout(t);
	}, [tab]);

	function reloadPreview() {
		iframeRef.current?.contentWindow?.postMessage(
			{ type: CMS_PREVIEW_RELOAD },
			window.location.origin,
		);
	}

	const previewSrc = `/api/cms-preview/enable?path=${encodeURIComponent(page.path)}`;
	const deviceWidth = DEVICE_WIDTH[device];

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-background">
			{unmappedNotice ? (
				<div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-lg">
					Ten element nie ma jeszcze pola w edytorze ({unmappedNotice})
				</div>
			) : null}
			{/* Pasek narzędzi */}
			<header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-2.5">
				<Link
					href={`${magazynConfig.basePath}/panel/cms/${page.id}`}
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="size-4" aria-hidden />
					Panel
				</Link>
				<span className="font-serif text-lg text-foreground">
					Edycja na żywo — {page.label}
				</span>

				<div className="mx-auto flex items-center gap-1 rounded-lg border border-border p-1">
					{DEVICE_META.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							type="button"
							onClick={() => setDevice(id)}
							aria-pressed={device === id}
							title={label}
							className={cn(
								"inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
								device === id
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
						>
							<Icon className="size-4" aria-hidden />
							<span className="hidden lg:inline">{label}</span>
						</button>
					))}
				</div>

				<button
					type="button"
					onClick={reloadPreview}
					className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<RefreshCw className="size-4" aria-hidden />
					Odśwież
				</button>
			</header>

			<div className="flex min-h-0 flex-1">
				{/* Podgląd */}
				<div className="flex min-w-0 flex-1 items-start justify-center overflow-auto bg-muted/40 p-4">
					<div
						className={cn(
							"h-full overflow-hidden bg-white shadow-lg",
							deviceWidth ? "rounded-xl border border-border" : "w-full rounded-lg",
						)}
						style={deviceWidth ? { width: deviceWidth, maxWidth: "100%" } : undefined}
					>
						<iframe
							ref={iframeRef}
							src={previewSrc}
							title={`Podgląd — ${page.label}`}
							className="h-full w-full"
						/>
					</div>
				</div>

				{/* Szuflada edytora */}
				<div className="flex w-105 shrink-0 flex-col border-l border-border bg-card">
					<div className="flex shrink-0 gap-1 border-b border-border p-2">
						{(
							[
								["page", `Strona: ${page.label}`],
								["global", "Globalne"],
							] as Array<[EditorTab, string]>
						).map(([id, label]) => (
							<button
								key={id}
								type="button"
								onClick={() => setTab(id)}
								aria-pressed={tab === id}
								className={cn(
									"flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
									tab === id
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								{label}
							</button>
						))}
					</div>

					<div ref={editorColumnRef} className="min-h-0 flex-1 overflow-y-auto p-4">
						{tab === "page" ? (
							<PageContentEditor
								pageId={page.id}
								path={page.path}
								blocks={page.blocks}
								initial={initial}
								productOptions={productOptions}
								onSaved={reloadPreview}
							/>
						) : (
							<GlobalContentEditor
								siteSettings={siteSettings}
								globalContent={globalContent}
								themeTokens={themeTokens}
								onSaved={reloadPreview}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
