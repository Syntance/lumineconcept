import {
  HOME_HERO_PORTAL,
  type HeroPortalAlign,
  type HeroPortalContentConfig,
  type HeroPortalSize,
} from "./hero-portal-config";
import { HeroPortalDesktop } from "./HeroPortalDesktop";
import { HeroPortalMobile } from "./HeroPortalMobile";

type HeroPortalContentProps = {
  align?: HeroPortalAlign;
  content?: HeroPortalContentConfig;
  portalSize?: HeroPortalSize;
};

/** Przełącza układ hero: mobile (< lg) vs desktop (portal + overlay). */
export function HeroPortalContent({
  align = "left",
  content = HOME_HERO_PORTAL,
  portalSize = "content",
}: HeroPortalContentProps) {
  return (
    <>
      <div className="shrink-0 lg:hidden">
        <HeroPortalMobile content={content} />
      </div>
      <div className="hidden lg:block">
        <HeroPortalDesktop align={align} content={content} portalSize={portalSize} />
      </div>
    </>
  );
}
