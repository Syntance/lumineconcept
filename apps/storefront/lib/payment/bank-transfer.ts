import { magazynConfig } from "@magazyn/magazyn.config";

/** Dane do przelewu tradycyjnego — publiczne, edytowalne w magazyn.config.ts lub ENV. */
export type BankTransferDetails = {
	recipientName: string;
	iban: string;
	paymentDays: number;
};

const ENV_IBAN = process.env.NEXT_PUBLIC_BANK_TRANSFER_IBAN?.replace(/\s+/g, "") ?? "";

export function getBankTransferDetails(): BankTransferDetails {
	const cfg = magazynConfig.bankTransfer;
	return {
		recipientName: cfg.recipientName,
		iban: ENV_IBAN || cfg.iban.replace(/\s+/g, ""),
		paymentDays: cfg.paymentDays,
	};
}

/** IBAN czytelny w UI (grupy po 4 znaki). */
export function formatIbanDisplay(iban: string): string {
	const compact = iban.replace(/\s+/g, "").toUpperCase();
	if (!compact) return "—";
	return compact.replace(/(.{4})/g, "$1 ").trim();
}

/** Tytuł przelewu widoczny dla klienta. */
export function buildTransferTitle(displayId: number | string): string {
	return `${magazynConfig.bankTransfer.transferTitlePrefix} #${displayId}`;
}

/** Zmienne merge dla maila / podglądu z numerem zamówienia. */
export function bankTransferMergeVars(displayId: number | string): Record<string, string> {
	const { recipientName, iban, paymentDays } = getBankTransferDetails();
	return {
		odbiorca: recipientName,
		nrKonta: formatIbanDisplay(iban),
		tytulPrzelewu: buildTransferTitle(displayId),
		terminPlatnosci: `${paymentDays} dni roboczych`,
	};
}
