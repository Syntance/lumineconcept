import { defineArrayMember, defineField, defineType } from "sanity";
import type { PreviewValue } from "sanity";

/**
 * Zdjęcia realizacji dla /sklep/logo-3d (jedyny outlet na froncie).
 */
export const realizationGallery = defineType({
  name: "realizationGallery",
  title: "Zdjęcia realizacji",
  type: "document",
  fields: [
    defineField({
      name: "photos",
      title: "Zdjęcia",
      type: "array",
      description: "Przeciągnij tutaj kilka plików naraz albo dodawaj kolejne kafelki — kolejność = kolejność na stronie.",
      options: {
        layout: "grid",
      },
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
        }),
      ],
    }),
  ],
  preview: {
    select: { photos: "photos" },
    prepare({ photos }: { photos?: unknown[] | null }): PreviewValue {
      const n = Array.isArray(photos) ? photos.length : 0;
      const media = photos?.[0];
      return {
        title: n === 0 ? "Brak zdjęć" : `${n} zdjęć`,
        ...(media != null
          ? { media: media as PreviewValue["media"] }
          : {}),
      };
    },
  },
});
