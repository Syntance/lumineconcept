"use client";

import {
	buildTransferTitle,
	formatIbanDisplay,
	getBankTransferDetails,
} from "@/lib/payment/bank-transfer";
import { formatPrice } from "@/lib/utils";

type Props = {
	displayId?: string;
	/** Kwota w PLN (dziesiętna). */
	amount?: number;
	/** Podgląd w checkout (bez nagłówka potwierdzenia zamówienia). */
	variant?: "confirmation" | "checkout";
};

export function BankTransferInstructions({
	displayId,
	amount,
	variant = "confirmation",
}: Props) {
	const { recipientName, iban, swift, addressLine1, addressLine2, paymentDays } =
		getBankTransferDetails();
	const formattedIban = formatIbanDisplay(iban);
	const title = displayId ? buildTransferTitle(displayId) : null;
	const amountLabel =
		amount != null && Number.isFinite(amount) ? formatPrice(amount) : null;
	const isCheckout = variant === "checkout";

	return (
		<div
			className={
				isCheckout
					? "rounded-none border border-brand-100 bg-brand-50/50 p-4 text-left"
					: "mx-auto mt-8 max-w-lg rounded-none border border-brand-200 bg-brand-50/80 p-6 text-left shadow-sm"
			}
		>
			<h2
				className={
					isCheckout
						? "text-sm font-semibold text-brand-800"
						: "font-display text-lg font-semibold text-brand-900"
				}
			>
				Dane do przelewu
			</h2>
			<p className="mt-2 text-sm text-brand-700">
				{isCheckout
					? "Po złożeniu zamówienia opłać przelewem w ciągu"
					: "Opłać zamówienie w ciągu"}{" "}
				<span className="font-semibold">{paymentDays} dni roboczych</span>.
				{isCheckout
					? " Realizacja zacznie się po zaksięgowaniu wpłaty."
					: " Po zaksięgowaniu wpłaty wyślemy potwierdzenie e-mailem i rozpoczniemy realizację."}
			</p>

			<dl className="mt-4 space-y-3 text-sm">
				<div>
					<dt className="text-brand-500">Odbiorca</dt>
					<dd className="font-medium text-brand-900">{recipientName}</dd>
				</div>
				<div>
					<dt className="text-brand-500">Adres</dt>
					<dd className="text-brand-900">
						{addressLine1}
						<br />
						{addressLine2}
					</dd>
				</div>
				<div>
					<dt className="text-brand-500">Numer konta (IBAN)</dt>
					<dd className="font-mono text-base font-semibold tracking-wide text-brand-900">
						{formattedIban !== "—" ? (
							formattedIban
						) : (
							<span className="font-sans text-sm font-normal text-brand-600">
								Numer konta skonfigurujemy wkrótce — napisz na kontakt@lumineconcept.pl
							</span>
						)}
					</dd>
				</div>
				<div>
					<dt className="text-brand-500">SWIFT / BIC</dt>
					<dd className="font-mono font-semibold tracking-wide text-brand-900">{swift}</dd>
				</div>
				{title ? (
					<div>
						<dt className="text-brand-500">Tytuł przelewu</dt>
						<dd className="font-medium text-brand-900">{title}</dd>
					</div>
				) : null}
				{amountLabel ? (
					<div>
						<dt className="text-brand-500">Kwota</dt>
						<dd className="text-lg font-semibold tabular-nums text-brand-900">{amountLabel}</dd>
					</div>
				) : null}
			</dl>
		</div>
	);
}
