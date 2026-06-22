import type { HeroPrefetchBundles } from "@/lib/content/hero-prefetch";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroCriticalImagePrefetch } from "@/components/home/HeroCriticalImagePrefetch";
import { HeroImageCacheWarmer } from "@/components/home/HeroImageCacheWarmer";
import { getHeroPrefetchBundles } from "@/lib/content/hero-prefetch";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const heroPrefetch = await getHeroPrefetchBundles();
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
      <HeroCriticalImagePrefetch bundles={heroPrefetch} />
      <HeroImageCacheWarmer
        desktopUrls={desktopPrefetchUrls}
        mobileUrls={mobilePrefetchUrls}
      />
      {/* Serwerowy RSC — nie wchodzi w bundel „use client” Headera, brak ryzyka rozjazdu hydratacji po HMR */}
      <AnnouncementBar />
      <Header heroPrefetch={heroPrefetch} />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
