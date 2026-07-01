import { createProductPage } from "@/lib/products/create-product-page";

// ISR 1h; świeżość po zmianie produktu zapewnia webhook → revalidateTag.
export const revalidate = 3600;

const { Page, generateMetadata } = createProductPage({
  basePath: "/sklep/certyfikaty",
  categoryLabel: "Certyfikaty",
  categoryHref: "/sklep/certyfikaty",
  // requiredTag: "certyfikaty",
});

export { generateMetadata };
export default Page;
