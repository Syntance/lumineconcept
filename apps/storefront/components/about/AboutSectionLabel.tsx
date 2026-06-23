import { cn } from "@/lib/utils";

import { ABOUT_BODY_TEXT_CLASS, ABOUT_SECTION_LABEL_MOBILE_CLASS } from "@/components/about/about-typography";

type AboutSectionLabelProps = {
  children: string;
  className?: string;
};

/** Etykieta sekcji w ramce — np. „my”, „nasza misja”. */
export function AboutSectionLabel({ children, className }: AboutSectionLabelProps) {
  return (
    <p
      className={cn(
        "block w-full min-w-0 border border-brand-300/80 bg-white/70 px-3 py-2 text-center",
        ABOUT_BODY_TEXT_CLASS,
        ABOUT_SECTION_LABEL_MOBILE_CLASS,
        "italic text-brand-700",
        className,
      )}
    >
      {children}
    </p>
  );
}
