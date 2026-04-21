import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Button,
  clx,
} from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { sdk } from "../lib/sdk"

interface ConfigOption {
  id: string
  type: string
  name: string
  hex_color: string | null
  color_category: string | null
  mat_allowed: boolean
  sort_order: number
}

const TYPE_LABELS: Record<string, string> = {
  color: "Kolory",
  size: "Rozmiary",
  material: "Materiały",
  led: "LED",
  finish: "Wykończenia",
}

function ColorSwatch({ hex }: { hex: string | null }) {
  if (!hex || hex === "transparent") {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-dashed border-ui-border-strong">
        <span className="text-[6px] text-ui-fg-muted">∅</span>
      </span>
    )
  }
  return (
    <span
      className="inline-block h-4 w-4 rounded-full border border-ui-border-base"
      style={{ backgroundColor: hex }}
    />
  )
}

const ProductConfigOverridesWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const [allOptions, setAllOptions] = useState<ConfigOption[]>([])
  const [disabledIds, setDisabledIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      sdk.client.fetch<{ config_options: ConfigOption[] }>("/admin/product-config", { method: "GET" }),
      sdk.client.fetch<{ disabled_config_ids: string[] }>(
        `/admin/product-config/products/${product.id}/overrides`,
        { method: "GET" },
      ),
    ])
      .then(([configRes, overridesRes]) => {
        setAllOptions(configRes.config_options)
        setDisabledIds(new Set(overridesRes.disabled_config_ids))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [product.id])

  const toggleOption = (id: string) => {
    setDisabledIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setDirty(true)
  }

  const enableAll = () => {
    setDisabledIds(new Set())
    setDirty(true)
  }

  const save = useCallback(async () => {
    setSaving(true)
    try {
      await sdk.client.fetch(
        `/admin/product-config/products/${product.id}/overrides`,
        {
          method: "POST",
          body: { disabled_config_ids: Array.from(disabledIds) },
        },
      )
      setDirty(false)
      setToast("Zapisano!")
      setTimeout(() => setToast(null), 2000)
    } catch {
      setToast("Błąd zapisu")
      setTimeout(() => setToast(null), 3000)
    } finally {
      setSaving(false)
    }
  }, [product.id, disabledIds])

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted">Ładowanie konfiguracji…</Text>
        </div>
      </Container>
    )
  }

  if (allOptions.length === 0) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Opcje konfiguracji</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Brak globalnych opcji. Przejdź do „Konfiguracja produktów" aby dodać.
          </Text>
        </div>
      </Container>
    )
  }

  const grouped = allOptions.reduce<Record<string, ConfigOption[]>>((acc, o) => {
    if (!acc[o.type]) acc[o.type] = []
    acc[o.type].push(o)
    return acc
  }, {})

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Opcje konfiguracji</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-0.5">
            Wyłączenie opcji ukrywa ją tylko dla tego produktu.
            Domyślnie wszystkie opcje globalne są włączone.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          {toast && (
            <Text
              size="small"
              className={clx(
                "transition-opacity",
                toast.startsWith("Błąd") ? "text-ui-fg-error" : "text-ui-fg-interactive",
              )}
            >
              {toast}
            </Text>
          )}
          {disabledIds.size > 0 && (
            <Button variant="secondary" size="small" onClick={enableAll}>
              Włącz wszystkie
            </Button>
          )}
          {dirty && (
            <Button size="small" onClick={save} isLoading={saving}>
              Zapisz
            </Button>
          )}
        </div>
      </div>

      {Object.entries(grouped).map(([type, opts]) => (
        <div key={type} className="px-6 py-3">
          <Text size="small" weight="plus" className="mb-2">
            {TYPE_LABELS[type] ?? type}
          </Text>
          <div className="flex flex-wrap gap-2">
            {opts.map((opt) => {
              const isEnabled = !disabledIds.has(opt.id)
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleOption(opt.id)}
                  className={clx(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                    isEnabled
                      ? "border-ui-border-strong bg-ui-bg-base text-ui-fg-base"
                      : "border-ui-border-base bg-ui-bg-subtle text-ui-fg-muted line-through",
                  )}
                >
                  {type === "color" && <ColorSwatch hex={opt.hex_color} />}
                  {opt.name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductConfigOverridesWidget
