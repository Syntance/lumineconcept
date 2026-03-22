import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Ustawienia strony",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Tytuł strony",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Opis strony (SEO)",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "announcementBar",
      title: "Pasek informacyjny",
      type: "object",
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
      name: "socialLinks",
      title: "Linki do social media",
      type: "object",
      fields: [
        { name: "instagram", title: "Instagram URL", type: "url" },
        { name: "facebook", title: "Facebook URL", type: "url" },
        { name: "tiktok", title: "TikTok URL", type: "url" },
      ],
    }),
    defineField({
      name: "footerText",
      title: "Tekst stopki",
      type: "text",
      rows: 2,
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
  },
});
