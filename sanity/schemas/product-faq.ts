import { defineField, defineType } from "sanity";

export const productFaq = defineType({
  name: "productFaq",
  title: "FAQ produktowe",
  type: "document",
  fields: [
    defineField({
      name: "productHandle",
      title: "Handle produktu (Medusa)",
      type: "string",
      description: "Slug produktu z Medusa, np. 'cennik-uslug-salon-fryzjerski'",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "question",
      title: "Pytanie",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "answer",
      title: "Odpowiedź",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Kolejność",
      type: "number",
      initialValue: 10,
    }),
  ],
  orderings: [
    {
      title: "Kolejność",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "question",
      subtitle: "productHandle",
    },
  },
});
