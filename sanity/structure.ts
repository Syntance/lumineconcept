import type { StructureResolver } from "sanity/structure";
import { PAGE_CONTEXTS } from "./schemas/objects/page-context";
import { REALIZATION_GALLERY_PAGE } from "./schemas/realization-categories";
import { REALIZATION_GALLERY_DOC_ID } from "./lib/realization-gallery-doc-ids";

/**
 * Realizacje: bezpośrednio dokument galerii zdjęć (strona /sklep/logo-3d).
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Treści")
    .items([
      S.listItem()
        .title("Ustawienia witryny")
        .id("siteSettings")
        .child(
          S.editor()
            .id("siteSettings")
            .schemaType("siteSettings")
            .documentId("siteSettings"),
        ),

      S.divider(),

      S.listItem()
        .title("FAQ")
        .child(
          S.list()
            .title("FAQ — wybierz stronę")
            .items(
              PAGE_CONTEXTS.map(({ value, title }) =>
                S.listItem()
                  .title(title)
                  .id(`faq-page-${value}`)
                  .child(
                    S.documentList()
                      .title(`FAQ — ${title}`)
                      .filter('_type == "faq" && page == $page')
                      .params({ page: value })
                      .defaultOrdering([{ field: "order", direction: "asc" }]),
                  ),
              ),
            ),
        ),

      S.listItem()
        .title("Opinie klientów")
        .child(
          S.list()
            .title("Opinie — wybierz stronę")
            .items(
              PAGE_CONTEXTS.map(({ value, title }) =>
                S.listItem()
                  .title(title)
                  .id(`testimonial-page-${value}`)
                  .child(
                    S.documentList()
                      .title(`Opinie — ${title}`)
                      .filter('_type == "testimonial" && page == $page')
                      .params({ page: value })
                      .defaultOrdering([{ field: "order", direction: "asc" }]),
                  ),
              ),
            ),
        ),

      S.listItem()
        .title("FAQ produktowe")
        .child(
          S.documentTypeList("productFaq")
            .title("FAQ produktowe")
            .filter('_type == "productFaq"')
            .defaultOrdering([
              { field: "productHandle", direction: "asc" },
              { field: "order", direction: "asc" },
            ]),
        ),

      S.divider(),

      S.listItem()
        .title("Realizacje")
        .id(REALIZATION_GALLERY_DOC_ID[REALIZATION_GALLERY_PAGE.value])
        .child(
          S.document()
            .schemaType("realizationGallery")
            .documentId(REALIZATION_GALLERY_DOC_ID[REALIZATION_GALLERY_PAGE.value])
            .title(
              `Zdjęcia: ${REALIZATION_GALLERY_PAGE.title} · ${REALIZATION_GALLERY_PAGE.path}`,
            ),
        ),

      S.divider(),

      S.listItem()
        .title("Logotypy salonów (HP)")
        .child(
          S.documentTypeList("salonLogo")
            .title("Logotypy salonów")
            .defaultOrdering([{ field: "order", direction: "asc" }]),
        ),

      S.divider(),

      S.listItem()
        .title("⋯ Stare realizacje (typ realization — usuń)")
        .id("cleanup-realization-docs")
        .child(
          S.documentTypeList("realization")
            .title("Dokumenty „realization” — usuń; nowe zdjęcia dodawaj powyżej"),
        ),
    ]);
