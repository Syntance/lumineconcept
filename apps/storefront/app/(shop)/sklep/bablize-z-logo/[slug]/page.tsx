import { createProductPage } from "@/lib/products/create-product-page";

// ISR 1h; świeżość po zmianie produktu zapewnia webhook → revalidateTag.
export const revalidate = 3600;

const { Page, generateMetadata, generateStaticParams } = createProductPage({
  basePath: "/sklep/bablize-z-logo",
  categoryLabel: "Tablice z logo",
  categoryHref: "/sklep/bablize-z-logo",
  // requiredTag: "logo-3d",
});

export { generateMetadata, generateStaticParams };
export default Page;
