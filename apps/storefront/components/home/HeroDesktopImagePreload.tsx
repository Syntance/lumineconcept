type HeroDesktopImagePreloadProps = {
  href: string;
};

/**
 * Preload tła hero na desktopie — `media` chroni mobile LCP przed ultrawide.
 * W RSC obok `<Image>`: działa przy pełnym wejściu i soft-nav (hoist do `<head>`).
 */
export function HeroDesktopImagePreload({ href }: HeroDesktopImagePreloadProps) {
  return (
    <link
      rel="preload"
      as="image"
      href={href}
      fetchPriority="high"
      media="(min-width: 1024px)"
    />
  );
}
