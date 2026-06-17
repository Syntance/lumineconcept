import { flattenAboutBodyParagraphs } from "@/lib/content/about-text";
import { ABOUT_BODY_TEXT_CLASS } from "@/components/about/about-typography";
import { cn } from "@/lib/utils";

type AboutBodyTextProps = {
  paragraphs: string[];
  className?: string;
};

/** Tekst z CMS — od xl: Enter = linia; poniżej: jeden scalony akapit na pełną szerokość. */
export function AboutBodyText({ paragraphs, className }: AboutBodyTextProps) {
  const text = flattenAboutBodyParagraphs(paragraphs);
  if (!text) return null;

  const lines = text.split("\n");
  const flowingText = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ");

  return (
    <p
      className={cn(
        "min-w-0 text-brand-700",
        "w-full max-md:mx-auto max-xl:w-auto max-xl:max-w-[min(100%,36rem)] xl:w-full",
        ABOUT_BODY_TEXT_CLASS,
        className,
      )}
    >
      <span className="xl:hidden">{flowingText}</span>
      <span className="hidden xl:contents">
        {lines.map((line, index) => (
          <span
            key={`${index}-${line.slice(0, 12)}`}
            className="block whitespace-nowrap"
          >
            {line}
          </span>
        ))}
      </span>
    </p>
  );
}
