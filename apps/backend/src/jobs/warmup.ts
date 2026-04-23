import { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

/**
 * Warmup job — utrzymuje „gorący" stan najważniejszych modułów Medusy,
 * dzięki czemu pierwszy request użytkownika po chwili ciszy nie uderza
 * w cold-start workflow engine / pricing / product module (co wcześniej
 * objawiało się 250 s wiszącym add-to-cart).
 *
 * Lekki job — robi tanie `list` na regionach + jednym produkcie i odpytuje
 * cache; żadnych mutacji, żadnych efektów ubocznych.
 */
export default async function warmupJob(container: MedusaContainer) {
  try {
    const regionModule = container.resolve(Modules.REGION);
    const productModule = container.resolve(Modules.PRODUCT);
    const pricingModule = container.resolve(Modules.PRICING);

    const [regions, products] = await Promise.all([
      regionModule.listRegions({}, { take: 1 }),
      productModule.listProducts({}, { take: 1 }),
    ]);

    if (products.length > 0) {
      await pricingModule.calculatePrices(
        { id: [] },
        { context: { currency_code: regions[0]?.currency_code ?? "pln" } },
      );
    }
  } catch (e) {
    /** Warmup jest best-effort — błędy nigdy nie powinny wpływać na produkcję. */
    console.warn("[warmup] non-fatal:", (e as Error)?.message);
  }
}

export const config = {
  name: "warmup",
  schedule: "*/2 * * * *",
};
