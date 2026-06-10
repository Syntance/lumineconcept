import { describe, expect, it } from "vitest";
import {
  orderAwaitingBankTransfer,
  PAYMENT_PROVIDER_METADATA_KEY,
  SYSTEM_PAYMENT_PROVIDER_ID,
} from "../src/lib/order-payment-method";

describe("orderAwaitingBankTransfer", () => {
  it("rozpoznaje przelew z metadata koszyka/zamówienia", () => {
    expect(
      orderAwaitingBankTransfer({
        payment_status: "not_paid",
        metadata: { [PAYMENT_PROVIDER_METADATA_KEY]: SYSTEM_PAYMENT_PROVIDER_ID },
      }),
    ).toBe(true);
  });

  it("odrzuca gdy provider to P24", () => {
    expect(
      orderAwaitingBankTransfer({
        payment_status: "not_paid",
        metadata: { [PAYMENT_PROVIDER_METADATA_KEY]: "pp_przelewy24_przelewy24" },
      }),
    ).toBe(false);
  });

  it("fallback na payment_collections.payments", () => {
    expect(
      orderAwaitingBankTransfer({
        payment_status: "awaiting",
        payment_collections: [
          { payments: [{ provider_id: SYSTEM_PAYMENT_PROVIDER_ID }] },
        ],
      }),
    ).toBe(true);
  });
});
