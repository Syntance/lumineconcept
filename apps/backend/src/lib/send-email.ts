import type {
  INotificationModuleService,
  MedusaContainer,
} from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import type { OrderEmailPayload } from "./email-templates";
import { captureError } from "./sentry";

/**
 * Zuniformowany helper do wysyłki maila. Izolujemy błędy providera (Resend
 * może być przejściowo niedostępny, limity API itp.) — subscriber nigdy nie
 * powinien się wysypywać tylko dlatego że mail nie poszedł. Każdy błąd
 * logujemy do konsoli + Sentry, ale zwracamy `false` żeby warstwa wyżej
 * mogła się zdecydować.
 */
export async function sendTransactionalEmail(
  container: MedusaContainer,
  params: {
    to: string;
    channel?: "email";
    subject: string;
    html: string;
    text?: string;
    context: string; // np. "order-placed" — do logów/Sentry
    orderId?: string;
  },
): Promise<boolean> {
  const { to, subject, html, text, context, orderId } = params;

  if (!to) {
    console.warn(`[mail:${context}] brak adresata — pomijam wysyłkę`);
    return false;
  }

  let notificationService: INotificationModuleService;
  try {
    notificationService = container.resolve(Modules.NOTIFICATION);
  } catch (_e) {
    console.warn(
      `[mail:${context}] moduł Notification nie jest zarejestrowany — prawdopodobnie brak RESEND_API_KEY. Pomijam.`,
    );
    return false;
  }

  try {
    await notificationService.createNotifications({
      to,
      channel: "email",
      template: context,
      content: {
        subject,
        html,
        ...(text ? { text } : {}),
      },
      data: orderId ? { order_id: orderId } : undefined,
      ...(orderId
        ? {
            resource_id: orderId,
            resource_type: "order",
            // Idempotency: jeden mail danego typu per zamówienie, nawet jeśli
            // event zostanie powtórzony przez retry workera.
            idempotency_key: `${context}:${orderId}`,
          }
        : {}),
    });
    console.info(`[mail:${context}] wysłano do ${to}`);
    return true;
  } catch (err) {
    console.error(`[mail:${context}] błąd wysyłki do ${to}:`, err);
    captureError(err, { mail: context, orderId, to });
    return false;
  }
}

/**
 * Mapuje obiekt Order z Medusa Order module na płaski payload używany przez
 * szablony. Izolacja mapowania upraszcza testy (nie musimy mockować pełnego
 * modelu Medusy) i pozwala zachować szablony bez wiedzy o strukturze bazy.
 */
export function buildOrderEmailPayload(
  order: Record<string, unknown>,
  overrides: Partial<OrderEmailPayload> = {},
): OrderEmailPayload {
  const items = Array.isArray(order.items) ? order.items : [];
  const address = order.shipping_address as Record<string, unknown> | null;
  const shippingMethods = Array.isArray(order.shipping_methods)
    ? (order.shipping_methods as Array<Record<string, unknown>>)
    : [];
  const shippingMethod = shippingMethods[0]?.name as string | undefined;

  const storefrontUrl =
    process.env.STOREFRONT_URL ??
    process.env.STORE_CORS ??
    "https://lumineconcept.pl";

  return {
    orderId: (order.id as string) ?? "",
    displayId: (order.display_id as number | undefined) ?? undefined,
    email: (order.email as string) ?? "",
    currencyCode: (order.currency_code as string) ?? "PLN",
    items: items.map((it) => {
      const item = it as Record<string, unknown>;
      return {
        title:
          (item.product_title as string) ??
          (item.title as string) ??
          "Produkt",
        quantity: Number(item.quantity ?? 1),
        unitPriceMinor: Math.round(Number(item.unit_price ?? 0) * 100) || 0,
        thumbnail: (item.thumbnail as string | null) ?? null,
      };
    }),
    subtotalMinor: Math.round(Number(order.item_total ?? order.subtotal ?? 0) * 100) || 0,
    shippingMinor: Math.round(Number(order.shipping_total ?? 0) * 100) || 0,
    totalMinor: Math.round(Number(order.total ?? 0) * 100) || 0,
    shippingAddress: address
      ? {
          firstName: (address.first_name as string | null) ?? null,
          lastName: (address.last_name as string | null) ?? null,
          address1: (address.address_1 as string | null) ?? null,
          postalCode: (address.postal_code as string | null) ?? null,
          city: (address.city as string | null) ?? null,
          country: (address.country_code as string | null) ?? null,
        }
      : null,
    shippingMethod: shippingMethod ?? null,
    trackingNumber: null,
    trackingUrl: null,
    storefrontUrl,
    ...overrides,
  };
}
