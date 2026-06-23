/** Mobile / tablet — pozycja zdjęcia w kolumnie (< lg). */
export const ABOUT_MOBILE_MEDIA_LOWER = "max-lg:-mt-[150px] lg:mt-0" as const;

/** Hero mobile — równy odstęp nad i pod blokiem nagłówka (h1 + subtitle). */
export const ABOUT_HERO_MOBILE_HEADLINE_PADDING = "max-lg:py-12" as const;

/** Mobile — treść pod hero obniżona o 100px (nachodzenie sekcji 1 zostaje). */
export const ABOUT_PAGE_CONTENT_MOBILE_LOWER = "max-lg:mt-[100px] lg:mt-0" as const;

/** Poziomy gutter strony O nas — 60px (mobile/tablet). */
export const ABOUT_PAGE_GUTTER = "px-[60px]" as const;

/** Desktop (lg+) — siatka sekcji jak w commitach 17–18 czerwca. */
export const ABOUT_DESKTOP_GRID_SHELL =
	"mx-auto hidden w-full max-w-7xl grid-cols-2 items-start gap-3 px-4 lg:grid lg:gap-16 xl:gap-20" as const;

/** Wewnętrzny limit szerokości treści — mobile/tablet w gutterze 60px. */
export const ABOUT_PAGE_CONTENT_MAX = "mx-auto w-full max-w-7xl min-w-0" as const;

/** Zapobiega wychodzeniu elementów poza gutter. */
export const ABOUT_PAGE_CLIP = "overflow-x-clip" as const;

/** Sekcja treści — bezpieczna strefa 60px (mobile/tablet). */
export const ABOUT_SECTION_SAFE = "overflow-x-clip" as const;

/** Intro desktop — wiersz zdjęcie + napis boczny (100px od zdjęcia). */
export const ABOUT_INTRO_DESKTOP_MEDIA_ROW =
	"flex min-w-0 max-w-full items-stretch justify-end gap-[100px] overflow-x-clip lg:overflow-visible" as const;

/** Intro desktop — pionowy napis boczny (tylko xl+, znika po pierwszym breakpoincie w dół). */
export const ABOUT_INTRO_SIDE_CAPTION_VISIBILITY = "hidden xl:flex" as const;

export const ABOUT_INTRO_SIDE_CAPTION_ALIGN = "shrink-0 xl:translate-y-[300px]" as const;

/** Intro — nachodzenie zdjęcia na hero (mobile = desktop). */
export const ABOUT_INTRO_MEDIA_OFFSET = "-mt-48 xl:-mt-56" as const;

/** Intro — nachodzenie sekcji na hero (mobile = desktop). */
export const ABOUT_INTRO_SECTION_OVERLAP = "-mt-20 sm:-mt-24 lg:-mt-28" as const;

/** @deprecated Alias — ABOUT_INTRO_MEDIA_OFFSET. */
export const ABOUT_INTRO_DESKTOP_MEDIA_OFFSET = ABOUT_INTRO_MEDIA_OFFSET;

/** Misja — bez dodatkowego offsetu zdjęcia na mobile. */
export const ABOUT_MISSION_MOBILE_MEDIA_LOWER = "lg:mt-0" as const;

/** Mobile — akapit pod zdjęciem, w osi między kolumnami. */
export const ABOUT_MOBILE_BODY_BETWEEN_COLUMNS =
	"order-3 col-span-2 max-lg:row-start-2 max-lg:w-full max-lg:pt-3 max-lg:text-center sm:max-lg:pt-5 lg:row-start-auto" as const;

/** Kompensacja alfa w wyciętych webp (~6.5% wys.). */
export const ABOUT_MEDIA_LABEL_OVERLAP_ABOVE = "-mb-[6.7%]" as const;
export const ABOUT_MEDIA_LABEL_OVERLAP_BELOW = "-mt-[6.7%]" as const;
export const ABOUT_MEDIA_LABEL_INSET_X = "px-[2.9%]" as const;

/** Intro mobile — prawa krawędź tekstu w osi środka zdjęcia. */
export const ABOUT_INTRO_MOBILE_BODY_WRAPPER =
	"max-lg:w-[calc(75%+0.1875rem)] max-lg:text-right" as const;

/** Intro desktop — tekst w kolumnie. */
export const ABOUT_INTRO_DESKTOP_BODY_EDGE = "lg:w-full lg:max-w-full lg:text-right" as const;

/** Szerokość zdjęć — mobile wyśrodkowane; desktop jak w mockupie. */
export const ABOUT_MEDIA_WIDTH_CLASS =
	"w-full max-w-full lg:max-w-[19.44rem] xl:max-w-[22.68rem]" as const;

/** Mobile-only — ta sama szerokość co zdjęcie (w-full + max-w, nie kurczy się do treści). */
export const ABOUT_MEDIA_WIDTH_MOBILE_CLASS =
	"max-lg:mx-auto max-lg:w-full max-lg:max-w-[10.725rem]" as const;

/** Mobile intro — wspólna ramka zdjęcia i podpisu (osobne wiersze gridu, ta sama szerokość). */
export const ABOUT_INTRO_MOBILE_MEDIA_FRAME = ABOUT_MEDIA_WIDTH_MOBILE_CLASS;

/** Arch image — wypełnia kontener rodzica. */
export const ABOUT_ARCH_IMAGE_CLASS =
	"w-full max-w-none lg:max-w-[19.44rem] xl:max-w-[22.68rem]" as const;

/** Odstęp między kolumnami — desktop. */
export const ABOUT_TEXT_GUTTER_RIGHT = "lg:pr-4" as const;
export const ABOUT_TEXT_GUTTER_LEFT = "lg:pl-4" as const;

/** Prawa kolumna gridu — intro / domknięcie (desktop: offset od osi). */
export const ABOUT_MEDIA_COLUMN_END =
	"flex w-full flex-col items-end max-lg:items-end lg:items-start lg:pl-[calc(1rem+50px)]" as const;

/** Lewa kolumna gridu — misja (desktop: offset od osi). */
export const ABOUT_MEDIA_COLUMN_START =
	"flex w-full flex-col items-start max-lg:items-start lg:items-end lg:pr-[calc(1rem+50px)]" as const;

/** Tekst misji — wyrównanie do góry webp (mobile = desktop). */
export const ABOUT_MISSION_TEXT_TOP_OFFSET =
	"pt-[calc(6.83mm+1rem+2px+19.44rem*960/720*0.064-19.44rem*0.067)] xl:pt-[calc(6.83mm+1rem+2px+22.68rem*960/720*0.064-22.68rem*0.067)]" as const;

/** Zdjęcie domknięcia — nachodzi na dół sekcji misji (mobile = desktop). */
export const ABOUT_CLOSING_MEDIA_TOP_OFFSET = "-mt-[250px]" as const;

/** Biały pas nad footerem — sekcja domknięcia. */
export const ABOUT_CLOSING_FOOTER_WHITE_BAND_HEIGHT = "h-[130px]" as const;

/** Odstęp środka półkola od dołu sekcji. */
export const ABOUT_CLOSING_SEPARATOR_CENTER_BOTTOM = "bottom-0" as const;

/** Góra półkola — dół linii pionowej. */
export const ABOUT_CLOSING_SEPARATOR_LINE_BOTTOM = "bottom-10" as const;

/** Tekst domknięcia — podniesienie względem domyślnego wyrównania do zdjęcia. */
export const ABOUT_CLOSING_TEXT_TOP_OFFSET = "-mt-[50px]" as const;

/** Opaska brand-100 — sekcja domknięcia. */
export const ABOUT_CLOSING_BRAND100_BAND_HEIGHT = "h-[530px]" as const;
export const ABOUT_CLOSING_BRAND100_BAND_TOP = "top-[calc(50%-100px)]" as const;

/** Sygnet na styku brand-50 i opaska brand-100. */
export const ABOUT_CLOSING_SIGNET_TOP = "top-[calc(50%-375px)]" as const;

export const ABOUT_SIGNET_IMAGE = "/images/lumine-signet-brown.png" as const;
export const ABOUT_SIGNET_ASPECT_CLASS = "aspect-421/396" as const;
/** Sygnet — mobile mniejszy, desktop w-36. */
export const ABOUT_SIGNET_WIDTH_CLASS = "w-24 lg:w-36" as const;
