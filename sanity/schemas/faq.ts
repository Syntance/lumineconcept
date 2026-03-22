import { defineField, defineType } from "sanity";

export const faq = defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  fields: [
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
      rows: 5,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Kategoria",
      type: "string",
      options: {
        list: [
          { title: "Zamówienia", value: "zamowienia" },
          { title: "Dostawa", value: "dostawa" },
          { title: "Płatności", value: "platnosci" },
          { title: "Zwroty", value: "zwroty" },
          { title: "Produkty", value: "produkty" },
          { title: "Personalizacja", value: "personalizacja" },
        ],
      },
    }),
    defineField({
      name: "order",
      title: "Kolejność",
      type: "number",
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
      subtitle: "category",
    },
  },
});
