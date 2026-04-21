import { createProductPage } from "@/lib/products/create-product-page";

export const revalidate = 120;

const { Page, generateMetadata, generateStaticParams } = createProductPage({
  basePath: "/sklep/gotowe-wzory",
  categoryLabel: "Gotowe wzory",
  categoryHref: "/sklep/gotowe-wzory",
  // requiredTag: "gotowe-wzory",
});

export { generateMetadata, generateStaticParams };
export default Page;
