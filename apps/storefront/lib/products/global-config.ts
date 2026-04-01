import { unstable_cache } from "next/cache"

export interface GlobalConfigOption {
  id: string
  type: "color" | "size" | "material" | "led" | "finish"
  name: string
  hex_color: string | null
  color_category: "standard" | "color" | "mirror" | null
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
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"

/** Store API wymaga klucza; lokalnie możesz ustawić tylko MEDUSA_PUBLISHABLE_KEY (serwer, bez NEXT_PUBLIC). */
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ??
  process.env.MEDUSA_PUBLISHABLE_KEY ??
  ""

async function _fetchGlobalConfig(): Promise<GlobalProductConfig> {
  const headers: Record<string, string> = {}
  if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY

  const res = await fetch(`${BACKEND_URL}/store/product-config`, {
    headers,
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    console.error("Failed to fetch global product config:", res.status)
    return { colors: [], sizes: [], materials: [], led: [], finishes: [] }
  }

  const data = (await res.json()) as { config_options: GlobalConfigOption[] }
  const all = data.config_options ?? []

  return {
    colors: all.filter((o) => o.type === "color"),
    sizes: all.filter((o) => o.type === "size"),
    materials: all.filter((o) => o.type === "material"),
    led: all.filter((o) => o.type === "led"),
    finishes: all.filter((o) => o.type === "finish"),
  }
}

export const getGlobalProductConfig = unstable_cache(
  _fetchGlobalConfig,
  ["global-product-config"],
  { revalidate: 60, tags: ["global-product-config"] },
)

async function _fetchProductConfig(
  productId: string,
): Promise<GlobalProductConfig> {
  const headers: Record<string, string> = {}
  if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY

  const res = await fetch(
    `${BACKEND_URL}/store/product-config?product_id=${productId}`,
    { headers, next: { revalidate: 60 } },
  )

  if (!res.ok) {
    return _fetchGlobalConfig()
  }

  const data = (await res.json()) as { config_options: GlobalConfigOption[] }
  const all = data.config_options ?? []

  return {
    colors: all.filter((o) => o.type === "color"),
    sizes: all.filter((o) => o.type === "size"),
    materials: all.filter((o) => o.type === "material"),
    led: all.filter((o) => o.type === "led"),
    finishes: all.filter((o) => o.type === "finish"),
  }
}

export const getProductConfig = unstable_cache(
  _fetchProductConfig,
  ["product-config"],
  { revalidate: 60, tags: ["global-product-config"] },
)

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
