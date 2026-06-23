import { loadAdmin } from "@magazyn/core/auth/load";
import { listShippingOptionsAdmin } from "./store";
import { ShippingManager } from "./shipping-manager";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
	const options = await loadAdmin(() => listShippingOptionsAdmin());

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="font-serif text-2xl text-foreground">Metody dostawy</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Edytuj nazwy, ceny i opisy metod wysyłki z Medusy. Wyłączona metoda nie pojawi się klientom w checkoutcie.
				</p>
			</header>

			<ShippingManager options={options} />
		</div>
	);
}
