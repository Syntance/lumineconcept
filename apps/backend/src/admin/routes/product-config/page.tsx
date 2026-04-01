import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  Switch,
  IconButton,
  Tabs,
  clx,
} from "@medusajs/ui"
import { PlusMini, Trash, ArrowUpMini, ArrowDownMini, Swatch } from "@medusajs/icons"
import { useCallback, useEffect, useState } from "react"
import { sdk } from "../../lib/sdk"

interface ConfigOption {
  id: string
  type: string
  name: string
  hex_color: string | null
  color_category: string | null
  mat_allowed: boolean
  sort_order: number
  metadata: Record<string, unknown> | null
}

type OptionType = "color" | "size" | "material" | "led" | "finish"

const TYPE_LABELS: Record<OptionType, string> = {
  color: "Kolory",
  size: "Rozmiary",
  material: "Materiały",
  led: "LED",
  finish: "Wykończenia",
}

function ColorSwatch({ hex }: { hex: string | null }) {
  if (!hex || hex === "transparent") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-ui-border-strong">
        <span className="text-[8px] text-ui-fg-muted">∅</span>
      </span>
    )
  }
  return (
    <span
      className="inline-block h-6 w-6 rounded-full border border-ui-border-base"
      style={{ backgroundColor: hex }}
    />
  )
}

function OptionRow({
  option,
  isColor,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  option: ConfigOption
  isColor: boolean
  onUpdate: (id: string, patch: Partial<ConfigOption>) => void
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-3">
      {isColor && <ColorSwatch hex={option.hex_color} />}

      <div className="flex-1 grid gap-3" style={{ gridTemplateColumns: isColor ? "1fr 120px 120px" : "1fr" }}>
        <div>
          <Input
            size="small"
            placeholder="Nazwa"
            value={option.name}
            onChange={(e) => onUpdate(option.id, { name: e.target.value })}
          />
        </div>
        {isColor && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={option.hex_color && option.hex_color !== "transparent" ? option.hex_color : "#000000"}
                onChange={(e) => onUpdate(option.id, { hex_color: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border border-ui-border-base"
              />
              <Input
                size="small"
                placeholder="#000000"
                value={option.hex_color ?? ""}
                onChange={(e) => onUpdate(option.id, { hex_color: e.target.value })}
                className="w-24"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={option.color_category ?? "standard"}
                onChange={(e) => onUpdate(option.id, { color_category: e.target.value })}
                className="rounded border border-ui-border-base bg-ui-bg-field px-2 py-1 text-sm"
              >
                <option value="standard">Standardowy</option>
                <option value="color">Kolorowy</option>
                <option value="mirror">Lustrzany</option>
              </select>
              <div className="flex items-center gap-1">
                <Switch
                  checked={option.mat_allowed}
                  onCheckedChange={(checked) => onUpdate(option.id, { mat_allowed: checked })}
                />
                <Label size="xsmall">Mat</Label>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <IconButton size="small" variant="transparent" onClick={() => onMoveUp(option.id)} disabled={isFirst}>
          <ArrowUpMini />
        </IconButton>
        <IconButton size="small" variant="transparent" onClick={() => onMoveDown(option.id)} disabled={isLast}>
          <ArrowDownMini />
        </IconButton>
        <IconButton size="small" variant="transparent" onClick={() => onDelete(option.id)}>
          <Trash />
        </IconButton>
      </div>
    </div>
  )
}

function OptionTypePanel({ type }: { type: OptionType }) {
  const isColor = type === "color"
  const [options, setOptions] = useState<ConfigOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    sdk.client
      .fetch<{ config_options: ConfigOption[] }>(`/admin/product-config?type=${type}`, { method: "GET" })
      .then((res) => setOptions(res.config_options))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [type])

  const showToast = (msg: string, ms = 2000) => {
    setToast(msg)
    setTimeout(() => setToast(null), ms)
  }

  const addOption = () => {
    const newOption: ConfigOption = {
      id: `_new_${Date.now()}`,
      type,
      name: "",
      hex_color: isColor ? "#000000" : null,
      color_category: isColor ? "standard" : null,
      mat_allowed: true,
      sort_order: options.length,
      metadata: null,
    }
    setOptions((prev) => [...prev, newOption])
    setDirty(true)
  }

  const updateOption = (id: string, patch: Partial<ConfigOption>) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
    setDirty(true)
  }

  const deleteOption = (id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id))
    setDirty(true)
  }

  const moveOption = (id: string, dir: -1 | 1) => {
    setOptions((prev) => {
      const idx = prev.findIndex((o) => o.id === id)
      if (idx < 0) return prev
      const target = idx + dir
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
    setDirty(true)
  }

  const saveAll = useCallback(async () => {
    setSaving(true)
    try {
      const valid = options.filter((o) => o.name.trim())

      for (let i = 0; i < valid.length; i++) {
        const o = valid[i]
        const payload = {
          type: o.type,
          name: o.name.trim(),
          hex_color: o.hex_color,
          color_category: o.color_category,
          mat_allowed: o.mat_allowed,
          sort_order: i,
          metadata: o.metadata,
        }

        if (o.id.startsWith("_new_")) {
          const res = await sdk.client.fetch<{ config_option: ConfigOption }>(
            "/admin/product-config",
            { method: "POST", body: payload },
          )
          o.id = res.config_option.id
        } else {
          await sdk.client.fetch(`/admin/product-config/${o.id}`, {
            method: "POST",
            body: payload,
          })
        }
        o.sort_order = i
      }

      const currentIds = new Set(valid.map((o) => o.id))
      const allServer = await sdk.client.fetch<{ config_options: ConfigOption[] }>(
        `/admin/product-config?type=${type}`,
        { method: "GET" },
      )
      for (const serverOpt of allServer.config_options) {
        if (!currentIds.has(serverOpt.id)) {
          await sdk.client.fetch(`/admin/product-config/${serverOpt.id}`, {
            method: "DELETE",
          })
        }
      }

      setOptions(valid)
      setDirty(false)
      showToast("Zapisano!")
    } catch {
      showToast("Błąd zapisu")
    } finally {
      setSaving(false)
    }
  }, [options, type])

  const seedColors = useCallback(async () => {
    setSeeding(true)
    try {
      const res = await sdk.client.fetch<{ config_options?: ConfigOption[]; message: string }>(
        "/admin/product-config/seed",
        { method: "POST" },
      )
      if (res.config_options) {
        setOptions(res.config_options)
        setDirty(false)
      }
      showToast(res.message, 3000)
    } catch {
      showToast("Błąd seedowania")
    } finally {
      setSeeding(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="px-6 py-8 text-center">
        <Text size="small" className="text-ui-fg-muted">Ładowanie…</Text>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4 border-b border-ui-border-base">
        <Text size="small" className="text-ui-fg-subtle">
          {options.length} {options.length === 1 ? "opcja" : "opcji"}
        </Text>
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
          {isColor && options.length === 0 && (
            <Button variant="secondary" size="small" onClick={seedColors} isLoading={seeding}>
              Załaduj domyślne kolory
            </Button>
          )}
          <Button variant="secondary" size="small" onClick={addOption}>
            <PlusMini />
            Dodaj
          </Button>
          {dirty && (
            <Button size="small" onClick={saveAll} isLoading={saving}>
              Zapisz wszystko
            </Button>
          )}
        </div>
      </div>

      {options.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Text size="small" className="text-ui-fg-muted">
            Brak zdefiniowanych opcji. Kliknij „Dodaj" aby rozpocząć.
          </Text>
        </div>
      ) : isColor ? (
        (() => {
          const CATEGORY_ORDER = ["standard", "color", "mirror"] as const
          const CATEGORY_LABELS: Record<string, string> = {
            standard: "Standardowe",
            color: "Kolorowe",
            mirror: "Lustrzane",
          }
          const grouped = new Map<string, ConfigOption[]>()
          for (const cat of CATEGORY_ORDER) grouped.set(cat, [])
          for (const o of options) {
            const cat = o.color_category ?? "standard"
            if (!grouped.has(cat)) grouped.set(cat, [])
            grouped.get(cat)!.push(o)
          }
          return (
            <div className="divide-y divide-ui-border-base">
              {CATEGORY_ORDER.map((cat) => {
                const catOptions = grouped.get(cat) ?? []
                if (catOptions.length === 0) return null
                return (
                  <div key={cat}>
                    <div className="px-6 pt-4 pb-1">
                      <Text size="small" weight="plus" className="text-ui-fg-subtle uppercase tracking-wider">
                        {CATEGORY_LABELS[cat] ?? cat}
                      </Text>
                    </div>
                    {catOptions.map((option, idx) => (
                      <OptionRow
                        key={option.id}
                        option={option}
                        isColor
                        onUpdate={updateOption}
                        onDelete={deleteOption}
                        onMoveUp={(id) => moveOption(id, -1)}
                        onMoveDown={(id) => moveOption(id, 1)}
                        isFirst={idx === 0}
                        isLast={idx === catOptions.length - 1}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })()
      ) : (
        <div className="divide-y divide-ui-border-base">
          {options.map((option, idx) => (
            <OptionRow
              key={option.id}
              option={option}
              isColor={false}
              onUpdate={updateOption}
              onDelete={deleteOption}
              onMoveUp={(id) => moveOption(id, -1)}
              onMoveDown={(id) => moveOption(id, 1)}
              isFirst={idx === 0}
              isLast={idx === options.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const ProductConfigPage = () => {
  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Globalna konfiguracja produktów</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          Zarządzaj dostępnymi opcjami konfiguracji (kolory, rozmiary, materiały) dla wszystkich produktów.
          Każdy produkt dziedziczy te opcje domyślnie — możesz wyłączyć poszczególne opcje na stronie produktu.
        </Text>
      </div>

      <Tabs defaultValue="color">
        <Tabs.List className="px-6">
          {(Object.entries(TYPE_LABELS) as [OptionType, string][]).map(([key, label]) => (
            <Tabs.Trigger key={key} value={key}>
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {(Object.keys(TYPE_LABELS) as OptionType[]).map((key) => (
          <Tabs.Content key={key} value={key}>
            <OptionTypePanel type={key} />
          </Tabs.Content>
        ))}
      </Tabs>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Konfiguracja produktów",
  icon: Swatch,
})

export default ProductConfigPage
