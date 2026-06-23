/** Mobile — pozycja zdjęcia w kolumnie. */
export const ABOUT_MOBILE_MEDIA_LOWER = "max-md:-mt-[150px] md:mt-0" as const;

/** Poziomy gutter strony O nas — 30px od krawędzi viewportu. */
export const ABOUT_PAGE_GUTTER = "px-[30px]" as const;

/** Zapobiega wychodzeniu elementów poza gutter (nachodzenia, ujemne marginesy). */
export const ABOUT_PAGE_CLIP = "overflow-x-clip" as const;

/** Intro mobile — obniżenie nagłówka, zdjęcia i tekstu względem hero (bez zmiany hero). */
export const ABOUT_INTRO_MOBILE_CONTENT_LOWER = "max-md:pt-[50px]" as const;

/** Intro — podniesienie nagłówka względem dołu zdjęcia (mobile). */
export const ABOUT_INTRO_HEADING_RAISE = "max-md:pb-[10px]" as const;

/** Intro — dodatkowe +30px w górę względem pozostałych sekcji (mobile). */
export const ABOUT_INTRO_MOBILE_MEDIA_LOWER = "max-md:-mt-[180px] md:mt-0" as const;

/** Misja (sekcja 2) — obniżenie zdjęcia o 150px względem domyślnego podniesienia mobile. */
export const ABOUT_MISSION_MOBILE_MEDIA_LOWER = "max-md:mt-0 md:mt-0" as const;

/** Mobile — akapit pod zdjęciem, w osi między kolumnami. */
export const ABOUT_MOBILE_BODY_BETWEEN_COLUMNS =
	"order-3 col-span-2 max-md:row-start-2 max-md:w-full max-md:pt-3 max-md:text-center sm:max-md:pt-5 md:row-start-auto" as const;

/** Kompensacja alfa pod zdjęciem — etykieta intro na mobile. */
export const ABOUT_MEDIA_LABEL_OVERLAP_BELOW = "-mt-[6.7%]" as const;
export const ABOUT_MEDIA_LABEL_INSET_X = "px-[2.9%]" as const;

/** Intro mobile — prawa krawędź tekstu wyrównana do prawej kolumny. */
export const ABOUT_INTRO_MOBILE_BODY_WRAPPER = "max-md:text-right" as const;

/** Szerokość zdjęć — pełna kolumna w gutterze 30px, od md jak w mockupie/desktop. */
export const ABOUT_MEDIA_WIDTH_CLASS =
	"w-full max-w-full md:max-w-[19.44rem] lg:max-w-[22.68rem]" as const;

/** Arch image — wypełnia kontener rodzica w gutterze 30px. */
export const ABOUT_ARCH_IMAGE_CLASS =
	"w-full max-w-none md:max-w-[19.44rem] lg:max-w-[22.68rem]" as const;

/** Odstęp między kolumnami — tylko desktop (mobile: krawędź = gutter strony). */
export const ABOUT_TEXT_GUTTER_RIGHT = "md:pr-4" as const;
export const ABOUT_TEXT_GUTTER_LEFT = "md:pl-4" as const;

/** Prawa kolumna gridu — zdjęcie przy prawej krawędzi gutteru. */
export const ABOUT_MEDIA_COLUMN_END = "flex w-full flex-col items-end" as const;

/** Lewa kolumna gridu — zdjęcie przy lewej krawędzi gutteru. */
export const ABOUT_MEDIA_COLUMN_START = "flex w-full flex-col items-start" as const;

/** Tekst misji — wyrównanie do widocznej góry webp (etykieta nad zdjęciem + overlap alfa). */
export const ABOUT_MISSION_TEXT_TOP_OFFSET =
	"pt-24 sm:pt-28 md:pt-[calc(6.83mm+1rem+2px+19.44rem*960/720*0.064-19.44rem*0.067)] lg:pt-[calc(6.83mm+1rem+2px+22.68rem*960/720*0.064-22.68rem*0.067)]" as const;

/** Zdjęcie domknięcia — nachodzi na dół sekcji misji (między sekcją 3 a 4). */
export const ABOUT_CLOSING_MEDIA_TOP_OFFSET = "-mt-16 sm:-mt-24 md:-mt-[250px]" as const;

/** Biały pas nad footerem — sekcja domknięcia. */
export const ABOUT_CLOSING_FOOTER_WHITE_BAND_HEIGHT = "h-[130px]" as const;

/** Odstęp środka półkola od dołu sekcji — środek na krawędzi footera (size-20 → promień 40px). */
export const ABOUT_CLOSING_SEPARATOR_CENTER_BOTTOM = "bottom-0" as const;

/** Góra półkola — dół linii pionowej (promień size-20 = 40px). */
export const ABOUT_CLOSING_SEPARATOR_LINE_BOTTOM = "bottom-10" as const;

/** Tekst domknięcia — podniesienie względem domyślnego wyrównania do zdjęcia. */
export const ABOUT_CLOSING_TEXT_TOP_OFFSET = "md:-mt-[50px]" as const;

/** Opaska brand-100 — sekcja domknięcia. */
export const ABOUT_CLOSING_BRAND100_BAND_HEIGHT = "h-[530px]" as const;
export const ABOUT_CLOSING_BRAND100_BAND_TOP = "top-[calc(50%-100px)]" as const;

/** Sygnet na styku brand-50 i opaska brand-100 (górna krawędź pasu). */
export const ABOUT_CLOSING_SIGNET_TOP = "top-[calc(50%-375px)]" as const;

export const ABOUT_SIGNET_IMAGE = "/images/lumine-signet-brown.png" as const;
export const ABOUT_SIGNET_ASPECT_CLASS = "aspect-421/396" as const;
/** Sygnet domknięcia — +20% względem bazowych 120px (w-30). */
export const ABOUT_SIGNET_WIDTH_CLASS = "w-24 md:w-36" as const;
