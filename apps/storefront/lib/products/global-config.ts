import { unstable_cache } from "next/cache"
import { resolveMedusaBackendUrl } from "@/lib/medusa/resolve-backend-url"
import {
  DEFAULT_COLOR_CATEGORIES,
  type ColorCategoryDefinition,
  parseColorCategories,
} from "./color-categories"

export interface GlobalConfigOption {
  id: string
  type: "color" | "size" | "material" | "led" | "finish"
  name: string
  hex_color: string | null
  color_category: string | null
  mat_allowed: boolean
  sort_order: number
  metadata: Record<string, unknown> | null
}

export interface GlobalProductConfig {
  colors: GlobalConfigOption[]
  sizes: GlobalConfigOption[]
  materials: GlobalConfigOption[]
  led: GlobalConfigOption[]
  finishes: GlobalConfigOption[]
  colorCategories: ColorCategoryDefinition[]
}

/**
 * Fallback kiedy endpoint globalnej konfiguracji zawiedzie. Strony sklepu
 * używały lokalnych literałów z `as any[]` — trzymamy jeden, typowany
 * literal w tym samym module, co domeny.
 */
export const EMPTY_GLOBAL_CONFIG: GlobalProductConfig = {
  colors: [],
  sizes: [],
  materials: [],
  led: [],
  finishes: [],
  colorCategories: DEFAULT_COLOR_CATEGORIES,
}

/** Store API wymaga klucza; lokalnie możesz ustawić tylko MEDUSA_PUBLISHABLE_KEY (serwer, bez NEXT_PUBLIC). */
function getPublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ??
    process.env.MEDUSA_PUBLISHABLE_KEY ??
    ""
  )
}

/**
 * Fallback: same-origin /api/medusa (proxy dopisuje klucz). Produkcja: najpierw bezpośredni BACKEND_URL.
 * W dev zawsze localhost dla self-fetch (ignoruje NEXT_PUBLIC_SITE_URL wskazujący na produkcję).
 */
function getSameOriginForServerFetch(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.NODE_ENV === "development") {
    return `http://127.0.0.1:${process.env.PORT ?? "3000"}`
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (site) return site
  return `http://127.0.0.1:${process.env.PORT ?? "3000"}`
}

async function fetchStoreProductConfig(search: string): Promise<Response> {
  const key = getPublishableKey()
  const headers: Record<string, string> = {}
  if (key) headers["x-publishable-api-key"] = key

  const backendUrl = await resolveMedusaBackendUrl()
  const directUrl = `${backendUrl}/store/product-config${search}`

  // Najpierw bezpośrednio do Medusy — unika self-fetch na Vercel (RSC → /api/medusa → backend),
  // co często kończy się timeoutem „Application failed to respond”.
  try {
    const direct = await fetch(directUrl, {
      headers,
      next: { revalidate: 60 },
    })
    if (direct.ok) return direct
  } catch {
    /* Medusa wyłączona / zła sieć */
  }

  const origin = getSameOriginForServerFetch().replace(/\/$/, "")
  const internalUrl = `${origin}/api/medusa/store/product-config${search}`

  try {
    const viaProxy = await fetch(internalUrl, { next: { revalidate: 60 } })
    if (viaProxy.ok) return viaProxy
  } catch {
    /* np. zły port w dev — zwrócimy ostatni direct poniżej */
  }

  return fetch(directUrl, {
    headers,
    next: { revalidate: 60 },
  })
}

/**
 * Rzucamy błąd zamiast zwracać pusty config — `unstable_cache` cache'uje
 * wynik (w tym puste listy) na `revalidate` sekund. Gdy Medusa zwróci 502,
 * następne 60s konfigurator miał pusty kolor/rozmiary i psuł PDP. Rzut
 * propaguje się do `error.tsx` i jest retryowany przy następnym request.
 */
async function _fetchGlobalConfig(productId?: string): Promise<GlobalProductConfig> {
  const search = productId ? `?product_id=${encodeURIComponent(productId)}` : ""
  const res = await fetchStoreProductConfig(search)

  if (!res.ok) {
    if (process.env.NODE_ENV === "development" && !getPublishableKey()) {
      console.warn(
        "[global-config] Brak publishable API key: ustaw MEDUSA_PUBLISHABLE_KEY lub NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY w apps/storefront/.env.local (Medusa Admin → Settings → Publishable API keys).",
      )
    }
    throw new Error(
      `[global-config] /store/product-config → HTTP ${res.status}`,
    )
  }

  const data = (await res.json()) as {
    config_options: GlobalConfigOption[]
    color_categories?: unknown
  }
  const all = data.config_options ?? []

  return {
    colors: all.filter((o) => o.type === "color"),
    sizes: all.filter((o) => o.type === "size"),
    materials: all.filter((o) => o.type === "material"),
    led: all.filter((o) => o.type === "led"),
    finishes: all.filter((o) => o.type === "finish"),
    colorCategories: parseColorCategories(data.color_categories),
  }
}

export const getGlobalProductConfig = unstable_cache(
  _fetchGlobalConfig,
  ["global-product-config"],
  { revalidate: 60, tags: ["global-product-config"] },
)

export function getGlobalProductConfigForProduct(productId: string) {
  return unstable_cache(
    () => _fetchGlobalConfig(productId),
    ["global-product-config", productId],
    { revalidate: 60, tags: ["global-product-config", `product-config-${productId}`] },
  )()
}

export function buildColorMap(
  colors: GlobalConfigOption[],
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const c of colors) {
    if (c.hex_color) {
      map[c.name.toLowerCase()] = c.hex_color
    }
  }
  return map
}

export function buildColoredSet(colors: GlobalConfigOption[]): Set<string> {
  return new Set(
    colors
      .filter((c) => c.color_category === "color")
      .map((c) => c.name.toLowerCase()),
  )
}

export function buildMirrorSet(colors: GlobalConfigOption[]): Set<string> {
  return new Set(
    colors
      .filter((c) => c.color_category === "mirror")
      .map((c) => c.name.toLowerCase()),
  )
}

export function buildCustomSet(colors: GlobalConfigOption[]): Set<string> {
  return new Set(
    colors
      .filter((c) => c.color_category === "custom")
      .map((c) => c.name.toLowerCase()),
  )
}

export function parseAllowCustomColor(
  meta: Record<string, unknown> | null | undefined,
): boolean {
  return meta?.allow_custom_color !== "false"
}

export function buildMatDisabledSet(colors: GlobalConfigOption[]): Set<string> {
  return new Set(
    colors
      .filter((c) => !c.mat_allowed)
      .map((c) => c.name.toLowerCase()),
  )
}

export function getColorNames(colors: GlobalConfigOption[]): string[] {
  return colors.map((c) => c.name)
}

/** Łączy globalną paletę z kolorami zdefiniowanymi tylko dla produktu. */
export function mergeGlobalAndProductColors(
  globalColors: GlobalConfigOption[],
  productColors: Array<{
    id: string
    name: string
    hex_color: string
    color_category: GlobalConfigOption["color_category"]
    mat_allowed: boolean
  }>,
): GlobalConfigOption[] {
  const productAsGlobal: GlobalConfigOption[] = productColors.map((c, index) => ({
    id: c.id,
    type: "color",
    name: c.name,
    hex_color: c.hex_color,
    color_category: c.color_category,
    mat_allowed: c.mat_allowed,
    sort_order: 10_000 + index,
    metadata: { product_only: true },
  }))
  return [...globalColors, ...productAsGlobal]
}
