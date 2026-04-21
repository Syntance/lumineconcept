import { defineField, defineType } from "sanity";

export const instagramPost = defineType({
  name: "instagramPost",
  title: "Zdjęcie IG (feed na stronie)",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Zdjęcie",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
      fields: [
        {
          name: "alt",
          title: "Tekst alternatywny",
          type: "string",
          description: "Krótki opis dla czytników ekranu",
        },
      ],
    }),
    defineField({
      name: "url",
      title: "Link do posta (opcjonalny)",
      type: "url",
      description: "Jeśli puste — cały feed linkuje do profilu @lumineconcept",
    }),
    defineField({
      name: "order",
      title: "Kolejność",
      type: "number",
      description: "Mniejsza liczba = wyżej w siatce (1, 2, 3…)",
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
      title: "image.alt",
      order: "order",
      media: "image",
    },
    prepare({
      title,
      order,
      media,
    }: {
      title?: string;
      order?: number;
      media?: any;
    }) {
      return {
        title: title ?? "Zdjęcie IG",
        subtitle: `Kolejność: ${order ?? "—"}`,
        media,
      };
    },
  },
});
