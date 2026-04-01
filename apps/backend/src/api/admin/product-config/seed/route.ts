import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type ProductConfigService from "../../../../modules/product-config/service"

const SEED_COLORS = [
  // Standardowe (neutralne / przezroczyste)
  { name: "bezbarwny", hex_color: "transparent", color_category: "standard", mat_allowed: false, sort_order: 0 },
  { name: "mleczny", hex_color: "#F5F0E8", color_category: "standard", mat_allowed: false, sort_order: 1 },
  { name: "biały", hex_color: "#ffffff", color_category: "standard", mat_allowed: true, sort_order: 2 },
  { name: "czarny", hex_color: "#1a1a1a", color_category: "standard", mat_allowed: true, sort_order: 3 },
  { name: "przezroczysty", hex_color: "transparent", color_category: "standard", mat_allowed: false, sort_order: 4 },
  // Kolorowe
  { name: "różowy", hex_color: "#E8A0BF", color_category: "color", mat_allowed: true, sort_order: 10 },
  { name: "beżowy", hex_color: "#D4C5B2", color_category: "color", mat_allowed: true, sort_order: 11 },
  { name: "szary", hex_color: "#8B8B8B", color_category: "color", mat_allowed: true, sort_order: 12 },
  { name: "brązowy", hex_color: "#6B4226", color_category: "color", mat_allowed: true, sort_order: 13 },
  // Lustrzane
  { name: "złoty", hex_color: "#D4AF37", color_category: "mirror", mat_allowed: false, sort_order: 20 },
  { name: "srebrny", hex_color: "#C0C0C0", color_category: "mirror", mat_allowed: false, sort_order: 21 },
  { name: "rose gold", hex_color: "#B76E79", color_category: "mirror", mat_allowed: false, sort_order: 22 },
  { name: "czerwone", hex_color: "#CC0000", color_category: "mirror", mat_allowed: false, sort_order: 23 },
  { name: "czerwony", hex_color: "#CC0000", color_category: "mirror", mat_allowed: false, sort_order: 24 },
  { name: "fioletowy", hex_color: "#7B2D8E", color_category: "mirror", mat_allowed: false, sort_order: 25 },
  { name: "zielony", hex_color: "#1B6B3A", color_category: "mirror", mat_allowed: false, sort_order: 26 },
  { name: "granatowy", hex_color: "#1B2A4A", color_category: "mirror", mat_allowed: false, sort_order: 27 },
]

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("product-config") as ProductConfigService

  const existing = await service.listConfigOptions({ type: "color" })
  if (existing.length > 0) {
    return res.status(409).json({
      message: `Seed pomini\u0119ty — istnieje ju\u017c ${existing.length} kolor\u00f3w w konfiguracji globalnej.`,
      count: existing.length,
    })
  }

  const created = []
  for (const color of SEED_COLORS) {
    const option = await service.createConfigOptions({
      type: "color",
      ...color,
      metadata: null,
    })
    created.push(option)
  }

  res.status(201).json({
    message: `Dodano ${created.length} kolor\u00f3w do globalnej konfiguracji.`,
    config_options: created,
  })
}
