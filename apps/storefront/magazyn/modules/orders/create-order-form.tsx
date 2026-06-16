"use client";

import { Loader2, Plus, Save, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { Button } from "@magazyn/core/ui/button";
import { Input } from "@magazyn/core/ui/input";
import { cn } from "@magazyn/core/lib/cn";
import { formatPrice } from "@magazyn/core/lib/format";
import { magazynConfig } from "@magazyn/magazyn.config";
import {
	createManualOrderAction,
	getManualOrderProductConfigAction,
	searchOrderProductsAction,
} from "./create-order-actions";
import type { ManualOrderProductConfig, OrderFormOptions, OrderFormProductOption } from "./create-order-types";
import { ManualOrderLineConfigurator } from "./manual-order-line-configurator";

type Props = {
	options: OrderFormOptions;
};

type LineItem = {
	lineId: string;
	productId: string;
	variantId: string;
	productTitle: string;
	unitPriceMinor: number | null;
	quantity: number;
	metadata: Record<string, string>;
	configSummary: string;
	lineNote?: string;
};

const inputClass =
	"w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const SOURCE_OPTIONS = [
	{ value: "instagram", label: "Instagram" },
	{ value: "email", label: "E-mail" },
	{ value: "telefon", label: "Telefon" },
	{ value: "inne", label: "Inne" },
] as const;

export function CreateOrderForm({ options }: Props) {
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const [sourceChannel, setSourceChannel] = useState<(typeof SOURCE_OPTIONS)[number]["value"]>("instagram");
	const [email, setEmail] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [phone, setPhone] = useState("");
	const [address1, setAddress1] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [city, setCity] = useState("");
	const [companyName, setCompanyName] = useState("");
	const [nip, setNip] = useState("");
	const [orderNotes, setOrderNotes] = useState("");
	const [shippingOptionId, setShippingOptionId] = useState(options.shippingOptions[0]?.id ?? "");
	const [invoiceRequested, setInvoiceRequested] = useState(false);
	const [sendConfirmationEmail, setSendConfirmationEmail] = useState(false);

	const [productQuery, setProductQuery] = useState("");
	const [productResults, setProductResults] = useState<OrderFormProductOption[]>(options.initialProducts);
	const [searchingProducts, setSearchingProducts] = useState(false);
	const [lines, setLines] = useState<LineItem[]>([]);

	const [configuratorOpen, setConfiguratorOpen] = useState(false);
	const [pendingProduct, setPendingProduct] = useState<OrderFormProductOption | null>(null);
	const [productConfig, setProductConfig] = useState<ManualOrderProductConfig | null>(null);
	const [configLoading, setConfigLoading] = useState(false);
	const [configLoadError, setConfigLoadError] = useState<string | null>(null);

	useEffect(() => {
		const query = productQuery.trim();
		if (query.length < 2) {
			setProductResults(options.initialProducts);
			return;
		}

		const timer = window.setTimeout(() => {
			setSearchingProducts(true);
			void searchOrderProductsAction(query)
				.then(setProductResults)
				.catch(() => setProductResults([]))
				.finally(() => setSearchingProducts(false));
		}, 300);

		return () => window.clearTimeout(timer);
	}, [productQuery, options.initialProducts]);

	const selectedShipping = useMemo(
		() => options.shippingOptions.find((option) => option.id === shippingOptionId) ?? null,
		[options.shippingOptions, shippingOptionId],
	);

	const itemsTotalMinor = useMemo(
		() =>
			lines.reduce((sum, line) => sum + (line.unitPriceMinor ?? 0) * line.quantity, 0),
		[lines],
	);

	const orderTotalMinor = itemsTotalMinor + (selectedShipping?.amountMinor ?? 0);

	function openProductConfigurator(product: OrderFormProductOption) {
		setPendingProduct(product);
		setProductConfig(null);
		setConfigLoadError(null);
		setConfiguratorOpen(true);
		setConfigLoading(true);

		void getManualOrderProductConfigAction(product.productId)
			.then((config) => {
				if (!config) {
					setConfigLoadError("Nie udało się wczytać konfiguracji produktu.");
					return;
				}
				setProductConfig(config);
			})
			.catch(() => setConfigLoadError("Nie udało się wczytać konfiguracji produktu."))
			.finally(() => setConfigLoading(false));
	}

	function closeProductConfigurator() {
		setConfiguratorOpen(false);
		setPendingProduct(null);
		setProductConfig(null);
		setConfigLoadError(null);
		setConfigLoading(false);
	}

	function confirmConfiguredProduct(payload: {
		metadata: Record<string, string>;
		summary: string;
		lineNote?: string;
	}) {
		if (!pendingProduct) return;

		setLines((current) => [
			...current,
			{
				lineId: crypto.randomUUID(),
				productId: pendingProduct.productId,
				variantId: pendingProduct.variantId,
				productTitle: pendingProduct.title,
				unitPriceMinor: pendingProduct.priceMinor,
				quantity: 1,
				metadata: payload.metadata,
				configSummary: payload.summary,
				lineNote: payload.lineNote,
			},
		]);
		closeProductConfigurator();
	}

	function updateLineQuantity(lineId: string, quantity: number) {
		setLines((current) =>
			current.map((line) =>
				line.lineId === lineId ? { ...line, quantity: Math.max(1, quantity) } : line,
			),
		);
	}

	function removeLine(lineId: string) {
		setLines((current) => current.filter((line) => line.lineId !== lineId));
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		startTransition(async () => {
			const result = await createManualOrderAction({
				email,
				firstName,
				lastName,
				phone: phone.trim() || undefined,
				address1,
				postalCode,
				city,
				companyName: companyName.trim() || undefined,
				nip: nip.trim() || undefined,
				orderNotes: orderNotes.trim() || undefined,
				sourceChannel,
				shippingOptionId,
				items: lines.map((line) => ({
					variantId: line.variantId,
					productTitle: line.productTitle,
					quantity: line.quantity,
					metadata: line.metadata,
				})),
				sendConfirmationEmail,
				invoiceRequested,
			});

			if (!result.ok && result.error) {
				setError(result.error);
			}
		});
	}

	return (
		<>
		<form onSubmit={handleSubmit} className="flex flex-col gap-6">
			<section className="rounded-xl border border-border bg-card p-5">
				<h2 className="font-serif text-lg text-foreground">Źródło i klient</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Zamówienia spoza sklepu — IG, mail, telefon. Płatność domyślnie: przelew tradycyjny.
				</p>
				<div className="mt-4 grid gap-3 sm:grid-cols-2">
					<label className="flex flex-col gap-1.5 text-sm">
						<span className="font-medium">Skąd przyszło zamówienie</span>
						<select
							value={sourceChannel}
							onChange={(event) => setSourceChannel(event.target.value as typeof sourceChannel)}
							className={inputClass}
						>
							{SOURCE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
					<label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
						<span className="font-medium">E-mail klienta</span>
						<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
					</label>
					<label className="flex flex-col gap-1.5 text-sm">
						<span className="font-medium">Imię</span>
						<Input value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
					</label>
					<label className="flex flex-col gap-1.5 text-sm">
						<span className="font-medium">Nazwisko</span>
						<Input value={lastName} onChange={(event) => setLastName(event.target.value)} required />
					</label>
					<label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
						<span className="font-medium">Telefon</span>
						<Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+48 …" />
					</label>
				</div>
			</section>

			<section className="rounded-xl border border-border bg-card p-5">
				<h2 className="font-serif text-lg text-foreground">Adres dostawy</h2>
				<div className="mt-4 grid gap-3 sm:grid-cols-2">
					<label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
						<span className="font-medium">Ulica i numer</span>
						<Input value={address1} onChange={(event) => setAddress1(event.target.value)} required />
					</label>
					<label className="flex flex-col gap-1.5 text-sm">
						<span className="font-medium">Kod pocztowy</span>
						<Input
							value={postalCode}
							onChange={(event) => setPostalCode(event.target.value)}
							placeholder="00-000"
							required
						/>
					</label>
					<label className="flex flex-col gap-1.5 text-sm">
						<span className="font-medium">Miasto</span>
						<Input value={city} onChange={(event) => setCity(event.target.value)} required />
					</label>
				</div>
			</section>

			<section className="rounded-xl border border-border bg-card p-5">
				<h2 className="font-serif text-lg text-foreground">Pozycje</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Wyszukaj produkt i uzupełnij konfigurację — kolory, tekst, pliki i uwagi — przed dodaniem pozycji.
				</p>
				<div className="mt-4 flex flex-col gap-3">
					<div className="relative">
						<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
						<Input
							value={productQuery}
							onChange={(event) => setProductQuery(event.target.value)}
							placeholder="Szukaj produktu po nazwie…"
							className="pl-9"
						/>
					</div>

					<div className="max-h-56 overflow-y-auto rounded-lg border border-border">
						{searchingProducts ? (
							<p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
								<Loader2 className="size-4 animate-spin" aria-hidden />
								Szukam produktów…
							</p>
						) : productResults.length === 0 ? (
							<p className="px-3 py-4 text-sm text-muted-foreground">Brak opublikowanych produktów.</p>
						) : (
							<ul className="divide-y divide-border">
								{productResults.map((product) => (
									<li key={product.variantId}>
										<button
											type="button"
											onClick={() => openProductConfigurator(product)}
											className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
										>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-sm font-medium text-foreground">{product.title}</span>
												<span className="block text-xs text-muted-foreground">
													{product.priceMinor != null
														? formatPrice(product.priceMinor, magazynConfig.currency.toUpperCase())
														: "Brak ceny PLN"}
												</span>
											</span>
											<Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
										</button>
									</li>
								))}
							</ul>
						)}
					</div>

					{lines.length === 0 ? (
						<p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
							Dodaj produkty z listy powyżej.
						</p>
					) : (
						<div className="overflow-x-auto rounded-lg border border-border">
							<table className="w-full border-collapse text-left text-sm">
								<thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
									<tr>
										<th className="px-3 py-2 font-medium">Produkt</th>
										<th className="px-3 py-2 font-medium">Ilość</th>
										<th className="px-3 py-2 font-medium">Cena</th>
										<th className="px-3 py-2 font-medium">Suma</th>
										<th className="px-3 py-2" />
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{lines.map((line) => (
										<tr key={line.lineId}>
											<td className="px-3 py-2">
												<p className="font-medium text-foreground">{line.productTitle}</p>
												<p className="mt-0.5 text-xs text-muted-foreground">{line.configSummary}</p>
											</td>
											<td className="px-3 py-2">
												<Input
													type="number"
													min={1}
													max={999}
													value={line.quantity}
													onChange={(event) =>
														updateLineQuantity(line.lineId, Number.parseInt(event.target.value, 10) || 1)
													}
													className="h-8 w-20"
												/>
											</td>
											<td className="px-3 py-2 text-muted-foreground">
												{line.unitPriceMinor != null
													? formatPrice(line.unitPriceMinor, magazynConfig.currency.toUpperCase())
													: "—"}
											</td>
											<td className="px-3 py-2 text-foreground">
												{line.unitPriceMinor != null
													? formatPrice(line.unitPriceMinor * line.quantity, magazynConfig.currency.toUpperCase())
													: "—"}
											</td>
											<td className="px-3 py-2 text-right">
												<button
													type="button"
													onClick={() => removeLine(line.lineId)}
													className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
													aria-label={`Usuń ${line.productTitle}`}
												>
													<Trash2 className="size-4" aria-hidden />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</section>

			<section className="rounded-xl border border-border bg-card p-5">
				<h2 className="font-serif text-lg text-foreground">Dostawa, faktura i uwagi</h2>
				<div className="mt-4 grid gap-3">
					<label className="flex flex-col gap-1.5 text-sm">
						<span className="font-medium">Metoda dostawy</span>
						<select
							value={shippingOptionId}
							onChange={(event) => setShippingOptionId(event.target.value)}
							className={inputClass}
							required
						>
							{options.shippingOptions.length === 0 ? (
								<option value="">Brak metod dostawy w Medusie</option>
							) : (
								options.shippingOptions.map((option) => (
									<option key={option.id} value={option.id}>
										{option.name} — {formatPrice(option.amountMinor, magazynConfig.currency.toUpperCase())}
									</option>
								))
							)}
						</select>
					</label>

					<label className="inline-flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={invoiceRequested}
							onChange={(event) => setInvoiceRequested(event.target.checked)}
							className="size-4 rounded border-border accent-primary"
						/>
						Faktura VAT
					</label>

					{invoiceRequested ? (
						<div className="grid gap-3 sm:grid-cols-2">
							<label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
								<span className="font-medium">Nazwa firmy</span>
								<Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
							</label>
							<label className="flex flex-col gap-1.5 text-sm">
								<span className="font-medium">NIP</span>
								<Input value={nip} onChange={(event) => setNip(event.target.value)} placeholder="0000000000" />
							</label>
						</div>
					) : null}

					<label className="flex flex-col gap-1.5 text-sm">
						<span className="font-medium">Uwagi do zamówienia</span>
						<textarea
							value={orderNotes}
							onChange={(event) => setOrderNotes(event.target.value)}
							rows={3}
							className={inputClass}
							placeholder="Personalizacja, termin, ustalenia z klientem…"
						/>
					</label>

					<label className="inline-flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={sendConfirmationEmail}
							onChange={(event) => setSendConfirmationEmail(event.target.checked)}
							className="size-4 rounded border-border accent-primary"
						/>
						Wyślij klientowi mail potwierdzenia (domyślnie wyłączone)
					</label>
				</div>
			</section>

			<div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
				<div className="text-sm">
					<p className="text-muted-foreground">
						Produkty: {formatPrice(itemsTotalMinor, magazynConfig.currency.toUpperCase())}
						{selectedShipping ? (
							<>
								{" "}
								· Dostawa: {formatPrice(selectedShipping.amountMinor, magazynConfig.currency.toUpperCase())}
							</>
						) : null}
					</p>
					<p className="mt-1 text-base font-semibold text-foreground">
						Razem: {formatPrice(orderTotalMinor, magazynConfig.currency.toUpperCase())}
					</p>
				</div>
				<Button type="submit" size="lg" disabled={pending || lines.length === 0 || !shippingOptionId} className="gap-2">
					{pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
					Utwórz zamówienie
				</Button>
			</div>

			{error ? <p className={cn("text-sm text-destructive")}>{error}</p> : null}
		</form>

		<ManualOrderLineConfigurator
			open={configuratorOpen}
			config={productConfig}
			loading={configLoading}
			loadError={configLoadError}
			onClose={closeProductConfigurator}
			onConfirm={confirmConfiguredProduct}
		/>
		</>
	);
}
