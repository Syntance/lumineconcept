# Moduł: Produkty

CRUD produktów Medusa — wersja **uogólniona** (bez pól specyficznych dla konkretnej
branży). Pola: nazwa, opis, status (szkic/opublikowany), kategoria, cena, zdjęcia.
Slug (`handle`) generowany z nazwy. Cena trzymana w groszach, w UI w jednostkach głównych.

## Pliki

| Plik | Rola |
| --- | --- |
| `store.ts` | Medusa Admin API: list/get/create/update/delete, kategorie, config sklepu |
| `actions.ts` | Server Actions: zapis, usuwanie, upload zdjęć |
| `product-form.tsx` | Formularz dodawania/edycji + upload |
| `page.tsx` | Lista produktów (`/…/produkty`) |
| `new-product-page.tsx` | Dodawanie (`/…/produkty/nowy`) |
| `edit-product-page.tsx` | Edycja (`/…/produkty/[id]`) |

## Wdrożenie

```ts
// app/<basePath>/(panel)/produkty/page.tsx
export { default, dynamic } from "@magazyn/modules/products/page";

// app/<basePath>/(panel)/produkty/nowy/page.tsx
export { default, dynamic } from "@magazyn/modules/products/new-product-page";

// app/<basePath>/(panel)/produkty/[id]/page.tsx
export { default, dynamic } from "@magazyn/modules/products/edit-product-page";
```

Miniatury używają `next/image` — dodaj host backendu Medusa do `images.remotePatterns`.

## Dodawanie własnych pól produktu

Produkty trzymają dodatkowe atrybuty w `product.metadata`. Aby dodać np. „producent":

1. Rozszerz `ProductFormValues` i mapowanie w `store.ts` (`getAdminProduct` odczyt z metadata,
   `createAdminProduct`/`updateAdminProduct` zapis przez `metadata: { manufacturer: … }`).
2. Dodaj pole w `product-form.tsx` i do schematu Zod w `actions.ts`.

To celowo pominięta, sklepowo-specyficzna część — trzymaj ją poza rdzeniem szablonu.
