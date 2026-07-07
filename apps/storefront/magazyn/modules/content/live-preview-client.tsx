"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { magazynConfig } from "@magazyn/magazyn.config";
import type { ContentPageConfig } from "@magazyn/core/config/types";
import type { PageContent } from "@/lib/content/types";
import {
	CMS_PREVIEW_RELOAD,
	CMS_PREVIEW_SELECT,
} from "@/lib/cms-preview/messages";
import { PageContentEditor } from "./page-content-editor";
import type { CmsProductOption } from "./product-options";

type Props = {
	page: ContentPageConfig;
	initial: PageContent;
	productOptions: CmsProductOption[];
};

/**
 * „Edycja na żywo": iframe strony (draftMode przez /api/cms-preview/enable)
 * + edytor treści obok. Klik elementu na stronie → scroll i podświetlenie
 * odpowiadającego bloku edytora; zapis → reload iframe'a (draft czyta
 * metadata bez cache, więc zmiana jest widoczna natychmiast).
 */
export function LivePreviewClient({ page, initial, productOptions }: Props) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const editorColumnRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function onMessage(e: MessageEvent) {
			if (e.origin !== window.location.origin) return;
			const data = e.data as { type?: string; field?: string } | null;
			if (data?.type !== CMS_PREVIEW_SELECT || !data.field) return;

			const column = editorColumnRef.current;
			if (!column) return;

			// Dokładne dopasowanie, potem coraz krótsze prefiksy ścieżki
			// (klik w page.home.hero.headline trafi w kotwicę page.home.hero).
			const segments = data.field.split(".");
			let target: HTMLElement | null = null;
			for (let len = segments.length; len >= 2 && !target; len--) {
				const selector = `[data-cms-input="${segments.slice(0, len).join(".")}"]`;
				target = column.querySelector<HTMLElement>(selector);
			}
			if (!target) return;

			target.scrollIntoView({ behavior: "smooth", block: "center" });
			target.classList.add(
				"ring-3",
				"ring-amber-400",
				"rounded-xl",
				"transition-shadow",
			);
			window.setTimeout(() => {
				target?.classList.remove("ring-3", "ring-amber-400");
			}, 1600);

			const input = target.querySelector<HTMLElement>("input, textarea");
			input?.focus({ preventScroll: true });
		}

		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, []);

	function reloadPreview() {
		iframeRef.current?.contentWindow?.postMessage(
			{ type: CMS_PREVIEW_RELOAD },
			window.location.origin,
		);
	}

	const previewSrc = `/api/cms-preview/enable?path=${encodeURIComponent(page.path)}`;

	return (
		<div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="font-serif text-2xl text-foreground">
						Edycja na żywo — {page.label}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Kliknij element na stronie, aby przejść do jego pola. Zapis odświeża
						podgląd natychmiast.
					</p>
				</div>
				<Link
					href={`${magazynConfig.basePath}/panel/cms/${page.id}`}
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="size-4" aria-hidden />
					Klasyczny edytor
				</Link>
			</header>

			<div className="flex min-h-0 flex-1 gap-4">
				<div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-muted/30">
					<iframe
						ref={iframeRef}
						src={previewSrc}
						title={`Podgląd — ${page.label}`}
						className="h-full w-full"
					/>
				</div>

				<div
					ref={editorColumnRef}
					className="w-[380px] shrink-0 overflow-y-auto rounded-xl border border-border bg-card p-4"
				>
					<PageContentEditor
						pageId={page.id}
						path={page.path}
						blocks={page.blocks}
						initial={initial}
						productOptions={productOptions}
						onSaved={reloadPreview}
					/>
				</div>
			</div>
		</div>
	);
}
