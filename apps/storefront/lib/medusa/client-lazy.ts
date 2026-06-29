import type Medusa from "@medusajs/js-sdk";
import { resolveMedusaFetchBase } from "./resolve-fetch-base";

/**
 * Leniwy akcesor klienta Medusa SDK.
 *
 * `./client` tworzy instancję `@medusajs/js-sdk` na poziomie modułu (eager).
 * Moduły dosięgalne z bundla KLIENTA (cart/checkout/region — przez `CartProvider`)
 * importowały to SDK do initial chunku, mimo że jest potrzebne dopiero przy
 * akcjach koszyka/checkoutu. To psuło LCP strony głównej (duży, w większości
 * nieużywany JS + własne polyfille SDK).
 *
 * `getMedusa()` ładuje SDK przez `import()` dopiero przy pierwszym użyciu i
 * memoizuje instancję. Initial bundle nie zawiera SDK; chunk dochodzi leniwie
 * przy pierwszej mutacji koszyka. Semantyka wywołań bez zmian.
 *
 * Serwerowe / panelowe moduły (`order`, `products`, `magazyn/*`) nadal używają
 * eager `medusa` z `./client` — tam rozmiar bundla klienta nie ma znaczenia.
 */

const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.trim() ||
  process.env.MEDUSA_PUBLISHABLE_KEY?.trim() ||
  "";

let instance: Medusa | null = null;
let initPromise: Promise<Medusa> | null = null;

export function getMedusa(): Promise<Medusa> {
  if (instance) return Promise.resolve(instance);
  if (!initPromise) {
    initPromise = import("@medusajs/js-sdk").then(({ default: MedusaCtor }) => {
      instance = new MedusaCtor({
        baseUrl: resolveMedusaFetchBase(),
        publishableKey: PUBLISHABLE_KEY,
      });
      return instance;
    });
  }
  return initPromise;
}
