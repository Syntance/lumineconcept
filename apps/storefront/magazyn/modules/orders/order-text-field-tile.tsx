"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@magazyn/core/lib/cn";
import { CopyLinkButton } from "./copy-link-button";

const VISIBLE_LINES = 3;

type Props = {
	label: string;
	value: string;
};

export function OrderTextFieldTile({ label, value }: Props) {
	const [expanded, setExpanded] = useState(false);
	const [needsExpand, setNeedsExpand] = useState(false);
	const measureRef = useRef<HTMLParagraphElement>(null);
	useLayoutEffect(() => {
		const el = measureRef.current;
		if (!el) return;

		const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight);
		if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;

		setNeedsExpand(el.scrollHeight > lineHeight * VISIBLE_LINES + 1);
		setExpanded(false);
	}, [value]);

	function toggle() {
		if (!needsExpand) return;
		setExpanded((open) => !open);
	}

	function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (!needsExpand) return;
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			toggle();
		}
	}

	const isCollapsed = needsExpand && !expanded;

	return (
		<div
			role={needsExpand ? "button" : undefined}
			tabIndex={needsExpand ? 0 : undefined}
			aria-expanded={needsExpand ? expanded : undefined}
			onClick={needsExpand ? toggle : undefined}
			onKeyDown={needsExpand ? onKeyDown : undefined}
			className={cn(
				"w-full overflow-hidden rounded-lg border border-border/80 bg-card text-left shadow-sm outline-none",
				needsExpand && "cursor-pointer transition-colors hover:bg-muted/20",
				needsExpand && "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
			)}
		>
			<div className="flex items-center gap-2 px-3 py-2.5">
				<p className="min-w-0 flex-1 truncate text-xs font-semibold tracking-wide text-foreground">{label}</p>
				<CopyLinkButton value={value} />
			</div>

			<div className="relative border-t border-border/50">
				<p
					ref={measureRef}
					aria-hidden
					className="pointer-events-none invisible absolute inset-x-0 top-0 px-3 text-sm leading-relaxed break-words whitespace-pre-wrap"
				>
					{value}
				</p>

				<div
					className={cn(
						"relative z-[1] px-3 transition-[max-height,padding] duration-300 ease-out motion-reduce:transition-none",
						expanded ? "max-h-[min(24rem,70vh)] overflow-y-auto py-3" : "py-2",
					)}
				>
					<p
						className={cn(
							"text-sm leading-relaxed text-foreground break-words whitespace-pre-wrap",
							isCollapsed && "line-clamp-3",
						)}
					>
						{value}
					</p>
				</div>

				{isCollapsed ? (
					<div
						aria-hidden
						className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/10 via-background/45 to-background/90 backdrop-blur-[2px] motion-reduce:backdrop-blur-none"
					/>
				) : expanded ? (
					<div
						aria-hidden
						className="pointer-events-none absolute inset-0 rounded-b-lg border-t border-border/30 bg-muted/25 backdrop-blur-md motion-reduce:backdrop-blur-none"
					/>
				) : null}
			</div>

			{isCollapsed ? (
				<p className="px-3 pb-2 text-[10px] text-muted-foreground">Kliknij, aby rozwinąć treść</p>
			) : null}
		</div>
	);
}
