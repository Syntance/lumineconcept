import { defineField, defineType } from "sanity";

export const testimonial = defineType({
  name: "testimonial",
  title: "Opinia klienta",
  type: "document",
  fields: [
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
        {
          name: "alt",
          title: "Tekst alternatywny",
          type: "string",
        },
      ],
    }),
    defineField({
      name: "rating",
      title: "Ocena (1-5)",
      type: "number",
      validation: (rule) => rule.required().min(1).max(5),
      initialValue: 5,
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "company",
      media: "image",
    },
  },
});
