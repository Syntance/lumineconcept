import { defineField, defineType } from "sanity";

export const shopCategory = defineType({
  name: "shopCategory",
  title: "Kategoria sklepu",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nazwa kategorii",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "icon",
      title: "Emoji / ikona",
      type: "string",
      description: "Emoji wyświetlane na karcie kategorii, np. 📋 🏷️ 🌸",
    }),
    defineField({
      name: "heroImage",
      title: "Zdjęcie hero",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          title: "Tekst alternatywny",
          type: "string",
        },
      ],
    }),
    defineField({
      name: "description",
      title: "Krótki opis",
      type: "string",
      description: "Wyświetlany pod nazwą, np. 'od 89 PLN'",
    }),
    defineField({
      name: "medusaCategoryId",
      title: "ID kategorii w Medusa",
      type: "string",
      description: "Wklej ID kategorii z panelu Medusa (pcat_...)",
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
      title: "name",
      icon: "icon",
      media: "heroImage",
    },
    prepare({ title, icon, media }: { title?: string; icon?: string; media?: any }) {
      return {
        title: `${icon ?? ""} ${title ?? "Kategoria"}`.trim(),
        media,
      };
    },
  },
});
