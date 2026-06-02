"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteProductAction } from "./actions";

export function DeleteProductButton({ id, title }: { id: string; title: string }) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	function onClick() {
		if (!window.confirm(`Usunąć produkt „${title}"? Tej operacji nie można cofnąć.`)) return;
		startTransition(async () => {
			await deleteProductAction(id);
			router.refresh();
		});
	}

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={pending}
			aria-label={`Usuń ${title}`}
			className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-destructive/30 disabled:opacity-50"
		>
			{pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
		</button>
	);
}
