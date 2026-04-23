import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import type {
  ICartModuleService,
  IPricingModuleService,
  IProductModuleService,
  IRegionModuleService,
} from "@medusajs/framework/types";

/**
 * GET /store/custom/perf-probe
 *
 * Diagnostyczny endpoint do mierzenia rzeczywistego breakdownu latencji
 * Medusy w produkcji. Odpytuje kolejne moduły osobno (bez workflow engine,
 * bez event bus, bez cart workflow) i zwraca czasy każdego kroku.
 * Pozwala odpowiedzieć na pytanie: co konkretnie jest wolne — DB, Redis,
 * pricing, czy może event/workflow orchestration?
 *
 * Używany tylko w diagnostyce wydajności — bez cache, bez side effectów.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const timings: Record<string, number> = {};
  const now = () => performance.now();

  const t0 = now();
  try {
    const cache = req.scope.resolve(Modules.CACHE) as {
      get: (k: string) => Promise<unknown>;
      set: (k: string, v: unknown, ttl?: number) => Promise<void>;
    };
    const cacheKey = `perf-probe:${Date.now()}`;
    const tCacheSetStart = now();
    await cache.set(cacheKey, { ok: true }, 10);
    timings.cache_set = Math.round(now() - tCacheSetStart);
    const tCacheGetStart = now();
    await cache.get(cacheKey);
    timings.cache_get = Math.round(now() - tCacheGetStart);
  } catch {
    timings.cache_error = 1;
  }

  const tRegionStart = now();
  try {
    const region = req.scope.resolve(Modules.REGION) as IRegionModuleService;
    await region.listRegions({}, { take: 1 });
    timings.region_list = Math.round(now() - tRegionStart);
  } catch {
    timings.region_error = 1;
  }

  const tProductStart = now();
  try {
    const product = req.scope.resolve(Modules.PRODUCT) as IProductModuleService;
    const products = await product.listProducts({}, { take: 1, relations: ["variants"] });
    timings.product_list = Math.round(now() - tProductStart);
    timings.__product_count = products.length;
  } catch {
    timings.product_error = 1;
  }

  const tPricingStart = now();
  try {
    const pricing = req.scope.resolve(Modules.PRICING) as IPricingModuleService;
    await pricing.calculatePrices(
      { id: [] },
      { context: { currency_code: "pln" } },
    );
    timings.pricing_calc = Math.round(now() - tPricingStart);
  } catch {
    timings.pricing_error = 1;
  }

  const tCartStart = now();
  try {
    const cart = req.scope.resolve(Modules.CART) as ICartModuleService;
    await cart.listCarts({}, { take: 1 });
    timings.cart_list = Math.round(now() - tCartStart);
  } catch {
    timings.cart_error = 1;
  }

  timings.total = Math.round(now() - t0);
  res.json({ ok: true, timings_ms: timings });
}
