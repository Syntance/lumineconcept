import { describe, expect, it } from "vitest";
import {
  resolveOrderRecipientEmail,
  shopOrderInbox,
} from "../src/lib/order-email-dispatch";
import { wasOrderEmailSent } from "../src/lib/order-checkout-metadata";

describe("resolveOrderRecipientEmail", () => {
  it("preferuje email z zamówienia", () => {
    expect(
      resolveOrderRecipientEmail({ email: "a@b.pl" }, "fallback@x.pl"),
    ).toBe("a@b.pl");
  });

  it("używa fallback z checkoutu", () => {
    expect(resolveOrderRecipientEmail({}, "klient@example.com")).toBe(
      "klient@example.com",
    );
  });
});

describe("wasOrderEmailSent", () => {
  it("wykrywa flagę w metadata", () => {
    expect(
      wasOrderEmailSent(
        { metadata: { "email_sent_bank-transfer-pending": "2026-01-01" } },
        "bank-transfer-pending",
      ),
    ).toBe(true);
  });
});

describe("shopOrderInbox", () => {
  it("zwraca domyślny kontakt@", () => {
    expect(shopOrderInbox()).toContain("@");
  });
});
