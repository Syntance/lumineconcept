import type { Metadata } from "next";
import {
  generateGotoweWzoryListingMetadata,
  GotoweWzoryListingPage,
} from "@/components/shop/GotoweWzoryListingPage";

export async function generateMetadata(): Promise<Metadata> {
  return generateGotoweWzoryListingMetadata();
}

export const revalidate = 60;

export default async function GotoweWzoryPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  return <GotoweWzoryListingPage searchParams={params} />;
}
