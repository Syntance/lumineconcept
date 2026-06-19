import { describe, expect, it } from "vitest";
import {
  buildActiveCategoryListingHref,
  buildShopListingBreadcrumbs,
  buildShopProductBreadcrumbs,
  categoryIdFromListingPath,
  categoryListingHref,
  listingCategoryHandleFromPathname,
} from "@/lib/medusa/shop-breadcrumbs";
import type { CategoryTreeNode } from "@/lib/medusa/category-tree";

const tree: CategoryTreeNode[] = [
  {
    id: "root-gw",
    handle: "gotowe-wzory",
    name: "Gotowe wzory",
    category_children: [
      { id: "cat-cenniki", handle: "cenniki", name: "Cenniki" },
      { id: "cat-certyfikaty", handle: "certyfikaty", name: "Certyfikaty" },
    ],
  },
  {
    id: "root-logo",
    handle: "logo-3d",
    name: "Logo 3D",
    category_children: [],
  },
];

describe("buildShopListingBreadcrumbs", () => {
  it("pokazuje root listingu bez aktywnej podkategorii", () => {
    const items = buildShopListingBreadcrumbs({
      tree,
      listingRootHandle: "gotowe-wzory",
      listingBasePath: "/sklep/gotowe-wzory",
      activeCategoryId: "root-gw",
    });

    expect(items.map((i) => i.label)).toEqual([
      "Strona główna",
      "Sklep",
      "Gotowe wzory",
    ]);
    expect(items.at(-1)?.href).toBeUndefined();
  });

  it("pokazuje aktywną podkategorię zamiast roota", () => {
    const items = buildShopListingBreadcrumbs({
      tree,
      listingRootHandle: "gotowe-wzory",
      listingBasePath: "/sklep/gotowe-wzory",
      activeCategoryId: "cat-cenniki",
    });

    expect(items.map((i) => i.label)).toEqual([
      "Strona główna",
      "Sklep",
      "Cenniki",
    ]);
    expect(items.at(-1)?.href).toBeUndefined();
  });
});

describe("buildShopProductBreadcrumbs", () => {
  it("linkuje do podkategorii jako segment ścieżki na PDP", () => {
    const items = buildShopProductBreadcrumbs({
      productTitle: "Cennik A4",
      tree,
      listingRootHandle: "gotowe-wzory",
      listingBasePath: "/sklep/gotowe-wzory",
      productCategories: [{ id: "cat-cenniki", handle: "cenniki", name: "Cenniki" }],
    });

    expect(items.map((i) => i.label)).toEqual([
      "Strona główna",
      "Sklep",
      "Cenniki",
      "Cennik A4",
    ]);
    expect(items[2]?.href).toBe("/sklep/gotowe-wzory/cenniki");
  });

  it("rozwiązuje kategorię po handle gdy brak id", () => {
    const items = buildShopProductBreadcrumbs({
      productTitle: "Cennik A4",
      tree,
      listingRootHandle: "gotowe-wzory",
      listingBasePath: "/sklep/gotowe-wzory",
      productCategories: [{ handle: "cenniki", name: "Cenniki" }],
    });

    expect(items[2]?.label).toBe("Cenniki");
    expect(items[2]?.href).toBe("/sklep/gotowe-wzory/cenniki");
  });

  it("pokazuje root gdy produkt nie ma podkategorii", () => {
    const items = buildShopProductBreadcrumbs({
      productTitle: "Produkt ogólny",
      tree,
      listingRootHandle: "gotowe-wzory",
      listingBasePath: "/sklep/gotowe-wzory",
      productCategories: [{ id: "root-gw", handle: "gotowe-wzory", name: "Gotowe wzory" }],
    });

    expect(items.map((i) => i.label)).toEqual([
      "Strona główna",
      "Sklep",
      "Gotowe wzory",
      "Produkt ogólny",
    ]);
    expect(items[2]?.href).toBe("/sklep/gotowe-wzory");
  });
});

describe("categoryListingHref", () => {
  it("mapuje certyfikaty na dedykowaną trasę", () => {
    expect(categoryListingHref("certyfikaty", "/sklep/gotowe-wzory")).toBe(
      "/sklep/certyfikaty",
    );
  });

  it("mapuje podkategorię na segment ścieżki", () => {
    expect(categoryListingHref("cenniki", "/sklep/gotowe-wzory")).toBe(
      "/sklep/gotowe-wzory/cenniki",
    );
  });
});

describe("buildActiveCategoryListingHref", () => {
  const categoryFilters = [
    { id: "cat-cenniki", handle: "cenniki", name: "Cenniki" },
    { id: "cat-certyfikaty", handle: "certyfikaty", name: "Certyfikaty" },
  ];

  it("zwraca bazę listingu bez segmentu dla domyślnej kategorii", () => {
    expect(
      buildActiveCategoryListingHref({
        categoryId: "root-gw",
        defaultListingCategoryId: "root-gw",
        listingBasePath: "/sklep/gotowe-wzory",
        productBasePath: "/sklep/gotowe-wzory",
        categoryFilters,
      }),
    ).toBe("/sklep/gotowe-wzory");
  });

  it("dodaje segment ścieżki dla podkategorii", () => {
    expect(
      buildActiveCategoryListingHref({
        categoryId: "cat-cenniki",
        defaultListingCategoryId: "root-gw",
        listingBasePath: "/sklep/gotowe-wzory",
        productBasePath: "/sklep/gotowe-wzory",
        categoryFilters,
      }),
    ).toBe("/sklep/gotowe-wzory/cenniki");
  });

  it("przekierowuje certyfikaty na dedykowaną trasę", () => {
    expect(
      buildActiveCategoryListingHref({
        categoryId: "cat-certyfikaty",
        defaultListingCategoryId: "root-gw",
        listingBasePath: "/sklep/gotowe-wzory",
        productBasePath: "/sklep/gotowe-wzory",
        categoryFilters,
      }),
    ).toBe("/sklep/certyfikaty");
  });

  it("zachowuje sort w query", () => {
    expect(
      buildActiveCategoryListingHref({
        categoryId: "cat-cenniki",
        defaultListingCategoryId: "root-gw",
        listingBasePath: "/sklep/gotowe-wzory",
        productBasePath: "/sklep/gotowe-wzory",
        categoryFilters,
        sort: "price",
      }),
    ).toBe("/sklep/gotowe-wzory/cenniki?sort=price");
  });
});

describe("listingCategoryHandleFromPathname", () => {
  it("wyciąga handle z pathname", () => {
    expect(
      listingCategoryHandleFromPathname(
        "/sklep/gotowe-wzory/cenniki",
        "/sklep/gotowe-wzory",
      ),
    ).toBe("cenniki");
  });

  it("zwraca null dla root listingu", () => {
    expect(
      listingCategoryHandleFromPathname(
        "/sklep/gotowe-wzory",
        "/sklep/gotowe-wzory",
      ),
    ).toBeNull();
  });
});

describe("categoryIdFromListingPath", () => {
  const categoryFilters = [
    { id: "cat-cenniki", handle: "cenniki", name: "Cenniki" },
  ];

  it("zwraca domyślną kategorię bez segmentu", () => {
    expect(
      categoryIdFromListingPath({
        pathname: "/sklep/gotowe-wzory",
        productBasePath: "/sklep/gotowe-wzory",
        defaultListingCategoryId: "root-gw",
        categoryFilters,
      }),
    ).toBe("root-gw");
  });

  it("mapuje segment ścieżki na id", () => {
    expect(
      categoryIdFromListingPath({
        pathname: "/sklep/gotowe-wzory/cenniki",
        productBasePath: "/sklep/gotowe-wzory",
        defaultListingCategoryId: "root-gw",
        categoryFilters,
      }),
    ).toBe("cat-cenniki");
  });
});
