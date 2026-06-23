/** Mobile / tablet — pozycja zdjęcia w kolumnie (< lg). */
export const ABOUT_MOBILE_MEDIA_LOWER = "max-lg:-mt-[150px] lg:mt-0" as const;

/** Poziomy gutter strony O nas — 60px od krawędzi viewportu (zawsze na pełnej szerokości). */
export const ABOUT_PAGE_GUTTER = "px-[60px]" as const;

/** Wewnętrzny limit szerokości treści — wewnątrz guttera, bez własnego paddingu. */
export const ABOUT_PAGE_CONTENT_MAX = "mx-auto w-full max-w-7xl min-w-0" as const;

/** Zapobiega wychodzeniu elementów poza gutter (nachodzenia, ujemne marginesy). */
export const ABOUT_PAGE_CLIP = "overflow-x-clip" as const;

/** Sekcja treści — wymusza bezpieczną strefę 60px od krawędzi. */
export const ABOUT_SECTION_SAFE = "overflow-x-clip" as const;

/** Intro desktop — wiersz zdjęcie + napis boczny (odstęp 2× gap-3). */
export const ABOUT_INTRO_DESKTOP_MEDIA_ROW =
	"flex min-w-0 max-w-full items-stretch justify-end gap-6 overflow-x-clip" as const;

/** Intro desktop — pionowy napis boczny (+50px względem poprzedniego offsetu). */
export const ABOUT_INTRO_SIDE_CAPTION_ALIGN = "shrink-0 lg:translate-y-[300px]" as const;

/** Intro mobile — obniżenie nagłówka, zdjęcia i tekstu względem hero (bez zmiany hero). */
export const ABOUT_INTRO_MOBILE_CONTENT_LOWER = "max-lg:pt-[50px]" as const;

/** Intro — dodatkowe +30px w górę względem pozostałych sekcji (mobile). */
export const ABOUT_INTRO_MOBILE_MEDIA_LOWER = "max-lg:-mt-[180px] lg:mt-0" as const;

/** Intro desktop — płynny offset pionowy (bez skoku przy lg). */
export const ABOUT_INTRO_DESKTOP_MEDIA_OFFSET =
	"lg:-mt-[clamp(2rem,4vw+1.5rem,14rem)]" as const;

/** Intro desktop — min-h pasma nagłówka = wysokość zdjęcia (dół nagłówka = dół obrazu). */
export const ABOUT_INTRO_HEADING_IMAGE_ALIGN_HEIGHT =
	"lg:min-h-[calc(19.44rem*960/720)] xl:min-h-[calc(22.68rem*960/720)]" as const;

/** Misja (sekcja 2) — obniżenie zdjęcia o 150px względem domyślnego podniesienia mobile. */
export const ABOUT_MISSION_MOBILE_MEDIA_LOWER = "max-lg:mt-0 lg:mt-0" as const;

/** Mobile — akapit pod zdjęciem, w osi między kolumnami. */
export const ABOUT_MOBILE_BODY_BETWEEN_COLUMNS =
	"order-3 col-span-2 max-lg:row-start-2 max-lg:w-full max-lg:pt-3 max-lg:text-center sm:max-lg:pt-5 lg:row-start-auto" as const;

/** Kompensacja alfa w wyciętych webp (~6.5% wys.) — etykieta bliżej widocznej krawędzi zdjęcia. */
export const ABOUT_MEDIA_LABEL_OVERLAP_ABOVE = "-mb-[6.7%]" as const;
export const ABOUT_MEDIA_LABEL_OVERLAP_BELOW = "-mt-[6.7%]" as const;
export const ABOUT_MEDIA_LABEL_INSET_X = "px-[2.9%]" as const;

/** Intro mobile — prawa krawędź tekstu w osi środka zdjęcia (2 kolumny + gap-x-3). */
export const ABOUT_INTRO_MOBILE_BODY_WRAPPER =
	"max-lg:w-[calc(75%+0.1875rem)] max-lg:text-right" as const;

/** Intro desktop — tekst w kolumnie, bez wychodzenia poza lewy gutter. */
export const ABOUT_INTRO_DESKTOP_BODY_EDGE = "lg:w-full lg:max-w-full lg:text-right" as const;

/** Szerokość zdjęć — pełna kolumna w gutterze 60px, od lg jak w mockupie/desktop. */
export const ABOUT_MEDIA_WIDTH_CLASS =
	"w-full max-w-full lg:max-w-[19.44rem] xl:max-w-[22.68rem]" as const;

/** Arch image — wypełnia kontener rodzica w gutterze 60px. */
export const ABOUT_ARCH_IMAGE_CLASS =
	"w-full max-w-none lg:max-w-[19.44rem] xl:max-w-[22.68rem]" as const;

/** Odstęp między kolumnami — tylko desktop (mobile: krawędź = gutter strony). */
export const ABOUT_TEXT_GUTTER_RIGHT = "lg:pr-4" as const;
export const ABOUT_TEXT_GUTTER_LEFT = "lg:pl-4" as const;

/** Prawa kolumna gridu — zdjęcie przy prawej krawędzi gutteru. */
export const ABOUT_MEDIA_COLUMN_END = "flex w-full flex-col items-end" as const;

/** Lewa kolumna gridu — zdjęcie przy lewej krawędzi gutteru. */
export const ABOUT_MEDIA_COLUMN_START = "flex w-full flex-col items-start" as const;

/** Tekst misji — wyrównanie do widocznej góry webp (etykieta nad zdjęciem + overlap alfa). */
export const ABOUT_MISSION_TEXT_TOP_OFFSET =
	"pt-24 sm:pt-28 lg:pt-[calc(6.83mm+1rem+2px+19.44rem*960/720*0.064-19.44rem*0.067)] xl:pt-[calc(6.83mm+1rem+2px+22.68rem*960/720*0.064-22.68rem*0.067)]" as const;

/** Zdjęcie domknięcia — nachodzi na dół sekcji misji (między sekcją 3 a 4). */
export const ABOUT_CLOSING_MEDIA_TOP_OFFSET = "-mt-16 sm:-mt-24 lg:-mt-[250px]" as const;

/** Biały pas nad footerem — sekcja domknięcia. */
export const ABOUT_CLOSING_FOOTER_WHITE_BAND_HEIGHT = "h-[130px]" as const;

/** Odstęp środka półkola od dołu sekcji — środek na krawędzi footera (size-20 → promień 40px). */
export const ABOUT_CLOSING_SEPARATOR_CENTER_BOTTOM = "bottom-0" as const;

/** Góra półkola — dół linii pionowej (promień size-20 = 40px). */
export const ABOUT_CLOSING_SEPARATOR_LINE_BOTTOM = "bottom-10" as const;

/** Tekst domknięcia — podniesienie względem domyślnego wyrównania do zdjęcia. */
export const ABOUT_CLOSING_TEXT_TOP_OFFSET = "lg:-mt-[50px]" as const;

/** Opaska brand-100 — sekcja domknięcia. */
export const ABOUT_CLOSING_BRAND100_BAND_HEIGHT = "h-[530px]" as const;
export const ABOUT_CLOSING_BRAND100_BAND_TOP = "top-[calc(50%-100px)]" as const;

/** Sygnet na styku brand-50 i opaska brand-100 (górna krawędź pasu). */
export const ABOUT_CLOSING_SIGNET_TOP = "top-[calc(50%-375px)]" as const;

export const ABOUT_SIGNET_IMAGE = "/images/lumine-signet-brown.png" as const;
export const ABOUT_SIGNET_ASPECT_CLASS = "aspect-421/396" as const;
/** Sygnet domknięcia — +20% względem bazowych 120px (w-30). */
export const ABOUT_SIGNET_WIDTH_CLASS = "w-24 md:w-36" as const;
