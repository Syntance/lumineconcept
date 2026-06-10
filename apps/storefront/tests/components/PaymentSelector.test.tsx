/**
 * Testy wyboru metody płatności w checkoutcie — krytyczna ścieżka konwersji.
 * Kontrakt: Przelewy24 (płatność od razu) + Przelew tradycyjny (na konto
 * sklepu, zamówienie powstaje natychmiast). Providery niezarejestrowane
 * w regionie są ukrywane; brak wszystkich → komunikat awaryjny z mailem.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PaymentSelector } from "@/components/checkout/PaymentSelector";
import {
  PRZELEWY24_PROVIDER_ID,
  SYSTEM_PAYMENT_PROVIDER_ID,
} from "@/lib/medusa/checkout";

describe("PaymentSelector", () => {
  it("pokazuje Przelewy24 i Przelew tradycyjny, gdy oba aktywne w regionie", () => {
    render(
      <PaymentSelector
        selectedProviderId=""
        onSelect={() => undefined}
        availableProviderIds={[PRZELEWY24_PROVIDER_ID, SYSTEM_PAYMENT_PROVIDER_ID]}
      />,
    );

    expect(screen.getByText("Przelewy24")).toBeInTheDocument();
    expect(screen.getByText("Przelew tradycyjny")).toBeInTheDocument();
  });

  it("ukrywa przelew tradycyjny, gdy provider nie jest zarejestrowany w regionie", () => {
    render(
      <PaymentSelector
        selectedProviderId=""
        onSelect={() => undefined}
        availableProviderIds={[PRZELEWY24_PROVIDER_ID]}
      />,
    );

    expect(screen.getByText("Przelewy24")).toBeInTheDocument();
    expect(screen.queryByText("Przelew tradycyjny")).not.toBeInTheDocument();
  });

  it("bez listy providerów (brak prefetchu) pokazuje wszystkie widoczne opcje", () => {
    render(<PaymentSelector selectedProviderId="" onSelect={() => undefined} />);

    expect(screen.getByText("Przelewy24")).toBeInTheDocument();
    expect(screen.getByText("Przelew tradycyjny")).toBeInTheDocument();
  });

  it("klik na metodę woła onSelect z id providera", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <PaymentSelector
        selectedProviderId=""
        onSelect={onSelect}
        availableProviderIds={[PRZELEWY24_PROVIDER_ID, SYSTEM_PAYMENT_PROVIDER_ID]}
      />,
    );

    await user.click(screen.getByText("Przelew tradycyjny"));
    expect(onSelect).toHaveBeenCalledWith(SYSTEM_PAYMENT_PROVIDER_ID);

    await user.click(screen.getByText("Przelewy24"));
    expect(onSelect).toHaveBeenCalledWith(PRZELEWY24_PROVIDER_ID);
  });

  it("gdy żaden provider nie jest dostępny — komunikat awaryjny z kontaktem", () => {
    render(
      <PaymentSelector
        selectedProviderId=""
        onSelect={() => undefined}
        availableProviderIds={[]}
      />,
    );

    expect(
      screen.getByText(/płatność online jest chwilowo niedostępna/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /kontakt@lumineconcept\.pl/i }),
    ).toBeInTheDocument();
  });

  it("nie pokazuje ukrytych providerów spoza whitelisty (np. Stripe)", () => {
    render(
      <PaymentSelector
        selectedProviderId=""
        onSelect={() => undefined}
        availableProviderIds={["pp_stripe_stripe", PRZELEWY24_PROVIDER_ID]}
      />,
    );

    expect(screen.getByText("Przelewy24")).toBeInTheDocument();
    expect(screen.queryByText(/stripe/i)).not.toBeInTheDocument();
  });
});
