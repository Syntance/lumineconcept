import type { Metadata } from "next";
import { Suspense } from "react";
import {
  generateGotoweWzoryListingMetadata,
  GotoweWzoryListingPage,
  type GotoweWzoryListingSearchParams,
} from "@/components/shop/GotoweWzoryListingPage";

export async function generateMetadata(): Promise<Metadata> {
  return generateGotoweWzoryListingMetadata();
}

export const revalidate = 60;

type PageSearchParams = Promise<GotoweWzoryListingSearchParams>;

/** searchParams muszą być czytane w Suspense — inaczej Next 15/16 na Vercel zwraca 500. */
async function GotoweWzoryListingWithSearchParams({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const params = await searchParams;
  return <GotoweWzoryListingPage searchParams={params} />;
}

export default function GotoweWzoryPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  return (
    <Suspense fallback={null}>
      <GotoweWzoryListingWithSearchParams searchParams={searchParams} />
    </Suspense>
  );
}
