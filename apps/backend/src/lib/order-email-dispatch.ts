import type { MedusaContainer } from "@medusajs/framework/types";
import {
  renderBankTransferPendingEmail,
  renderOrderPlacedEmail,
} from "./email-templates";
import {
  markOrderEmailSent,
  wasOrderEmailSent,
  copyPaymentProviderToOrder,
} from "./order-checkout-metadata";
import { orderAwaitingBankTransfer } from "./order-payment-method";
import { RESEND_DEFAULT_CONTACT_EMAIL } from "./resend-defaults";
import {
  buildOrderEmailPayload,
  retrieveOrderForEmail,
  sendTransactionalEmail,
} from "./send-email";

const RETRY_DELAYS_MS = [0, 400, 800, 1200, 2000];

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.replace(/\r\n/g, "").trim();
  return trimmed || undefined;
}

export function shopOrderInbox(): string {
  return (
    trimEnv(process.env.SHOP_ORDER_NOTIFY_EMAIL) ??
    trimEnv(process.env.CONTACT_INBOX_EMAIL) ??
    trimEnv(process.env.RESEND_REPLY_TO) ??
    RESEND_DEFAULT_CONTACT_EMAIL
  );
}

export function resolveOrderRecipientEmail(
  order: Record<string, unknown>,
  fallbackEmail?: string,
): string {
  const fromOrder = (order.email as string | undefined)?.trim();
  if (fromOrder) return fromOrder;
  return fallbackEmail?.trim() ?? "";
}

export async function retryRetrieveOrderForEmail(
  scope: MedusaContainer,
  orderId: string,
): Promise<Record<string, unknown> | null> {
  for (const delayMs of RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    const order = await retrieveOrderForEmail(scope, orderId);
    if (order) return order;
  }
  return null;
}

async function sendShopNewOrderCopy(
  scope: MedusaContainer,
  params: {
    orderId: string;
    displayId?: number;
    customerEmail: string;
    totalMinor: number;
    currencyCode: string;
    paymentLabel: string;
  },
): Promise<void> {
  const inbox = shopOrderInbox();
  if (!inbox) return;

  const num = params.displayId != null ? `#${params.displayId}` : params.orderId;
  const total = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: params.currencyCode || "PLN",
  }).format(params.totalMinor / 100);

  const subject = `Nowe zamówienie ${num} — ${total}`;
  const html = `<p>Nowe zamówienie w sklepie.</p>
<ul>
  <li><strong>Numer:</strong> ${num}</li>
  <li><strong>Klient:</strong> ${params.customerEmail}</li>
  <li><strong>Płatność:</strong> ${params.paymentLabel}</li>
  <li><strong>Kwota:</strong> ${total}</li>
</ul>`;
  const text = `Nowe zamówienie ${num}\nKlient: ${params.customerEmail}\nPłatność: ${params.paymentLabel}\nKwota: ${total}`;

  await sendTransactionalEmail(scope, {
    to: inbox,
    subject,
    html,
    text,
    context: "shop-new-order",
    orderId: params.orderId,
  });
}

export async function dispatchOrderPlacedEmails(
  scope: MedusaContainer,
  params: {
    orderId: string;
    fallbackEmail?: string;
    paymentProviderId?: string;
  },
): Promise<{ ok: boolean; step?: string; email?: string }> {
  const order = await retryRetrieveOrderForEmail(scope, params.orderId);
  if (!order) {
    return { ok: false, step: "retrieve-order" };
  }

  if (params.paymentProviderId) {
    await copyPaymentProviderToOrder(
      scope,
      params.orderId,
      params.paymentProviderId,
    );
    order.metadata = {
      ...(typeof order.metadata === "object" && order.metadata
        ? order.metadata
        : {}),
      payment_provider_id: params.paymentProviderId,
    };
  }

  const email = resolveOrderRecipientEmail(order, params.fallbackEmail);
  if (!email) {
    return { ok: false, step: "no-email" };
  }

  const isBankTransfer = orderAwaitingBankTransfer(
    order as Parameters<typeof orderAwaitingBankTransfer>[0],
  );
  const context = isBankTransfer ? "bank-transfer-pending" : "order-placed";

  if (wasOrderEmailSent(order, context)) {
    return { ok: true, email, step: "already-sent" };
  }

  const payload = buildOrderEmailPayload(order, { email });
  const { subject, html, text } = isBankTransfer
    ? renderBankTransferPendingEmail(payload)
    : renderOrderPlacedEmail(payload);

  const customerOk = await sendTransactionalEmail(scope, {
    to: email,
    subject,
    html,
    text,
    context,
    orderId: params.orderId,
  });

  if (!customerOk) {
    return { ok: false, step: "send-customer", email };
  }

  await markOrderEmailSent(scope, params.orderId, context);

  void sendShopNewOrderCopy(scope, {
    orderId: params.orderId,
    displayId:
      typeof payload.displayId === "number" ? payload.displayId : undefined,
    customerEmail: email,
    totalMinor: payload.totalMinor,
    currencyCode: payload.currencyCode,
    paymentLabel: isBankTransfer ? "Przelew tradycyjny" : "Online",
  }).catch((e) => {
    console.error("[mail:shop-new-order] failed", e);
  });

  return { ok: true, email };
}

export async function dispatchBankTransferPendingEmail(
  scope: MedusaContainer,
  params: {
    orderId: string;
    fallbackEmail?: string;
    paymentProviderId?: string;
  },
): Promise<{ ok: boolean; step?: string; email?: string }> {
  const order = await retryRetrieveOrderForEmail(scope, params.orderId);
  if (!order) {
    return { ok: false, step: "retrieve-order" };
  }

  const providerId = params.paymentProviderId ?? "pp_system_default";
  await copyPaymentProviderToOrder(scope, params.orderId, providerId);

  const email = resolveOrderRecipientEmail(order, params.fallbackEmail);
  if (!email) {
    return { ok: false, step: "no-email" };
  }

  const context = "bank-transfer-pending";
  if (wasOrderEmailSent(order, context)) {
    return { ok: true, email, step: "already-sent" };
  }

  const payload = buildOrderEmailPayload(order, { email });
  const { subject, html, text } = renderBankTransferPendingEmail(payload);

  const customerOk = await sendTransactionalEmail(scope, {
    to: email,
    subject,
    html,
    text,
    context,
    orderId: params.orderId,
  });

  if (!customerOk) {
    return { ok: false, step: "send-customer", email };
  }

  await markOrderEmailSent(scope, params.orderId, context);

  void sendShopNewOrderCopy(scope, {
    orderId: params.orderId,
    displayId:
      typeof payload.displayId === "number" ? payload.displayId : undefined,
    customerEmail: email,
    totalMinor: payload.totalMinor,
    currencyCode: payload.currencyCode,
    paymentLabel: "Przelew tradycyjny",
  }).catch((e) => {
    console.error("[mail:shop-new-order] failed", e);
  });

  return { ok: true, email };
}
