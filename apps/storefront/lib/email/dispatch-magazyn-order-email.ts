import "server-only";

import { serviceAdminFetch } from "@magazyn/core/medusa/client";
import {
	getAdminOrderForEmail,
	orderToEmailSource,
} from "@magazyn/modules/orders/store";
import { sendBankTransferPendingEmail } from "@magazyn/modules/emails/send-bank-transfer-email";
import { sendOrderStageEmail } from "@magazyn/modules/emails/send-order-email";
import { sendShopOrderNotificationEmail } from "@magazyn/modules/emails/send-shop-order-notification";
import type { OrderRenderSource } from "@magazyn/modules/emails/render-template";
import type { OrderEmailTemplateType } from "@magazyn/modules/emails/template-types";
import type { SendEmailResult } from "@magazyn/modules/emails/send-transactional";

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

async function markOrderEmailSentOnServer(
	orderId: string,
	type: OrderEmailTemplateType,
): Promise<void> {
	const order = await getAdminOrderForEmail(orderId).catch(() => null);
	if (!order) return;
	const context = emailSentContext(type);
	const key = `${EMAIL_SENT_PREFIX}${context}`;
	if (order.metadata?.[key]?.trim()) return;

	await serviceAdminFetch(`/admin/orders/${orderId}`, {
		method: "POST",
		body: JSON.stringify({
			metadata: {
				...(order.metadata ?? {}),
				[key]: new Date().toISOString(),
			},
		}),
	}).catch(() => undefined);
}

function wasEmailSent(metadata: Record<string, string>, type: OrderEmailTemplateType): boolean {
	return Boolean(metadata[`${EMAIL_SENT_PREFIX}${emailSentContext(type)}`]?.trim());
}

async function loadOrderSource(
	orderId: string,
	snapshot?: CheckoutOrderSnapshot,
): Promise<OrderRenderSource | null> {
	for (const delayMs of RETRY_DELAYS_MS) {
		if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
		const order = await getAdminOrderForEmail(orderId).catch(() => null);
		if (order) {
			const source = orderToEmailSource(order);
			if (snapshot?.email?.trim() && !source.email?.trim()) {
				source.email = snapshot.email.trim();
			}
			return source;
		}
	}

	/**
	 * SECURITY: gdy zamówienie NIE istnieje w Medusie (po pełnym oknie retry),
	 * NIE budujemy maila z samego snapshotu z body. Snapshot jest wyłącznie
	 * wzbogaceniem realnego zamówienia — traktowanie go jako samodzielnego
	 * źródła pozwalało wysłać firmowy mail (dane do przelewu, potwierdzenie)
	 * na dowolny adres z dowolną kwotą, podając zmyślone `order_id`
	 * (publiczny endpoint bez sesji). Realne, świeże zamówienie i tak zwraca
	 * `getAdminOrderForEmail` w oknie retry; opóźnione domknie subscriber
	 * `order.placed` (in-process) oraz cron reconcile.
	 */
	return null;
}

async function sendShopCopy(
	type: OrderEmailTemplateType,
	source: OrderRenderSource,
	paymentLabel: string,
): Promise<void> {
	await sendShopOrderNotificationEmail(type, source, paymentLabel);
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
		void sendShopCopy(params.type, source, paymentLabel);
	}

	if (!result.skipped) {
		await markOrderEmailSentOnServer(params.orderId, params.type);
	}

	return { ok: true, email: source.email, source: "magazyn" };
}
