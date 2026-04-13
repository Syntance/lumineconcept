import { medusa } from "./client";

let cachedRegionId: string | null = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID ?? null;
let pendingPromise: Promise<string> | null = null;

export async function getPolishRegionId(): Promise<string> {
  if (cachedRegionId) return cachedRegionId;

  if (pendingPromise) return pendingPromise;

  pendingPromise = (async () => {
    try {
      const response = await medusa.store.region.list();
      const plRegion = response.regions.find(
        (r) => r.countries?.some((c) => c.iso_2 === "pl"),
      );

      if (!plRegion) {
        throw new Error("Region PL nie znaleziony. Skonfiguruj region w Medusa Admin.");
      }

      cachedRegionId = plRegion.id;
      return cachedRegionId;
    } catch (e) {
      const fromEnv = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID?.trim();
      if (fromEnv) {
        cachedRegionId = fromEnv;
        return cachedRegionId;
      }
      throw e;
    }
  })().finally(() => {
    pendingPromise = null;
  });

  return pendingPromise;
}
