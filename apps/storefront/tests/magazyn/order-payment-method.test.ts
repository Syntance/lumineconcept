import { describe, expect, it } from "vitest";
import {
  orderPaymentMethodLabel,
  PRZELEWY24_PROVIDER_ID,
  SYSTEM_PAYMENT_PROVIDER_ID,
} from "@/magazyn/modules/orders/order-payment-provider";
import type { AdminOrderDetail } from "@/magazyn/modules/orders/order-types";

function baseOrder(overrides: Partial<AdminOrderDetail> = {}): AdminOrderDetail {
  return {
    id: "ord_1",
    displayId: 1001,
    status: "pending",
    paymentStatus: "captured",
    fulfillmentStatus: "not_fulfilled",
    email: "test@example.com",
    phone: "",
    currencyCode: "PLN",
    createdAt: "",
    updatedAt: "",
    items: [],
    itemTotal: 0,
    shippingTotal: 0,
    shippingDiscount: 0,
    taxTotal: 0,
    discountTotal: 0,
    total: 0,
    shippingAddress: null,
    billingAddress: null,
    shippingMethodName: null,
    payments: [
      {
        id: "pay_1",
        amount: 10000,
        currencyCode: "PLN",
        providerId: PRZELEWY24_PROVIDER_ID,
        capturedAt: "2026-01-01T00:00:00Z",
        canceledAt: null,
      },
    ],
    fulfillments: [],
    metadata: {},
    ...overrides,
  };
}

describe("orderPaymentMethodLabel", () => {
  it("używa metadata.payment gdy jest ustawione", () => {
    expect(
      orderPaymentMethodLabel(
        baseOrder({ metadata: { payment: "Przelewy24 (BLIK)" } }),
      ),
    ).toBe("Przelewy24 (BLIK)");
  });

  it("składa etykietę z p24_method_name", () => {
    expect(
      orderPaymentMethodLabel(
        baseOrder({
          metadata: {
            payment_provider_id: PRZELEWY24_PROVIDER_ID,
            p24_method_name: "BLIK",
          },
        }),
      ),
    ).toBe("Przelewy24 (BLIK)");
  });

  it("czyta metodę z sesji P24 gdy brak w metadata — bank oznaczony jako przelew", () => {
    expect(
      orderPaymentMethodLabel(
        baseOrder({
          p24MethodName: "mTransfer",
        }),
      ),
    ).toBe("Przelewy24 (przelew — mTransfer)");
  });

  it("BLIK/karta z sesji P24 bez dopisku „przelew”", () => {
    expect(
      orderPaymentMethodLabel(baseOrder({ p24MethodName: "BLIK" })),
    ).toBe("Przelewy24 (BLIK)");
    expect(
      orderPaymentMethodLabel(baseOrder({ p24MethodName: "Karta płatnicza" })),
    ).toBe("Przelewy24 (Karta płatnicza)");
  });

  it("pokazuje id metody gdy brak nazwy", () => {
    expect(
      orderPaymentMethodLabel(
        baseOrder({
          p24MethodId: "181",
        }),
      ),
    ).toBe("Przelewy24 (metoda #181)");
  });

  it("fallback na provider", () => {
    expect(
      orderPaymentMethodLabel(
        baseOrder({
          payments: [
            {
              id: "pay_2",
              amount: 10000,
              currencyCode: "PLN",
              providerId: SYSTEM_PAYMENT_PROVIDER_ID,
              capturedAt: null,
              canceledAt: null,
            },
          ],
        }),
      ),
    ).toBe("Przelew tradycyjny");
  });
});
