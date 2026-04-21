import { defineField, defineType } from "sanity";

export const instagramGallery = defineType({
  name: "instagramGallery",
  title: "Galeria Instagram (HP)",
  type: "document",
  description:
    "6 zdjęć wyświetlanych w sekcji 'Jesteśmy na Instagramie'. Wybieraj: realizacje w salonach, zbliżenia produktów, behind the scenes. Unikaj: grafik, selfie, powtórzeń.",
  fields: Array.from({ length: 6 }, (_, i) => {
    const n = i + 1;
    return defineField({
      name: `slot${n}`,
      title: `Slot ${n}`,
      type: "object",
      fields: [
        {
          name: "image",
          title: "Zdjęcie",
          type: "image",
          options: { hotspot: true },
          validation: (rule: any) => rule.required(),
          fields: [
            {
              name: "alt",
              title: "Tekst alternatywny",
              type: "string",
              description: "Krótki opis dla czytników ekranu",
            },
          ],
        },
        {
          name: "url",
          title: "Link do posta IG (opcjonalny)",
          type: "url",
        },
      ],
    });
  }),
  preview: {
    prepare() {
      return { title: "Galeria Instagram" };
    },
  },
});
