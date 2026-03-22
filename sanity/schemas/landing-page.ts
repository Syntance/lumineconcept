import { defineField, defineType } from "sanity";

export const landingPage = defineType({
  name: "landingPage",
  title: "Landing Page",
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
      name: "hero",
      title: "Sekcja Hero",
      type: "object",
      fields: [
        defineField({
          name: "heading",
          title: "Nagłówek",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "subheading",
          title: "Podnagłówek",
          type: "text",
          rows: 2,
        }),
        defineField({
          name: "image",
          title: "Zdjęcie tła",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({
          name: "ctaText",
          title: "Tekst CTA",
          type: "string",
        }),
        defineField({
          name: "ctaLink",
          title: "Link CTA",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "sections",
      title: "Sekcje treści",
      type: "array",
      of: [
        {
          type: "object",
          name: "textBlock",
          title: "Blok tekstowy",
          fields: [
            { name: "heading", title: "Nagłówek", type: "string" },
            { name: "body", title: "Treść", type: "array", of: [{ type: "block" }] },
            {
              name: "image",
              title: "Zdjęcie",
              type: "image",
              options: { hotspot: true },
            },
          ],
        },
        {
          type: "object",
          name: "featureGrid",
          title: "Siatka cech",
          fields: [
            { name: "heading", title: "Nagłówek", type: "string" },
            {
              name: "items",
              title: "Elementy",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "title", title: "Tytuł", type: "string" },
                    { name: "description", title: "Opis", type: "text", rows: 2 },
                    { name: "icon", title: "Ikona (nazwa)", type: "string" },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "object",
          name: "ctaBanner",
          title: "Banner CTA",
          fields: [
            { name: "heading", title: "Nagłówek", type: "string" },
            { name: "body", title: "Treść", type: "text", rows: 2 },
            { name: "ctaText", title: "Tekst CTA", type: "string" },
            { name: "ctaLink", title: "Link CTA", type: "string" },
          ],
        },
      ],
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      fields: [
        { name: "title", title: "Tytuł SEO", type: "string" },
        { name: "description", title: "Opis SEO", type: "text", rows: 2 },
        { name: "image", title: "Zdjęcie OG", type: "image" },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "slug.current",
    },
  },
});
