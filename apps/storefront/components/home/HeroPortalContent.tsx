"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

const PORTAL_ASPECT = 900 / 1134;
const CONTENT_LEFT = "16.18%";
const CONTENT_TOP = "clamp(72px, 11vw, 148px)";
const CONTENT_GAP = "clamp(16px, 1.6vw, 28px)";
/** Minimalna szerokość portalu względem hero (z PDF). */
const PORTAL_MIN_WIDTH_RATIO = 0.19;

type PortalLayout = {
  left: number;
  width: number;
};

export function HeroPortalContent() {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const [portalLayout, setPortalLayout] = useState<PortalLayout | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    const cta = ctaRef.current;
    if (!root || !content || !cta) return;

    const update = () => {
      const hero = root.parentElement;
      if (!hero) return;

      const rootRect = root.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const ctaRect = cta.getBoundingClientRect();
      const heroWidth = hero.getBoundingClientRect().width;

      const ctaCenterX = ctaRect.left + ctaRect.width / 2 - rootRect.left;
      const portalWidth = Math.max(
        contentRect.width + 24,
        heroWidth * PORTAL_MIN_WIDTH_RATIO,
      );

      setPortalLayout({
        left: ctaCenterX - portalWidth / 2,
        width: portalWidth,
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(root);
    observer.observe(content);
    observer.observe(cta);
    observer.observe(root.parentElement);

    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={rootRef} className="absolute inset-0">
      {portalLayout ? (
        <div
          className="pointer-events-none absolute z-[3] select-none"
          aria-hidden
          style={{
            left: portalLayout.left,
            top: 0,
            width: portalLayout.width,
            aspectRatio: "900 / 1134",
            backgroundImage: "url(/images/hero-portal.svg)",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        />
      ) : null}

      <div
        ref={contentRef}
        className="absolute z-10 flex w-max max-w-[calc(100%-2rem)] flex-col items-start"
        style={{
          left: CONTENT_LEFT,
          top: CONTENT_TOP,
          gap: CONTENT_GAP,
        }}
      >
        <div className="flex flex-col items-start gap-4">
          <h1
            className="m-0 whitespace-nowrap text-left font-binerka tracking-[0.06em] font-normal text-white"
            style={{
              fontSize: "clamp(40px, 3.6vw, 72px)",
              lineHeight: 1,
            }}
          >
            CONCEPT
          </h1>

          <div className="flex flex-col items-start gap-2">
            <p
              className="m-0 whitespace-nowrap text-left font-gilroy font-medium uppercase leading-none tracking-[0.08em] text-white"
              style={{
                fontSize: "clamp(14px, 1.1vw, 22px)",
              }}
            >
              Wyróżnij swój salon
            </p>

            <p
              className="m-0 whitespace-nowrap text-left font-gilroy font-light leading-tight tracking-[0.06em] text-white/90"
              style={{
                fontSize: "clamp(12px, 0.95vw, 18px)",
              }}
            >
              Tablice z logo, cenniki i oznaczenia z plexi
            </p>
          </div>
        </div>

        <Link
          ref={ctaRef}
          href="/sklep"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-0 bg-white font-gilroy font-semibold uppercase tracking-[0.2em] text-black shadow-none outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={{
            fontSize: "clamp(11px, 0.85vw, 15px)",
            lineHeight: 1.15,
            paddingLeft: "clamp(20px, 1.8vw, 28px)",
            paddingRight: "clamp(20px, 1.8vw, 28px)",
            paddingTop: "clamp(10px, 0.9vw, 14px)",
            paddingBottom: "clamp(10px, 0.9vw, 14px)",
          }}
        >
          Zobacz produkty
        </Link>
      </div>
    </div>
  );
}
