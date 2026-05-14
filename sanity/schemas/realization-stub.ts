import { defineField, defineType } from "sanity";
import type { PreviewValue } from "sanity";

/**
 * **Tylko kompatybilność.** Nadal mogą istnieć dokumenty `_type == "realization"`
 * (szkice, nieopublikowane wpisy, zapisany deep link w przeglądarce).
 *
 * Bez tego schematu Sanity Studio wyświetla: „Schema type for 'realization' not found”.
 *
 * **Nie twórz nowych realizacji tutaj** — używaj **Galerii realizacji**
 * (Treści → Realizacje → kategoria). Stare wpisy znajdziesz w „⋯ Stare realizacje”
 * i usuń je, żeby posprzątać dane.
 */
export const realizationStub = defineType({
  name: "realization",
  title: "Realizacja — stary typ (usuń wpis)",
  type: "document",
  fields: [
    defineField({
      name: "category",
      title: "Kategoria (stare)",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "image",
      title: "Zdjęcie",
      type: "image",
      readOnly: true,
    }),
    defineField({
      name: "order",
      title: "Kolejność",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "title",
      title: "Tytuł (stare)",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "linkUrl",
      title: "Link (stare)",
      type: "url",
      readOnly: true,
    }),
    defineField({
      name: "productHandle",
      title: "Handle produktu (stare)",
      type: "string",
      readOnly: true,
    }),
  ],
  preview: {
    select: { media: "image", category: "category" },
    prepare({
      media,
      category,
    }: {
      media?: unknown;
      category?: string;
    }): PreviewValue {
      return {
        title: "Stary typ — usuń ten dokument",
        subtitle: category ?? "",
        ...(media != null
          ? { media: media as PreviewValue["media"] }
          : {}),
      };
    },
  },
});
