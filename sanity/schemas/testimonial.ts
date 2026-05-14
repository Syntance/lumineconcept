import { defineField, defineType } from "sanity";
import type { PreviewValue } from "sanity";
import { PAGE_CONTEXT_OPTIONS, PAGE_CONTEXTS } from "./objects/page-context";

export const testimonial = defineType({
  name: "testimonial",
  title: "Opinia klienta",
  type: "document",
  fields: [
    defineField({
      name: "page",
      title: "Strona",
      type: "string",
      description: "Na której stronie ma się pojawić ta opinia. \"Globalnie\" = wszędzie.",
      options: { list: PAGE_CONTEXT_OPTIONS, layout: "dropdown" },
      initialValue: "global",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "name",
      title: "Imię i nazwisko",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "Stanowisko",
      type: "string",
      description: "np. Właścicielka, Manager",
    }),
    defineField({
      name: "company",
      title: "Nazwa firmy/salonu",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "quote",
      title: "Opinia",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required().max(500),
    }),
    defineField({
      name: "image",
      title: "Zdjęcie",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Tekst alternatywny",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "rating",
      title: "Ocena (1-5)",
      type: "number",
      validation: (rule) => rule.required().min(1).max(5),
      initialValue: 5,
    }),
    defineField({
      name: "order",
      title: "Kolejność",
      type: "number",
      initialValue: 10,
    }),
  ],
  orderings: [
    { title: "Kolejność", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "name", subtitle: "company", page: "page", media: "image" },
    prepare({
      title,
      subtitle,
      page,
      media,
    }: {
      title?: string;
      subtitle?: string;
      page?: string;
      media?: unknown;
    }): PreviewValue {
      const pageTitle = PAGE_CONTEXTS.find((p) => p.value === page)?.title ?? page ?? "—";
      return {
        title: title ?? "Opinia",
        subtitle: `${subtitle ?? ""}${subtitle ? "  •  " : ""}${pageTitle}`,
        ...(media != null
          ? { media: media as PreviewValue["media"] }
          : {}),
      };
    },
  },
});
