import { createProductPage } from "@/lib/products/create-product-page";

// ISR 1h; świeżość po zmianie produktu zapewnia webhook → revalidateTag.
export const revalidate = 3600;

const { Page, generateMetadata } = createProductPage({
  basePath: "/sklep/tablice-z-logo",
  categoryLabel: "Tablice z logo",
  categoryHref: "/sklep/tablice-z-logo",
  // requiredTag: "logo-3d",
});

export { generateMetadata };
export default Page;
