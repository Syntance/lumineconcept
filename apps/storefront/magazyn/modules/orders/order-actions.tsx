"use client";

import { Ban, Check, CreditCard, Package, type LucideIcon, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@magazyn/core/lib/cn";
import { type OrderActionType, runOrderAction } from "./actions";

type ActionDef = {
	type: OrderActionType;
	label: string;
	icon: LucideIcon;
	variant: "primary" | "neutral" | "danger";
	confirm?: string;
	available: boolean;
};

type Props = {
	orderId: string;
	canCapture: boolean;
	/** Opłacone online (P24 itd.) — ten sam przycisk uruchamia realizację bez księgowania. */
	isPaid?: boolean;
	canShip: boolean;
	canComplete: boolean;
	canCancel: boolean;
};

export function OrderActions({ orderId, canCapture, isPaid = false, canShip, canComplete, canCancel }: Props) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [activeAction, setActiveAction] = useState<OrderActionType | null>(null);
	const [pending, startTransition] = useTransition();

	const actions: ActionDef[] = [
		{
			type: "capture",
			label: isPaid ? "Rozpocznij realizację" : "Zaksięguj płatność",
			icon: isPaid ? Package : CreditCard,
			variant: "primary",
			available: canCapture,
		},
		{ type: "ship", label: "Przesyłka wysłana", icon: Truck, variant: "neutral", available: canShip },
		{ type: "complete", label: "Zakończ zamówienie", icon: Check, variant: "neutral", available: canComplete },
		{
			type: "cancel",
			label: "Anuluj zamówienie",
			icon: Ban,
			variant: "danger",
			confirm: "Na pewno anulować to zamówienie? Tej operacji nie można cofnąć.",
			available: canCancel,
		},
	];

	const visible = actions.filter((action) => action.available);

	function run(action: ActionDef) {
		if (action.confirm && !window.confirm(action.confirm)) return;
		setError(null);
		setActiveAction(action.type);
		startTransition(async () => {
			const result = await runOrderAction(orderId, action.type);
			setActiveAction(null);
			if (!result.ok) {
				setError(result.error);
				return;
			}
			router.refresh();
		});
	}

	if (visible.length === 0) {
		return <p className="text-sm text-muted-foreground">Brak dostępnych akcji dla tego statusu zamówienia.</p>;
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-2">
				{visible.map((action) => {
					const Icon = action.icon;
					const busy = pending && activeAction === action.type;
					return (
						<button
							key={action.type}
							type="button"
							onClick={() => run(action)}
							disabled={pending}
							className={cn(
								"inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 disabled:opacity-50",
								action.variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/50",
								action.variant === "neutral" && "border border-border bg-card text-foreground hover:bg-muted focus-visible:ring-ring/50",
								action.variant === "danger" && "border border-destructive/30 text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/30",
							)}
						>
							<Icon className="size-4" aria-hidden />
							{busy ? "Przetwarzanie…" : action.label}
						</button>
					);
				})}
			</div>
			{error ? (
				<p role="alert" className="text-sm text-destructive">{error}</p>
			) : null}
		</div>
	);
}
