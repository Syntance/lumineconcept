import { defineField, defineType } from "sanity";
import { PAGE_CONTEXT_OPTIONS, PAGE_CONTEXTS } from "./objects/page-context";

export const faq = defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  fields: [
    defineField({
      name: "page",
      title: "Strona",
      type: "string",
      description: "Na której stronie ma się pojawić to pytanie. \"Globalnie\" = wszędzie.",
      options: { list: PAGE_CONTEXT_OPTIONS, layout: "dropdown" },
      initialValue: "global",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "question",
      title: "Pytanie",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "answer",
      title: "Odpowiedź",
      type: "text",
      rows: 5,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Kolejność",
      type: "number",
      initialValue: 10,
    }),
  ],
  orderings: [
    { title: "Kolejność", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "question", page: "page", order: "order" },
    prepare({ title, page, order }: { title?: string; page?: string; order?: number }) {
      const pageTitle = PAGE_CONTEXTS.find((p) => p.value === page)?.title ?? page ?? "—";
      return {
        title: title ?? "Pytanie",
        subtitle: `${pageTitle}  •  Kolejność: ${order ?? "—"}`,
      };
    },
  },
});
