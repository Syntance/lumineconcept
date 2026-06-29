"use client";

import { ArrowDown } from "lucide-react";

import { HeroCtaLink } from "./HeroCtaLink";
import { useLayoutEffect, useRef, type RefObject } from "react";

import {
  HOME_HERO_PORTAL,
  type HeroPortalAlign,
  type HeroPortalContentConfig,
  type HeroPortalSize,
} from "./hero-portal-config";

const DESKTOP_MQ = "(min-width: 1024px)";

const CONTENT_LEFT = "21.18%";
/** Wartości px przy skali 1 — skaluje się razem z całym blokiem. */
const CONTENT_TOP_PX = 96;
const CONTENT_GAP_PX = 32;
/** Padding portalu — proporcjonalnie do treści, przy skali 1. */
const PORTAL_PAD_X_RATIO = 0.035;
const PORTAL_PAD_X_MIN = 18;
const PORTAL_BOTTOM_PAD_RATIO = 0.28;
const PORTAL_BOTTOM_PAD_MIN = 56;
/** Delikatna korekta proporcji portalu względem treści. */
const PORTAL_WIDTH_NUDGE = 0.90;
const PORTAL_HEIGHT_NUDGE = 0.98;
/** W SVG proste boki kończą się na y=733 / 1134 wysokości. */
const PORTAL_STRAIGHT_END = 733 / 1134;
const PORTAL_WIDTH_RATIO = 900 / 1134;

const CTA_CLASS =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-0 bg-white px-7 py-3 font-gilroy text-[13px] font-semibold uppercase leading-[1.15] tracking-[0.2em] text-black shadow-none outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

type PortalLayout = {
  left: number;
  width: number;
  height: number;
};

/** SSR + pierwszy paint — portal widoczny od razu; useLayoutEffect dopasowuje wymiary. */
const INITIAL_PORTAL_LAYOUT: Record<
  `${HeroPortalSize}_${HeroPortalAlign}`,
  PortalLayout
> = {
  home_left: { left: 130, width: 720, height: 920 },
  home_center: { left: 260, width: 760, height: 940 },
  content_left: { left: 95, width: 660, height: 900 },
  content_center: { left: 220, width: 700, height: 910 },
};

function getInitialPortalLayout(
  align: HeroPortalAlign,
  portalSize: HeroPortalSize,
): PortalLayout {
  const key = `${portalSize}_${align}` as keyof typeof INITIAL_PORTAL_LAYOUT;
  return INITIAL_PORTAL_LAYOUT[key];
}

function applyPortalLayout(el: HTMLElement, layout: PortalLayout): void {
  el.style.left = `${layout.left}px`;
  el.style.width = `${layout.width}px`;
  el.style.height = `${layout.height}px`;
}

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
  contentRef: RefObject<HTMLDivElement | null>;
  headlineRef: RefObject<HTMLHeadingElement | null>;
  ctaRef: RefObject<HTMLAnchorElement | null>;
  /** Ukryty blok pomiarowy — bez translateY (nie wpływa na CLS). */
  measureOnly?: boolean;
};

function PortalContentBlock({
  align,
  content,
  contentRef,
  headlineRef,
  ctaRef,
  measureOnly = false,
}: PortalContentBlockProps) {
  const isCenter = align === "center";

  return (
    <div
      ref={contentRef}
      className={`relative z-10 flex w-max flex-col ${isCenter ? "items-center" : "items-start"}${measureOnly ? "" : " hero-portal-content-drop"}`}
      style={{ gap: CONTENT_GAP_PX }}
    >
      <div className={`flex flex-col gap-4 ${isCenter ? "items-center" : "items-start"}`}>
        <h1
          ref={headlineRef}
          className={`m-0 font-binerka text-[58px] leading-none tracking-[0.06em] font-normal text-white ${isCenter ? "text-center" : "whitespace-nowrap text-left"} ${content.headlineUppercase ? "uppercase" : ""}`}
        >
          {content.headline}
        </h1>

        <div className={`flex flex-col gap-3 ${isCenter ? "items-center" : "items-start"}`}>
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

      <HeroCtaLink
        ref={ctaRef}
        href={content.ctaHref}
        aria-label={content.ctaAriaLabel}
        className={CTA_CLASS}
      >
        {content.ctaLabel}
        {content.ctaShowDownArrow ? (
          <ArrowDown className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
        ) : null}
      </HeroCtaLink>
    </div>
  );
}

/**
 * Hero desktop (≥ lg): portal + treść w jednym bloku ze wspólnym scale().
 * Skala i drop treści — CSS container query (globals.css), bez setState po hydracji.
 */
export function HeroPortalDesktop({
  align = "left",
  content = HOME_HERO_PORTAL,
  portalSize = "content",
}: HeroPortalDesktopProps) {
  const isCenter = align === "center";
  const useHomePortalSize = portalSize === "home";
  const initialPortalLayout = getInitialPortalLayout(align, portalSize);
  const rootRef = useRef<HTMLDivElement>(null);
  const portalBgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const homeContentRef = useRef<HTMLDivElement>(null);
  const homeHeadlineRef = useRef<HTMLHeadingElement>(null);
  const homeCtaRef = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const contentEl = contentRef.current;
    const headline = headlineRef.current;
    const cta = ctaRef.current;
    const portalEl = portalBgRef.current;
    if (!root || !contentEl || !headline || !cta || !portalEl) return;

    const media = window.matchMedia(DESKTOP_MQ);

    const update = () => {
      if (!media.matches) {
        return;
      }

      const sizeContent = useHomePortalSize ? homeContentRef.current : contentEl;
      const sizeHeadline = useHomePortalSize ? homeHeadlineRef.current : headline;
      const sizeCta = useHomePortalSize ? homeCtaRef.current : cta;

      if (!sizeContent || !sizeHeadline || !sizeCta) return;

      const sized = computePortalLayout(sizeContent, sizeHeadline, sizeCta);

      if (useHomePortalSize) {
        const ctaCenter = cta.offsetLeft + cta.offsetWidth / 2;
        applyPortalLayout(portalEl, {
          left: ctaCenter - sized.width / 2,
          width: sized.width,
          height: sized.height,
        });
      } else {
        applyPortalLayout(portalEl, sized);
      }
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(contentEl);
    observer.observe(headline);
    observer.observe(cta);

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
        className={`hero-portal-scale-root absolute top-0 ${isCenter ? "hero-portal-scale-root--center left-1/2" : "hero-portal-scale-root--left"}`}
        style={isCenter ? undefined : { left: CONTENT_LEFT }}
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
                measureOnly
                contentRef={homeContentRef}
                headlineRef={homeHeadlineRef}
                ctaRef={homeCtaRef}
              />
            </div>
          ) : null}

          <div
            ref={portalBgRef}
            className="pointer-events-none absolute z-[3] select-none"
            aria-hidden
            style={{
              left: initialPortalLayout.left,
              top: -CONTENT_TOP_PX,
              width: initialPortalLayout.width,
              height: initialPortalLayout.height,
              backgroundImage: "url(/images/hero-portal.svg)",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          />

          <PortalContentBlock
            align={align}
            content={content}
            contentRef={contentRef}
            headlineRef={headlineRef}
            ctaRef={ctaRef}
          />
        </div>
      </div>
    </div>
  );
}
