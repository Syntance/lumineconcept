import { flattenAboutBodyParagraphs } from "@/lib/content/about-text";
import { ABOUT_BODY_TEXT_CLASS } from "@/components/about/about-typography";
import { cn } from "@/lib/utils";

type AboutBodyTextProps = {
  paragraphs: string[];
  className?: string;
};

/** Tekst z CMS — każdy Enter = osobna linia (bez auto-łamania na desktopie). */
export function AboutBodyText({ paragraphs, className }: AboutBodyTextProps) {
  const text = flattenAboutBodyParagraphs(paragraphs);
  if (!text) return null;

  const lines = text.split("\n");

  return (
    <p
      className={cn(
        "text-brand-700",
        ABOUT_BODY_TEXT_CLASS,
        className,
      )}
    >
      {lines.map((line, index) => (
        <span
          key={`${index}-${line.slice(0, 12)}`}
          className="block max-md:whitespace-pre-wrap md:whitespace-nowrap"
        >
          {line}
        </span>
      ))}
    </p>
  );
}
