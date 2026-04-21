import { defineField, defineType } from "sanity";

export const salonLogo = defineType({
  name: "salonLogo",
  title: "Logo salonu (karuzela)",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nazwa salonu",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logotyp",
      type: "image",
      description: "PNG z przezroczystym tłem. Jeśli puste — wyświetli się nazwa tekstem.",
      options: { hotspot: false },
    }),
    defineField({
      name: "order",
      title: "Kolejność",
      type: "number",
      description: "Mniejsza liczba = wcześniej w karuzeli",
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
      title: "name",
      order: "order",
      media: "logo",
    },
    prepare({ title, order, media }: { title?: string; order?: number; media?: any }) {
      return {
        title: title ?? "Salon",
        subtitle: `Kolejność: ${order ?? "—"}`,
        media,
      };
    },
  },
});
