import "server-only";

import { formatPrice } from "@magazyn/core/lib/format";
import { magazynConfig } from "@magazyn/magazyn.config";
import {
	getAdminOrderForEmail,
	orderToEmailSource,
} from "@magazyn/modules/orders/store";
import { sendBankTransferPendingEmail } from "@magazyn/modules/emails/send-bank-transfer-email";
import { sendOrderStageEmail } from "@magazyn/modules/emails/send-order-email";
import type { OrderRenderSource } from "@magazyn/modules/emails/render-template";
import type { OrderEmailTemplateType } from "@magazyn/modules/emails/template-types";
import { sendTransactionalEmail, type SendEmailResult } from "@magazyn/modules/emails/send-transactional";

const RETRY_DELAYS_MS = [0, 400, 800, 1200, 2000];
const EMAIL_SENT_PREFIX = "email_sent_";

/** Klucze metadata zgodne z backendem (`order-email-dispatch`). */
const EMAIL_SENT_CONTEXT: Partial<Record<OrderEmailTemplateType, string>> = {
	bank_transfer_pending: "bank-transfer-pending",
	placed: "order-placed",
	shipped: "order-shipped",
	cancelled: "order-canceled",
};

export type CheckoutOrderSnapshot = {
	email: string;
	displayId: number;
	total: number;
	itemTotal?: number;
	shippingTotal?: number;
	currencyCode?: string;
	customerName?: string;
	address?: string;
	phone?: string;
	shippingMethodName?: string | null;
	items?: Array<{
		title: string;
		quantity: number;
		total: number;
		thumbnail?: string | null;
	}>;
};

function emailSentContext(type: OrderEmailTemplateType): string {
	return EMAIL_SENT_CONTEXT[type] ?? type;
}

function wasEmailSent(metadata: Record<string, string>, type: OrderEmailTemplateType): boolean {
	return Boolean(metadata[`${EMAIL_SENT_PREFIX}${emailSentContext(type)}`]?.trim());
}

function shopInbox(): string {
	return (
		process.env.SHOP_ORDER_NOTIFY_EMAIL?.replace(/\r\n/g, "").trim() ??
		process.env.CONTACT_INBOX_EMAIL?.replace(/\r\n/g, "").trim() ??
		magazynConfig.email.contactEmail
	);
}

async function loadOrderSource(
	orderId: string,
	snapshot?: CheckoutOrderSnapshot,
): Promise<OrderRenderSource | null> {
	for (const delayMs of RETRY_DELAYS_MS) {
		if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
		const order = await getAdminOrderForEmail(orderId).catch(() => null);
		if (order) return orderToEmailSource(order);
	}

	if (!snapshot?.email || !snapshot.displayId) return null;

	const currency = (snapshot.currencyCode ?? "PLN").toUpperCase();
	return {
		displayId: snapshot.displayId,
		email: snapshot.email.trim(),
		phone: snapshot.phone ?? "",
		currencyCode: currency,
		total: snapshot.total,
		itemTotal: snapshot.itemTotal ?? snapshot.total,
		shippingTotal: snapshot.shippingTotal ?? 0,
		shippingMethodName: snapshot.shippingMethodName ?? null,
		customerName:
			snapshot.customerName?.trim() || snapshot.email.split("@")[0] || "Kliencie",
		address: snapshot.address ?? "",
		items: (snapshot.items ?? []).map((item) => ({
			title: item.title,
			quantity: item.quantity,
			total: formatPrice(item.total, currency),
			thumbnail: item.thumbnail ?? null,
		})),
	};
}

async function sendShopCopy(params: {
	displayId: number;
	email: string;
	totalMinor: number;
	currencyCode: string;
	paymentLabel: string;
}): Promise<void> {
	const inbox = shopInbox();
	if (!inbox) return;

	const totalLabel = formatPrice(params.totalMinor, params.currencyCode);
	await sendTransactionalEmail({
		to: inbox,
		subject: `Nowe zamówienie #${params.displayId} — ${totalLabel}`,
		text: `Nowe zamówienie #${params.displayId}\nKlient: ${params.email}\nPłatność: ${params.paymentLabel}\nKwota: ${totalLabel}`,
		html: `<p>Nowe zamówienie <strong>#${params.displayId}</strong></p><p>Klient: ${params.email}<br/>Płatność: ${params.paymentLabel}<br/>Kwota: ${totalLabel}</p>`,
	}).catch(() => undefined);
}

export type MagazynOrderEmailResult =
	| { ok: true; skipped?: boolean; email: string; source: "magazyn" }
	| { ok: false; step: string; message?: string };

/**
 * Wysyła mail zamówieniowy szablonem z magazynu (store.metadata.email_templates
 * lub domyślny z edytora /magazyn/panel/maile).
 */
export async function dispatchMagazynOrderEmail(params: {
	orderId: string;
	type: OrderEmailTemplateType;
	snapshot?: CheckoutOrderSnapshot;
	skipShopCopy?: boolean;
}): Promise<MagazynOrderEmailResult> {
	const order = await getAdminOrderForEmail(params.orderId).catch(() => null);
	if (order && wasEmailSent(order.metadata, params.type)) {
		return { ok: true, skipped: true, email: order.email, source: "magazyn" };
	}

	const source = await loadOrderSource(params.orderId, params.snapshot);
	if (!source?.email) {
		return { ok: false, step: "no-order-source" };
	}

	let result: SendEmailResult;
	if (params.type === "bank_transfer_pending") {
		result = await sendBankTransferPendingEmail(source);
	} else {
		result = await sendOrderStageEmail(params.type, source);
	}

	if (!result.ok) {
		return { ok: false, step: "resend", message: result.message };
	}
	if (result.skipped) {
		return { ok: true, skipped: true, email: source.email, source: "magazyn" };
	}

	if (!params.skipShopCopy) {
		const paymentLabel =
			params.type === "bank_transfer_pending" ? "Przelew tradycyjny" : "Online";
		void sendShopCopy({
			displayId: source.displayId,
			email: source.email,
			totalMinor: source.total,
			currencyCode: source.currencyCode,
			paymentLabel,
		});
	}

	return { ok: true, email: source.email, source: "magazyn" };
}
