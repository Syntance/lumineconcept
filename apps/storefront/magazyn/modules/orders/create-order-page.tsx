import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadAdmin } from "@magazyn/core/auth/load";
import { magazynConfig } from "@magazyn/magazyn.config";
import { getOrderFormOptions } from "./create-order-store";
import { CreateOrderForm } from "./create-order-form";

export const dynamic = "force-dynamic";

export default async function CreateOrderPage() {
	const options = await loadAdmin(getOrderFormOptions);
	const ordersHref = `${magazynConfig.basePath}/panel/zamowienia`;

	return (
		<div className="flex flex-col gap-6">
			<header>
				<Link
					href={ordersHref}
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="size-4" aria-hidden />
					Zamówienia
				</Link>
				<h1 className="mt-2 font-serif text-2xl text-foreground">Nowe zamówienie</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Ręczne zamówienie z Instagramu, maila lub telefonu — trafi na listę jak zamówienie ze sklepu.
				</p>
			</header>

			<CreateOrderForm options={options} />
		</div>
	);
}
