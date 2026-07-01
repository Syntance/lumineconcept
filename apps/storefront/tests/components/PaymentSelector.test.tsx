/**
 * Testy wyboru metody płatności w checkoutcie — krytyczna ścieżka konwersji.
 * Kontrakt (po incydencie #10165 — zamówienie bez płatności): jedyną metodą
 * produkcyjną jest Przelewy24. Przelew tradycyjny (`pp_system_default`)
 * pokazujemy WYŁĄCZNIE gdy P24 nie jest zarejestrowane w regionie (dev/test
 * bez kluczy P24). Brak wszystkich providerów → komunikat awaryjny z mailem.
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
  it("ukrywa przelew tradycyjny, gdy P24 jest dostępne (jedyna płatność: P24)", () => {
    render(
      <PaymentSelector
        selectedProviderId=""
        onSelect={() => undefined}
        availableProviderIds={[PRZELEWY24_PROVIDER_ID, SYSTEM_PAYMENT_PROVIDER_ID]}
      />,
    );

    expect(screen.getByText("Przelewy24")).toBeInTheDocument();
    expect(screen.queryByText("Przelew tradycyjny")).not.toBeInTheDocument();
  });

  it("pokazuje przelew tradycyjny tylko gdy P24 nie jest zarejestrowane (dev/test)", () => {
    render(
      <PaymentSelector
        selectedProviderId=""
        onSelect={() => undefined}
        availableProviderIds={[SYSTEM_PAYMENT_PROVIDER_ID]}
      />,
    );

    expect(screen.queryByText("Przelewy24")).not.toBeInTheDocument();
    expect(screen.getByText("Przelew tradycyjny")).toBeInTheDocument();
  });

  it("bez listy providerów (brak prefetchu) pokazuje tylko Przelewy24", () => {
    render(<PaymentSelector selectedProviderId="" onSelect={() => undefined} />);

    expect(screen.getByText("Przelewy24")).toBeInTheDocument();
    expect(screen.queryByText("Przelew tradycyjny")).not.toBeInTheDocument();
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

  it("przy otwartym circuit breakerze P24 zostaje dostępne + baner ostrzegawczy", () => {
    render(
      <PaymentSelector
        selectedProviderId=""
        onSelect={() => undefined}
        availableProviderIds={[PRZELEWY24_PROVIDER_ID]}
        p24CircuitOpen
      />,
    );

    expect(screen.getByText("Przelewy24")).toBeInTheDocument();
    expect(
      screen.getByText(/miewa w tej chwili problemy/i),
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
