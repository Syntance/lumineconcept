"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type AutoGrowTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
	minRows?: number;
};

export function AutoGrowTextarea({
	minRows = 1,
	value,
	onChange,
	className,
	rows,
	...props
}: AutoGrowTextareaProps) {
	const ref = useRef<HTMLTextAreaElement>(null);

	const adjustHeight = useCallback(() => {
		const el = ref.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	}, []);

	useLayoutEffect(() => {
		adjustHeight();
	}, [value, adjustHeight]);

	return (
		<textarea
			ref={ref}
			rows={rows ?? minRows}
			value={value}
			onChange={(event) => {
				onChange?.(event);
				requestAnimationFrame(adjustHeight);
			}}
			className={cn("resize-none overflow-hidden", className)}
			{...props}
		/>
	);
}
