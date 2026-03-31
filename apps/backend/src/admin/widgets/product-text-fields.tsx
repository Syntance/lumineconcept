import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  Switch,
  IconButton,
  clx,
} from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { PlusMini, Trash, ArrowUpMini, ArrowDownMini } from "@medusajs/icons"
import { sdk } from "../lib/sdk"

interface TextField {
  key: string
  label: string
  placeholder: string
  required: boolean
  maxLength: number
  multiline: boolean
}

const EMPTY_FIELD: TextField = {
  key: "",
  label: "",
  placeholder: "",
  required: false,
  maxLength: 200,
  multiline: false,
}

function generateKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[ąàáâãä]/g, "a")
    .replace(/[ćçč]/g, "c")
    .replace(/[ęèéêë]/g, "e")
    .replace(/[łℓ]/g, "l")
    .replace(/[ńñ]/g, "n")
    .replace(/[óòôõö]/g, "o")
    .replace(/[śšş]/g, "s")
    .replace(/[żźž]/g, "z")
    .replace(/[ůüúùû]/g, "u")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
}

const ProductTextFieldsWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const [fields, setFields] = useState<TextField[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    sdk.client
      .fetch<{ text_fields: TextField[] }>(
        `/admin/products/${product.id}/text-fields`,
        { method: "GET" }
      )
      .then((res) => {
        if (Array.isArray(res.text_fields) && res.text_fields.length > 0) {
          setFields(
            res.text_fields.map((f: any) => ({
              key: f.key ?? "",
              label: f.label ?? "",
              placeholder: f.placeholder ?? "",
              required: !!f.required,
              maxLength: f.maxLength ?? 200,
              multiline: !!f.multiline,
            }))
          )
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [product.id])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const cleaned = fields
        .filter((f) => f.key && f.label)
        .map((f) => ({
          key: f.key,
          label: f.label,
          ...(f.placeholder ? { placeholder: f.placeholder } : {}),
          ...(f.required ? { required: true } : {}),
          ...(f.maxLength !== 200 ? { maxLength: f.maxLength } : {}),
          ...(f.multiline ? { multiline: true } : {}),
        }))

      await sdk.client.fetch(
        `/admin/products/${product.id}/text-fields`,
        {
          method: "POST",
          body: { text_fields: cleaned },
        }
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
  }, [fields, product.id])

  const updateField = (index: number, patch: Partial<TextField>) => {
    setFields((prev) => {
      const next = [...prev]
      const updated = { ...next[index], ...patch }
      if ("label" in patch && patch.label != null) {
        const currentKey = next[index].key
        const autoKey = generateKey(next[index].label)
        if (!currentKey || currentKey === autoKey) {
          updated.key = generateKey(patch.label)
        }
      }
      next[index] = updated
      return next
    })
    setDirty(true)
  }

  const addField = () => {
    setFields((prev) => [...prev, { ...EMPTY_FIELD }])
    setDirty(true)
  }

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
    setDirty(true)
  }

  const moveField = (index: number, dir: -1 | 1) => {
    setFields((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setDirty(true)
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted">
            Ładowanie…
          </Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Pola tekstowe (personalizacja)</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-0.5">
            Definiuj pola, które klient wypełnia w konfiguratorze produktu
          </Text>
        </div>
        <div className="flex items-center gap-2">
          {toast && (
            <Text
              size="small"
              className={clx(
                "transition-opacity",
                toast === "Zapisano!" ? "text-ui-fg-interactive" : "text-ui-fg-error"
              )}
            >
              {toast}
            </Text>
          )}
          <Button
            variant="secondary"
            size="small"
            onClick={addField}
          >
            <PlusMini />
            Dodaj pole
          </Button>
          {dirty && (
            <Button
              size="small"
              onClick={save}
              isLoading={saving}
            >
              Zapisz
            </Button>
          )}
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Text size="small" className="text-ui-fg-muted">
            Brak zdefiniowanych pól tekstowych.
          </Text>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Dodaj pole, aby klient mógł wpisywać własne teksty w konfiguratorze.
          </Text>
        </div>
      ) : (
        <div className="divide-y">
          {fields.map((field, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <Label size="xsmall" className="mb-1">
                      Tytuł pola *
                    </Label>
                    <Input
                      size="small"
                      placeholder="np. Tekst na górze"
                      value={field.label}
                      onChange={(e) =>
                        updateField(index, { label: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label size="xsmall" className="mb-1">
                      Klucz (auto)
                    </Label>
                    <Input
                      size="small"
                      placeholder="tekst_na_gorze"
                      value={field.key}
                      onChange={(e) =>
                        updateField(index, { key: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label size="xsmall" className="mb-1">
                      Placeholder
                    </Label>
                    <Input
                      size="small"
                      placeholder="np. Wpisz nazwę salonu…"
                      value={field.placeholder}
                      onChange={(e) =>
                        updateField(index, { placeholder: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-6 col-span-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) =>
                          updateField(index, { required: checked })
                        }
                      />
                      <Label size="xsmall">Wymagane</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={field.multiline}
                        onCheckedChange={(checked) =>
                          updateField(index, { multiline: checked })
                        }
                      />
                      <Label size="xsmall">Wieloliniowe</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label size="xsmall">Maks. znaków:</Label>
                      <Input
                        size="small"
                        type="number"
                        className="w-20"
                        min={1}
                        max={1000}
                        value={field.maxLength}
                        onChange={(e) =>
                          updateField(index, {
                            maxLength: parseInt(e.target.value) || 200,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 pt-5">
                  <IconButton
                    size="small"
                    variant="transparent"
                    onClick={() => moveField(index, -1)}
                    disabled={index === 0}
                  >
                    <ArrowUpMini />
                  </IconButton>
                  <IconButton
                    size="small"
                    variant="transparent"
                    onClick={() => moveField(index, 1)}
                    disabled={index === fields.length - 1}
                  >
                    <ArrowDownMini />
                  </IconButton>
                  <IconButton
                    size="small"
                    variant="transparent"
                    onClick={() => removeField(index)}
                  >
                    <Trash />
                  </IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductTextFieldsWidget
