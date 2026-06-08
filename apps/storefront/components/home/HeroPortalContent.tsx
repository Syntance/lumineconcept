import { HeroPortalDesktop } from "./HeroPortalDesktop";
import { HeroPortalMobile } from "./HeroPortalMobile";

/** Przełącza układ hero: mobile (< lg) vs desktop (portal + overlay). */
export function HeroPortalContent() {
  return (
    <>
      <div className="lg:hidden">
        <HeroPortalMobile />
      </div>
      <div className="hidden lg:block">
        <HeroPortalDesktop />
      </div>
    </>
  );
}
