"use client";

import { Check, Copy } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { cn } from "@magazyn/core/lib/cn";

type Props = {
	value: string;
	className?: string;
};

export function CopyLinkButton({ value, className }: Props) {
	const [copied, setCopied] = useState(false);

	async function handleCopy(event: MouseEvent<HTMLButtonElement>) {
		event.preventDefault();
		event.stopPropagation();

		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	}

	return (
		<button
			type="button"
			onClick={handleCopy}
			aria-label={copied ? "Skopiowano treść" : "Kopiuj treść"}
			title={copied ? "Skopiowano" : "Kopiuj treść"}
			className={cn(
				"inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground",
				"transition-colors hover:bg-muted hover:text-foreground",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				className,
			)}
		>
			{copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
		</button>
	);
}
