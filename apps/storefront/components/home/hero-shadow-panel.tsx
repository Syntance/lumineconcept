import type { CSSProperties, ReactNode } from "react";

/**
 * Wspólna „kanwa” hero strony głównej — ta sama skala `cqw` (container query).
 * Cieniowany kształt portalu usunięty: tło JPG zawiera już nisze / portal.
 */
const PANEL_BASE_VMIN = 54;
const PANEL_BASE_MAX_REM = 63;
const PANEL_VISUAL_SCALE = 0.95;
const panelWMin = PANEL_BASE_VMIN * PANEL_VISUAL_SCALE;
const panelWMaxRem = PANEL_BASE_MAX_REM * PANEL_VISUAL_SCALE;

/** Współczynniki skali względem `--cta-fs` (jak w HeroSection). */
export const heroPanelScale = {
  ctaOfPanel: 0.038,
  title: 65 / 14,
  subtitle: 20 / 14,
  body: 18 / 14,
  ctaPadX: 1.85,
  ctaPadY: 0.76,
  padTop: 3,
  gapAfterTitle: 0.9 * 1.5,
  gapAfterSubtitle: 0.62 * 1.5,
  gapBeforeCta: 1.4,
  gapCtaStack: 1.1,
} as const;

export function HeroShadowPanel({
  align,
  children,
}: {
  align: "left" | "center";
  children: ReactNode;
}) {
  const positionStyle: CSSProperties =
    align === "left"
      ? {
          left: "max(1rem, calc(max(0.75rem, 4.5vmin) + 100px))",
        }
      : {
          left: "50%",
          transform: "translateX(-50%)",
        };

  return (
    <div
      className="absolute top-0 flex aspect-[1008/1200] flex-col"
      style={{
        containerType: "inline-size",
        containerName: "hero-panel",
        ...positionStyle,
        width: `min(${panelWMin}vmin, calc(100vw - 1.5rem), ${panelWMaxRem}rem)`,
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      <div
        className="relative z-10 box-border flex min-h-[76%] w-full max-w-none flex-col items-stretch justify-center text-left"
        style={
          {
            "--cta-fs": `calc(100cqw * ${heroPanelScale.ctaOfPanel})`,
            paddingTop: `calc(var(--cta-fs) * ${heroPanelScale.padTop} + 5cqw)`,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}
