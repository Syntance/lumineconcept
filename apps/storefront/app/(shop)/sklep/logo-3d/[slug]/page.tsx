import { createProductPage } from "@/lib/products/create-product-page";

export const revalidate = 120;

const { Page, generateMetadata, generateStaticParams } = createProductPage({
  basePath: "/sklep/logo-3d",
  categoryLabel: "Tablica z logo",
  categoryHref: "/sklep/logo-3d",
  // requiredTag: "logo-3d",
});

export { generateMetadata, generateStaticParams };
export default Page;
