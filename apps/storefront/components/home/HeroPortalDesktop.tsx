"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";

import {
  HOME_HERO_PORTAL,
  type HeroPortalAlign,
  type HeroPortalContentConfig,
  type HeroPortalSize,
} from "./hero-portal-config";

const DESKTOP_MQ = "(min-width: 1024px)";

/** Szerokość hero, przy której blok ma skalę 1 (idealny desktop). */
const REF_HERO_WIDTH = 1440;
/** Skala 1 przy 1440px; powyżej rośnie do +20% (cap 1.2 przy ~1728px). Poniżej 1440px bez zmian. */
const SCALE_MAX = 1.2;

const CONTENT_LEFT = "21.18%";
/** Przesunięcie treści w dół względem portalu (% wysokości hero). */
const CONTENT_DROP_RATIO = 0.05;
/** Wartości px przy skali 1 — skaluje się razem z całym blokiem. */
const CONTENT_TOP_PX = 96;
const CONTENT_GAP_PX = 22;
/** Padding portalu — proporcjonalnie do treści, przy skali 1. */
const PORTAL_PAD_X_RATIO = 0.035;
const PORTAL_PAD_X_MIN = 18;
const PORTAL_BOTTOM_PAD_RATIO = 0.36;
const PORTAL_BOTTOM_PAD_MIN = 72;
/** Delikatna korekta proporcji portalu względem treści. */
const PORTAL_WIDTH_NUDGE = 0.90;
const PORTAL_HEIGHT_NUDGE = 1.06;
/** W SVG proste boki kończą się na y=733 / 1134 wysokości. */
const PORTAL_STRAIGHT_END = 733 / 1134;
const PORTAL_WIDTH_RATIO = 900 / 1134;

const CTA_CLASS =
  "inline-flex items-center justify-center whitespace-nowrap rounded-none border-0 bg-white px-7 py-3 font-gilroy text-[13px] font-semibold uppercase leading-[1.15] tracking-[0.2em] text-black shadow-none outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

type PortalLayout = {
  left: number;
  width: number;
  height: number;
};

type HeroPortalDesktopProps = {
  align?: HeroPortalAlign;
  content?: HeroPortalContentConfig;
  portalSize?: HeroPortalSize;
};

function computePortalLayout(
  contentEl: HTMLElement,
  headline: HTMLElement,
  cta: HTMLElement,
): PortalLayout {
  const contentWidth = contentEl.offsetWidth;
  const contentHeight = contentEl.offsetHeight;
  const ctaCenter = cta.offsetLeft + cta.offsetWidth / 2;

  const padX = Math.max(PORTAL_PAD_X_MIN, Math.round(contentWidth * PORTAL_PAD_X_RATIO));
  const padBottom = Math.max(
    PORTAL_BOTTOM_PAD_MIN,
    Math.round(contentHeight * PORTAL_BOTTOM_PAD_RATIO),
  );
  const contentBottom = CONTENT_TOP_PX + contentHeight;

  const portalHeight =
    ((contentBottom + padBottom) / PORTAL_STRAIGHT_END) * PORTAL_HEIGHT_NUDGE;
  const widthFromHeight = portalHeight * PORTAL_WIDTH_RATIO * PORTAL_WIDTH_NUDGE;
  const coreWidth =
    (Math.max(headline.offsetWidth, cta.offsetWidth) + padX * 2) * PORTAL_WIDTH_NUDGE;
  const maxWidth = (contentWidth + padX * 2) * PORTAL_WIDTH_NUDGE;
  const portalWidth = Math.min(maxWidth, Math.max(widthFromHeight, coreWidth));

  return {
    left: ctaCenter - portalWidth / 2,
    width: portalWidth,
    height: portalHeight,
  };
}

type PortalContentBlockProps = {
  align: HeroPortalAlign;
  content: HeroPortalContentConfig;
  contentDropPx: number;
  contentRef: RefObject<HTMLDivElement | null>;
  headlineRef: RefObject<HTMLHeadingElement | null>;
  ctaRef: RefObject<HTMLAnchorElement | null>;
};

function PortalContentBlock({
  align,
  content,
  contentDropPx,
  contentRef,
  headlineRef,
  ctaRef,
}: PortalContentBlockProps) {
  const isCenter = align === "center";

  return (
    <div
      ref={contentRef}
      className={`relative z-10 flex w-max flex-col ${isCenter ? "items-center" : "items-start"}`}
      style={{ gap: CONTENT_GAP_PX, transform: `translateY(${contentDropPx}px)` }}
    >
      <div className={`flex flex-col gap-4 ${isCenter ? "items-center" : "items-start"}`}>
        <h1
          ref={headlineRef}
          className={`m-0 font-binerka text-[58px] leading-none tracking-[0.06em] font-normal text-white ${isCenter ? "text-center" : "whitespace-nowrap text-left"} ${content.headlineUppercase ? "uppercase" : ""}`}
        >
          {content.headline}
        </h1>

        <div className={`flex flex-col gap-2 ${isCenter ? "items-center" : "items-start"}`}>
          {content.subtitle ? (
            <p
              className={`m-0 font-gilroy text-xl font-medium uppercase leading-none tracking-[0.08em] text-white ${isCenter ? "text-center" : "whitespace-nowrap text-left"}`}
            >
              {content.subtitle}
            </p>
          ) : null}

          <p
            className={`m-0 font-gilroy text-base font-light leading-tight tracking-[0.06em] text-white/90 ${isCenter ? "max-w-[32rem] text-center" : "whitespace-nowrap text-left"}`}
          >
            {content.description}
          </p>
        </div>
      </div>

      <Link
        ref={ctaRef}
        href={content.ctaHref}
        aria-label={content.ctaAriaLabel}
        className={CTA_CLASS}
      >
        {content.ctaLabel}
      </Link>
    </div>
  );
}

/**
 * Hero desktop (≥ lg): portal + treść w jednym bloku ze wspólnym scale().
 */
export function HeroPortalDesktop({
  align = "left",
  content = HOME_HERO_PORTAL,
  portalSize = "content",
}: HeroPortalDesktopProps) {
  const isCenter = align === "center";
  const useHomePortalSize = portalSize === "home";
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const homeContentRef = useRef<HTMLDivElement>(null);
  const homeHeadlineRef = useRef<HTMLHeadingElement>(null);
  const homeCtaRef = useRef<HTMLAnchorElement>(null);
  const [scale, setScale] = useState(1);
  const [contentDropPx, setContentDropPx] = useState(0);
  const [portalLayout, setPortalLayout] = useState<PortalLayout | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const contentEl = contentRef.current;
    const headline = headlineRef.current;
    const cta = ctaRef.current;
    if (!root || !contentEl || !headline || !cta) return;

    const media = window.matchMedia(DESKTOP_MQ);
    const hero = root.parentElement;
    if (!hero) return;

    const update = () => {
      if (!media.matches) {
        setPortalLayout(null);
        return;
      }

      const heroWidth = hero.getBoundingClientRect().width;
      const heroHeight = hero.getBoundingClientRect().height;
      const nextScale = Math.min(SCALE_MAX, heroWidth / REF_HERO_WIDTH);
      setScale(nextScale);
      setContentDropPx((heroHeight * CONTENT_DROP_RATIO) / nextScale);

      const sizeContent = useHomePortalSize ? homeContentRef.current : contentEl;
      const sizeHeadline = useHomePortalSize ? homeHeadlineRef.current : headline;
      const sizeCta = useHomePortalSize ? homeCtaRef.current : cta;

      if (!sizeContent || !sizeHeadline || !sizeCta) return;

      const sized = computePortalLayout(sizeContent, sizeHeadline, sizeCta);

      if (useHomePortalSize) {
        const ctaCenter = cta.offsetLeft + cta.offsetWidth / 2;
        setPortalLayout({
          left: ctaCenter - sized.width / 2,
          width: sized.width,
          height: sized.height,
        });
      } else {
        setPortalLayout(sized);
      }
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(root);
    observer.observe(contentEl);
    observer.observe(headline);
    observer.observe(cta);
    observer.observe(hero);

    if (useHomePortalSize) {
      const homeContent = homeContentRef.current;
      const homeHeadline = homeHeadlineRef.current;
      const homeCta = homeCtaRef.current;
      if (homeContent) observer.observe(homeContent);
      if (homeHeadline) observer.observe(homeHeadline);
      if (homeCta) observer.observe(homeCta);
    }

    media.addEventListener("change", update);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, [useHomePortalSize]);

  return (
    <div ref={rootRef} className="absolute inset-0">
      <div
        className={isCenter ? "absolute top-0 left-1/2" : "absolute top-0"}
        style={{
          ...(isCenter ? {} : { left: CONTENT_LEFT }),
          transform: isCenter
            ? `translateX(-50%) scale(${scale})`
            : `scale(${scale})`,
          transformOrigin: isCenter ? "top center" : "top left",
        }}
      >
        <div className="relative" style={{ paddingTop: CONTENT_TOP_PX }}>
          {useHomePortalSize ? (
            <div
              aria-hidden
              className="pointer-events-none invisible absolute left-0 top-0 -z-50 w-max"
            >
              <PortalContentBlock
                align="left"
                content={HOME_HERO_PORTAL}
                contentDropPx={0}
                contentRef={homeContentRef}
                headlineRef={homeHeadlineRef}
                ctaRef={homeCtaRef}
              />
            </div>
          ) : null}

          {portalLayout ? (
            <div
              className="pointer-events-none absolute z-[3] select-none"
              aria-hidden
              style={{
                left: portalLayout.left,
                top: -CONTENT_TOP_PX,
                width: portalLayout.width,
                height: portalLayout.height,
                backgroundImage: "url(/images/hero-portal.svg)",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            />
          ) : null}

          <PortalContentBlock
            align={align}
            content={content}
            contentDropPx={contentDropPx}
            contentRef={contentRef}
            headlineRef={headlineRef}
            ctaRef={ctaRef}
          />
        </div>
      </div>
    </div>
  );
}
