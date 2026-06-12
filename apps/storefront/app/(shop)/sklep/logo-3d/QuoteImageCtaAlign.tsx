"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/** Proporcje źródła PNG. */
const IMAGE_ASPECT = 915 / 693;
const IMAGE_WIDTH_RATIO = 0.88;

const LG_QUERY = "(min-width: 1024px)";

const STICKY_TOP =
  "calc(var(--shop-chrome-h) + var(--product-gallery-sticky-gap) + env(safe-area-inset-top, 0px))";

const LAYOUT_EPS_PX = 2;

type LayoutSnapshot = {
  trackH: number;
  offsetTop: number;
  w: number;
  h: number;
  ml: number;
  reduced: boolean;
};

function getViewportImageCap(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;pointer-events:none;height:calc(100svh - var(--shop-chrome-h) - var(--product-gallery-sticky-gap) - 2rem - env(safe-area-inset-bottom,0px))";
  document.body.appendChild(probe);
  const cap = probe.getBoundingClientRect().height;
  probe.remove();
  return cap;
}

function measureTrack(grid: HTMLElement): {
  trackH: number;
  offsetTop: number;
} | null {
  const title = grid.querySelector<HTMLElement>("#logo3d-quote-title");
  const submit = grid.querySelector<HTMLElement>('button[type="submit"]');
  if (!title || !submit) return null;

  const gridTop = grid.getBoundingClientRect().top;
  const titleTop = title.getBoundingClientRect().top - gridTop;
  const submitBottom = submit.getBoundingClientRect().bottom - gridTop;

  return {
    offsetTop: Math.max(0, titleTop),
    trackH: Math.max(0, submitBottom - titleTop),
  };
}

/**
 * Pełne wymiary (tor nagłówek→CTA) gdy mieszczą się w kolumnie.
 * Sticky zostaje dopóki proporcjonalny tor 88% nie dogoni tej wysokości —
 * wtedy rozmiar jest już pełny i wyłączenie sticky nie skacze.
 * Poniżej progu szerokości: tylko proporcjonalny wzrost 88%.
 */
function computeLayout(
  columnWidth: number,
  trackHeight: number,
  viewportCap: number,
): { width: number; height: number; reduced: boolean } {
  if (columnWidth <= 0 || trackHeight <= 0) {
    return { width: 0, height: 0, reduced: false };
  }

  const fullHeight = trackHeight;
  const fullWidth = fullHeight / IMAGE_ASPECT;

  const propWidth = columnWidth * IMAGE_WIDTH_RATIO;
  const propHeight = propWidth * IMAGE_ASPECT;

  if (fullWidth <= columnWidth) {
    return {
      width: fullWidth,
      height: fullHeight,
      reduced: propHeight < fullHeight,
    };
  }

  let width = propWidth;
  let height = propHeight;

  if (height > viewportCap) {
    height = viewportCap;
    width = height / IMAGE_ASPECT;
  }

  return { width, height, reduced: true };
}

function computeImageMarginLeft(
  columnWidth: number,
  imageWidth: number,
  columnGap: number,
): number {
  const freeSpace = Math.max(0, columnWidth - imageWidth);
  if (freeSpace <= 0) return 0;

  // Ta sama formuła w obu trybach — brak skoku poziomego na progu sticky→pełny.
  return Math.min((freeSpace + columnGap) / 2, freeSpace);
}

function readColumnGap(grid: HTMLElement): number {
  const raw = getComputedStyle(grid).columnGap;
  const px = parseFloat(raw);
  return Number.isFinite(px) ? px : 80;
}

function roundPx(value: number): number {
  return Math.round(value);
}

function layoutChanged(a: LayoutSnapshot, b: LayoutSnapshot): boolean {
  return (
    Math.abs(a.trackH - b.trackH) >= LAYOUT_EPS_PX ||
    Math.abs(a.offsetTop - b.offsetTop) >= LAYOUT_EPS_PX ||
    Math.abs(a.w - b.w) >= LAYOUT_EPS_PX ||
    Math.abs(a.h - b.h) >= LAYOUT_EPS_PX ||
    Math.abs(a.ml - b.ml) >= LAYOUT_EPS_PX ||
    a.reduced !== b.reduced
  );
}

function innerStyles(reduced: boolean, heightPx: number): CSSProperties {
  if (reduced) {
    return {
      position: "sticky",
      top: STICKY_TOP,
      height: "auto",
    };
  }

  return {
    position: "relative",
    top: "auto",
    height: `${heightPx}px`,
  };
}

/**
 * Desktop: pełne zdjęcie (nagłówek → CTA) albo zmniejszone (proporcje, sticky do spodu CTA).
 */
export function QuoteImageCtaAlign({ children }: { children: ReactNode }) {
  const columnRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const lastLayoutRef = useRef<LayoutSnapshot | null>(null);
  const viewportCapRef = useRef(0);
  const [isReduced, setIsReduced] = useState(false);
  const [columnOffsetTop, setColumnOffsetTop] = useState(0);

  useLayoutEffect(() => {
    const column = columnRef.current;
    if (!column) return;

    const grid = column.closest<HTMLElement>("[data-logo3d-grid]");
    if (!grid) return;

    const mq = window.matchMedia(LG_QUERY);

    const clearLayout = () => {
      lastLayoutRef.current = null;
      setIsReduced(false);
      setColumnOffsetTop(0);
      grid.style.removeProperty("--logo3d-image-h");
      grid.style.removeProperty("--logo3d-image-w");
      grid.style.removeProperty("--logo3d-image-track-h");
      grid.style.removeProperty("--logo3d-image-ml");
      grid.dataset.logo3dMode = "full";
      if (innerRef.current) {
        Object.assign(innerRef.current.style, innerStyles(false, 0));
      }
    };

    const applyLayout = (next: LayoutSnapshot) => {
      const prev = lastLayoutRef.current;
      if (prev && !layoutChanged(prev, next)) return;

      lastLayoutRef.current = next;
      setIsReduced(next.reduced);
      setColumnOffsetTop(next.offsetTop);

      grid.dataset.logo3dMode = next.reduced ? "reduced" : "full";
      grid.style.setProperty("--logo3d-image-track-h", `${next.trackH}px`);
      grid.style.setProperty("--logo3d-image-w", `${next.w}px`);
      grid.style.setProperty("--logo3d-image-h", `${next.h}px`);
      grid.style.setProperty("--logo3d-image-ml", `${next.ml}px`);

      if (innerRef.current) {
        Object.assign(
          innerRef.current.style,
          innerStyles(next.reduced, next.h),
        );
      }
    };

    const sync = () => {
      if (!mq.matches) {
        clearLayout();
        return;
      }

      const track = measureTrack(grid);
      if (track == null) return;

      const { width, height, reduced } = computeLayout(
        column.clientWidth,
        track.trackH,
        viewportCapRef.current,
      );

      const trackH = roundPx(track.trackH);
      const imageH = roundPx(height);

      applyLayout({
        trackH,
        offsetTop: roundPx(track.offsetTop),
        w: roundPx(width),
        h: imageH,
        ml: roundPx(
          computeImageMarginLeft(
            column.clientWidth,
            width,
            readColumnGap(grid),
          ),
        ),
        reduced,
      });
    };

    const refreshViewportCap = () => {
      viewportCapRef.current = getViewportImageCap();
      lastLayoutRef.current = null;
      sync();
    };

    refreshViewportCap();

    const ro = new ResizeObserver(() => {
      sync();
    });
    ro.observe(column);
    const rightCol = grid.children[1];
    if (rightCol instanceof HTMLElement) ro.observe(rightCol);

    const form = grid.querySelector("form");
    if (form instanceof HTMLElement) ro.observe(form);

    const submit = grid.querySelector("button[type=submit]");
    if (submit instanceof HTMLElement) ro.observe(submit);

    const title = grid.querySelector<HTMLElement>("#logo3d-quote-title");
    if (title instanceof HTMLElement) ro.observe(title);

    mq.addEventListener("change", refreshViewportCap);
    window.addEventListener("resize", refreshViewportCap);

    return () => {
      ro.disconnect();
      mq.removeEventListener("change", refreshViewportCap);
      window.removeEventListener("resize", refreshViewportCap);
      clearLayout();
    };
  }, []);

  return (
    <div
      ref={columnRef}
      data-logo3d-mode={isReduced ? "reduced" : "full"}
      style={{ marginTop: columnOffsetTop > 0 ? columnOffsetTop : undefined }}
      className="group/logo-image relative z-2 hidden w-full lg:block lg:h-(--logo3d-image-track-h,auto) lg:shrink-0 lg:self-start"
    >
      <div
        ref={innerRef}
        className="z-2 mr-auto ml-(--logo3d-image-ml,auto) w-fit lg:relative lg:top-auto"
      >
        {children}
      </div>
    </div>
  );
}
