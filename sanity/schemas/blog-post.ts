import { defineField, defineType } from "sanity";

export const blogPost = defineType({
  name: "blogPost",
  title: "Artykuł blogowy",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Tytuł",
      type: "string",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Zajawka",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(300),
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
      name: "coverImage",
      title: "Zdjęcie okładkowe",
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
      name: "category",
      title: "Kategoria",
      type: "string",
      options: {
        list: [
          { title: "Inspiracje", value: "inspiracje" },
          { title: "Porady", value: "porady" },
          { title: "Realizacje", value: "realizacje" },
          { title: "Trendy beauty", value: "trendy-beauty" },
          { title: "Branding", value: "branding" },
        ],
      },
    }),
    defineField({
      name: "author",
      title: "Autor",
      type: "string",
    }),
    defineField({
      name: "publishedAt",
      title: "Data publikacji",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "seo",
      title: "SEO & Meta",
      type: "seo",
      description: "Jeśli puste, użyte zostaną tytuł artykułu i zajawka",
    }),
  ],
  orderings: [
    {
      title: "Data publikacji (najnowsze)",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "category",
      media: "coverImage",
    },
  },
});
