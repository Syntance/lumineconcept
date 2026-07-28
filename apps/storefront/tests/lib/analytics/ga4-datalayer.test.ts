import { describe, expect, it } from "vitest";
import { updateGA4Consent } from "@/lib/analytics/destinations/ga4";

/**
 * gtag.js przetwarza wyłącznie wpisy dataLayer będące obiektem `arguments`
 * (jak w oficjalnym snippecie). Zwykłe tablice ignoruje po cichu — regresja
 * tego kształtu oznacza zero hitów w GA4 mimo działającego consentu.
 */
describe("GA4 dataLayer", () => {
  it("pushes gtag commands as arguments objects, never plain arrays", () => {
    window.dataLayer = [];

    updateGA4Consent(true, false);

    const entries = window.dataLayer ?? [];
    expect(entries.length).toBeGreaterThanOrEqual(1);

    for (const entry of entries) {
      expect(Array.isArray(entry)).toBe(false);
    }

    const first = Array.from(entries[0] as ArrayLike<unknown>);
    expect(first[0]).toBe("consent");
    expect(first[1]).toBe("update");
    expect(first[2]).toMatchObject({ analytics_storage: "granted" });
  });
});
