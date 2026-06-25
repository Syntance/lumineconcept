import type { HeroPrefetchBundles } from "@/lib/content/hero-prefetch";
import type { ShopNavLink } from "@/lib/navigation/shop-mobile-nav";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { PopupBannerLayer } from "@/components/layout/PopupBannerLayer";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroImageCacheWarmer } from "@/components/home/HeroImageCacheWarmer";
import { getHeroPrefetchBundles } from "@/lib/content/hero-prefetch";
import { getProductCategories } from "@/lib/medusa/products";
import { buildGotoweWzoryMobileSub } from "@/lib/navigation/shop-mobile-nav";
import type { CategoryTreeNode } from "@/lib/medusa/category-tree";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const heroPrefetch = await getHeroPrefetchBundles();
  const categories = await getProductCategories().catch(() => []);
  const gotoweWzoryMobileSub = buildGotoweWzoryMobileSub(categories as CategoryTreeNode[]);
  const desktopPrefetchUrls = [
    ...heroPrefetch.home.desktop,
    ...heroPrefetch.logo3d.desktop,
  ];
  const mobilePrefetchUrls = [
    ...heroPrefetch.home.mobile,
    ...heroPrefetch.logo3d.mobile,
  ];

  return (
    <>
      <HeroImageCacheWarmer
        desktopUrls={desktopPrefetchUrls}
        mobileUrls={mobilePrefetchUrls}
      />
      {/* Serwerowy RSC — nie wchodzi w bundel „use client” Headera, brak ryzyka rozjazdu hydratacji po HMR */}
      <AnnouncementBar />
      <PopupBannerLayer />
      <Header heroPrefetch={heroPrefetch} gotoweWzoryMobileSub={gotoweWzoryMobileSub} />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
