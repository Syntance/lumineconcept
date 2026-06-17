/** Wspólna szerokość zdjęć — desktop; mobile w ABOUT_MEDIA_WIDTH_MOBILE_CLASS. */
export const ABOUT_MEDIA_WIDTH_CLASS = "max-w-[19.44rem] sm:max-w-[22.68rem]" as const;

/** Mobile-only — wyśrodkowane w kolumnie (+10% względem 9.75rem). */
export const ABOUT_MEDIA_WIDTH_MOBILE_CLASS =
	"max-md:mx-auto max-md:max-w-[10.725rem]" as const;

/** Odstęp od środka (gutter) — lewa kolumna z tekstem wyrównanym w prawo. */
export const ABOUT_TEXT_GUTTER_RIGHT = "lg:pr-4" as const;

/** Odstęp od środka — prawa kolumna ze zdjęciem (lustrzane odbicie tekstu intro). */
export const ABOUT_MEDIA_GUTTER_LEFT = "lg:pl-[calc(1rem+50px)]" as const;

/** Odstęp od środka — prawa kolumna z tekstem (misja). Lustrzane odbicie ABOUT_TEXT_GUTTER_RIGHT. */
export const ABOUT_TEXT_GUTTER_LEFT = "lg:pl-4" as const;

/** Odstęp od środka — lewa kolumna ze zdjęciem (misja). Lustrzane odbicie ABOUT_MEDIA_GUTTER_LEFT. */
export const ABOUT_MEDIA_GUTTER_RIGHT = "lg:pr-[calc(1rem+50px)]" as const;

/** Prawa kolumna gridu — zdjęcie od osi (intro, domknięcie). */
export const ABOUT_MEDIA_COLUMN_END =
  "flex w-full flex-col items-center lg:items-start lg:pl-[calc(1rem+50px)]" as const;

/** Lewa kolumna gridu — zdjęcie od osi (misja). */
export const ABOUT_MEDIA_COLUMN_START =
  "flex w-full flex-col items-center lg:items-end lg:pr-[calc(1rem+50px)]" as const;

/** Tekst misji — wyrównanie do widocznej góry webp (etykieta nad zdjęciem + overlap alfa). */
export const ABOUT_MISSION_TEXT_TOP_OFFSET =
  "lg:pt-[calc(6.83mm+1rem+2px+19.44rem*960/720*0.064-19.44rem*0.067)] xl:pt-[calc(6.83mm+1rem+2px+22.68rem*960/720*0.064-22.68rem*0.067)]" as const;

/** Zdjęcie domknięcia — nachodzi na dół sekcji misji (między sekcją 3 a 4). */
export const ABOUT_CLOSING_MEDIA_TOP_OFFSET = "lg:-mt-[250px]" as const;

/** Biały pas nad footerem — sekcja domknięcia. */
export const ABOUT_CLOSING_FOOTER_WHITE_BAND_HEIGHT = "h-[130px]" as const;

/** Odstęp środka półkola od dołu sekcji — środek na krawędzi footera (size-20 → promień 40px). */
export const ABOUT_CLOSING_SEPARATOR_CENTER_BOTTOM = "bottom-0" as const;

/** Góra półkola — dół linii pionowej (promień size-20 = 40px). */
export const ABOUT_CLOSING_SEPARATOR_LINE_BOTTOM = "bottom-10" as const;

/** Tekst domknięcia — podniesienie względem domyślnego wyrównania do zdjęcia. */
export const ABOUT_CLOSING_TEXT_TOP_OFFSET = "lg:-mt-[50px]" as const;

/** Opaska brand-100 — sekcja domknięcia (desktop). Mobile: nadpisania w AboutClosingSection. */
export const ABOUT_CLOSING_BRAND100_BAND_HEIGHT = "h-[530px]" as const;
export const ABOUT_CLOSING_BRAND100_BAND_TOP = "top-[calc(50%-100px)]" as const;

/** Sygnet na styku brand-50 i opaska brand-100 (desktop). */
export const ABOUT_CLOSING_SIGNET_TOP = "top-[calc(50%-375px)]" as const;

export const ABOUT_SIGNET_IMAGE = "/images/lumine-signet-brown.png" as const;
export const ABOUT_SIGNET_ASPECT_CLASS = "aspect-421/396" as const;
/** Sygnet domknięcia — desktop (+20% względem 120px). */
export const ABOUT_SIGNET_WIDTH_CLASS = "w-36" as const;
