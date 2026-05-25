import { defineArrayMember, defineField, defineType } from "sanity";

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
        { name: "shippingLabel", title: "Label wysyłki", type: "string", initialValue: "Realizacja ok. 10 dni rob." },
      ],
    }),

    defineField({
      name: "checkoutCallout",
      title: "Callout przed dodaniem do koszyka / zakupem",
      type: "object",
      group: "general",
      description:
        "Komunikat wyświetlany po kliknięciu „Dodaj do koszyka” lub „Kup teraz” na stronie produktu.",
      fields: [
        {
          name: "enabled",
          title: "Włączony",
          type: "boolean",
          initialValue: true,
        },
        {
          name: "title",
          title: "Nagłówek",
          type: "string",
          initialValue: "UWAGA",
        },
        {
          name: "message",
          title: "Treść komunikatu",
          type: "text",
          rows: 4,
          initialValue:
            "Nie ingerujemy w przesłany tekst. Prosimy o dokładne sprawdzenie poprawności treści.",
        },
        {
          name: "confirmLabel",
          title: "Tekst przycisku potwierdzenia",
          type: "string",
          initialValue: "Rozumiem, kontynuuj",
        },
      ],
    }),

    defineField({
      name: "homepageInstagramPosts",
      title: "Instagram — kafelki na stronie głównej",
      type: "array",
      group: "social",
      description:
        "Do 6 miniaturek pod nagłówkiem „Jesteśmy na Instagramie”. Wgraj obraz (np. zrzut posta) i wklej link do postu/reels — bez konfiguracji Meta API.",
      validation: (rule) => rule.max(6),
      of: [
        defineArrayMember({
          type: "object",
          name: "homepageInstagramPostTile",
          title: "Post",
          fields: [
            defineField({
              name: "image",
              title: "Miniatura",
              type: "image",
              options: { hotspot: true },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "postUrl",
              title: "Link do posta (Instagram)",
              type: "url",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "alt",
              title: "Krótki opis (dostępność)",
              type: "string",
            }),
          ],
          preview: {
            select: { url: "postUrl", media: "image" },
            prepare({ url, media }) {
              return {
                title: url ? String(url).slice(0, 48) : "Post",
                subtitle: "Instagram",
                media,
              };
            },
          },
        }),
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
