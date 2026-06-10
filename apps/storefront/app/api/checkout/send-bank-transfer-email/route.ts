import { NextResponse } from "next/server";
import { z } from "zod";
import { bankTransferMergeVars } from "@/lib/payment/bank-transfer";
import { sendBankTransferPendingEmail } from "@magazyn/modules/emails/send-bank-transfer-email";
import { SYSTEM_PAYMENT_PROVIDER_ID } from "@/lib/medusa/checkout";
import type { OrderRenderSource } from "@magazyn/modules/emails/render-template";
import { magazynConfig } from "@magazyn/magazyn.config";
import { sendTransactionalEmail } from "@magazyn/modules/emails/send-transactional";
import { formatPrice } from "@magazyn/core/lib/format";

export const maxDuration = 30;

const bodySchema = z.object({
  order_id: z.string().min(1),
  email: z.string().email(),
  display_id: z.number().int().positive(),
  total: z.number().nonnegative(),
  item_total: z.number().nonnegative().optional(),
  shipping_total: z.number().nonnegative().optional(),
  currency_code: z.string().default("PLN"),
  customer_name: z.string().optional(),
  payment_provider_id: z.string().optional(),
});

/**
 * Zapasowa wysyłka maila przelewu przez Resend na Vercel (bez Admin API Medusy).
 * Wołane z checkoutu, gdy backend Railway nie zdąży / nie ma emaila na order.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const data = parsed.data;
  if (
    data.payment_provider_id &&
    data.payment_provider_id !== SYSTEM_PAYMENT_PROVIDER_ID
  ) {
    return NextResponse.json({ ok: false, error: "not_bank_transfer" }, { status: 422 });
  }

  const customerName =
    data.customer_name?.trim() ||
    data.email.split("@")[0] ||
    "Kliencie";

  const source: OrderRenderSource = {
    displayId: data.display_id,
    email: data.email,
    phone: "",
    currencyCode: data.currency_code,
    total: data.total,
    itemTotal: data.item_total ?? data.total,
    shippingTotal: data.shipping_total ?? 0,
    shippingMethodName: null,
    customerName,
    address: "",
    items: [],
  };

  const customerResult = await sendBankTransferPendingEmail(source);
  if (!customerResult.ok) {
    return NextResponse.json(
      { ok: false, error: customerResult.message },
      { status: 502 },
    );
  }

  const inbox =
    process.env.SHOP_ORDER_NOTIFY_EMAIL?.replace(/\r\n/g, "").trim() ??
    process.env.CONTACT_INBOX_EMAIL?.replace(/\r\n/g, "").trim() ??
    magazynConfig.email.contactEmail;

  if (inbox) {
    const vars = bankTransferMergeVars(data.display_id);
    const totalLabel = formatPrice(data.total, data.currency_code);
    void sendTransactionalEmail({
      to: inbox,
      subject: `Nowe zamówienie #${data.display_id} — ${totalLabel}`,
      text: `Nowe zamówienie #${data.display_id}\nKlient: ${data.email}\nPłatność: Przelew tradycyjny\nKwota: ${totalLabel}\nTytuł: ${vars.tytulPrzelewu}`,
      html: `<p>Nowe zamówienie <strong>#${data.display_id}</strong></p><p>Klient: ${data.email}<br/>Płatność: Przelew tradycyjny<br/>Kwota: ${totalLabel}</p>`,
    }).catch(() => undefined);
  }

  return NextResponse.json({
    ok: true,
    skipped: customerResult.skipped ?? false,
    order_id: data.order_id,
  });
}
