import { defineField, defineType } from "sanity";

export const seo = defineType({
  name: "seo",
  title: "SEO & Meta",
  type: "object",
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta Title",
      type: "string",
      description: "Tytuł strony widoczny w wynikach wyszukiwania (maks. 70 znaków)",
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      rows: 3,
      description: "Opis strony widoczny w wynikach wyszukiwania (maks. 160 znaków)",
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: "ogTitle",
      title: "OG Title",
      type: "string",
      description: "Tytuł wyświetlany przy udostępnianiu w social media (jeśli pusty — użyty Meta Title)",
    }),
    defineField({
      name: "ogDescription",
      title: "OG Description",
      type: "text",
      rows: 2,
      description: "Opis wyświetlany przy udostępnianiu w social media",
    }),
    defineField({
      name: "ogImage",
      title: "OG Image",
      type: "image",
      description: "Zdjęcie wyświetlane przy udostępnianiu (1200x630px zalecane)",
      options: { hotspot: true },
    }),
    defineField({
      name: "canonicalUrl",
      title: "Canonical URL",
      type: "url",
      description: "Adres kanoniczny (jeśli strona jest dostępna pod wieloma URL-ami)",
    }),
    defineField({
      name: "noIndex",
      title: "No Index",
      type: "boolean",
      description: "Ukryj stronę w wynikach wyszukiwania",
      initialValue: false,
    }),
    defineField({
      name: "noFollow",
      title: "No Follow",
      type: "boolean",
      description: "Nie śledź linków na tej stronie",
      initialValue: false,
    }),
  ],
});
