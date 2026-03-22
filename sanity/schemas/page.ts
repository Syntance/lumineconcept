import { defineField, defineType } from "sanity";

export const page = defineType({
  name: "page",
  title: "Podstrona",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Tytuł strony",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Treść",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              title: "Tekst alternatywny",
              type: "string",
            },
            {
              name: "caption",
              title: "Podpis",
              type: "string",
            },
          ],
        },
      ],
    }),
    defineField({
      name: "seo",
      title: "SEO & Meta",
      type: "seo",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "slug.current",
    },
  },
});
