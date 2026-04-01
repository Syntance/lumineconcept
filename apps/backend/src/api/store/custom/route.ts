import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import type MeilisearchService from "../../../modules/meilisearch/service";

/**
 * GET /store/custom/search?q=...&filter=...&sort=...&limit=...&offset=...
 * Proxies search requests to Meilisearch
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { q, filter, sort, limit, offset } = req.query as Record<string, string>;

  if (!q) {
    return res.status(400).json({ message: "Brak parametru wyszukiwania 'q'" });
  }

  const meilisearch = req.scope.resolve("meilisearch") as MeilisearchService;

  const results = await meilisearch.search(q, {
    filter: filter ? filter.split(",") : undefined,
    sort: sort ? sort.split(",") : undefined,
    limit: limit ? Number(limit) : 20,
    offset: offset ? Number(offset) : 0,
  });

  return res.json(results);
}

/**
 * POST /store/custom/shipping-options
 * Returns available shipping options with prices
 */
export async function POST(_req: MedusaRequest, res: MedusaResponse) {
  const dpdOptions = [
    {
      id: "dpd_courier",
      name: "Kurier DPD",
      price: 2500,
      estimated_days: "1-3 dni robocze po nadaniu",
    },
  ];

  return res.json({
    shipping_options: dpdOptions,
  });
}
