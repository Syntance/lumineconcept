import { createProductPage } from "@/lib/products/create-product-page";

// ISR 1h; świeżość po zmianie produktu zapewnia webhook → revalidateTag
// (medusa-products, product-config-{id}), więc dłuższy TTL = lepszy TTFB/PageSpeed.
export const revalidate = 3600;

const { Page, generateMetadata, generateStaticParams } = createProductPage({
  basePath: "/sklep/gotowe-wzory",
  categoryLabel: "Gotowe wzory",
  categoryHref: "/sklep/gotowe-wzory",
  // requiredTag: "gotowe-wzory",
});

export { generateMetadata, generateStaticParams };
export default Page;
