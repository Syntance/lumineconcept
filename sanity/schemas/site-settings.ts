import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Ustawienia strony",
  type: "document",
  groups: [
    { name: "general", title: "Ogólne", default: true },
    { name: "seo", title: "SEO" },
    { name: "social", title: "Social Media" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Tytuł strony",
      type: "string",
      group: "general",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Opis strony",
      type: "text",
      rows: 3,
      group: "general",
    }),
    defineField({
      name: "announcementBar",
      title: "Pasek informacyjny",
      type: "object",
      group: "general",
      fields: [
        {
          name: "enabled",
          title: "Włączony",
          type: "boolean",
          initialValue: true,
        },
        {
          name: "text",
          title: "Tekst",
          type: "string",
        },
        {
          name: "link",
          title: "Link (opcjonalnie)",
          type: "string",
        },
      ],
    }),
    defineField({
      name: "footerText",
      title: "Tekst stopki",
      type: "text",
      rows: 2,
      group: "general",
    }),

    defineField({
      name: "seo",
      title: "Globalne SEO",
      type: "seo",
      group: "seo",
      description: "Domyślne meta tagi dla całej strony (nadpisywane przez SEO poszczególnych podstron)",
    }),
    defineField({
      name: "titleTemplate",
      title: "Szablon tytułu",
      type: "string",
      group: "seo",
      description: 'Szablon dla tytułów podstron, np. "%s | Lumine Concept". %s zostanie zastąpione tytułem podstrony.',
      initialValue: "%s | Lumine Concept",
    }),
    defineField({
      name: "defaultOgImage",
      title: "Domyślne zdjęcie OG",
      type: "image",
      group: "seo",
      description: "Używane gdy podstrona nie ma własnego OG Image (1200x630px)",
      options: { hotspot: true },
    }),
    defineField({
      name: "googleSiteVerification",
      title: "Google Site Verification",
      type: "string",
      group: "seo",
      description: "Kod weryfikacji Google Search Console",
    }),

    defineField({
      name: "trustBar",
      title: "Trust Bar (statystyki)",
      type: "object",
      group: "general",
      description: "Statystyki wyświetlane na HP, /sklep i innych podstronach",
      fields: [
        { name: "followers", title: "Obserwujący", type: "string", initialValue: "25 000+" },
        { name: "realizations", title: "Realizacje", type: "string", initialValue: "6 000+" },
        { name: "shippingLabel", title: "Label wysyłki", type: "string", initialValue: "Express wysyłka" },
      ],
    }),

    defineField({
      name: "socialLinks",
      title: "Linki do social media",
      type: "object",
      group: "social",
      fields: [
        { name: "instagram", title: "Instagram URL", type: "url" },
        { name: "facebook", title: "Facebook URL", type: "url" },
        { name: "tiktok", title: "TikTok URL", type: "url" },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
  },
});
