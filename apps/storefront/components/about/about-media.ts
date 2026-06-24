/** Mobile / tablet — pozycja zdjęcia w kolumnie (< lg). */
export const ABOUT_MOBILE_MEDIA_LOWER = "max-lg:-mt-[150px] lg:mt-0" as const;

/** Hero mobile — równy odstęp nad i pod blokiem nagłówka (h1 + subtitle). */
export const ABOUT_HERO_MOBILE_HEADLINE_PADDING = "max-lg:py-12" as const;

/** Mobile — treść nachodzi na hero, ale o 100px mniej niż pełne nachodzenie (150px w dół vs wcześniejsze 50px). */
export const ABOUT_PAGE_CONTENT_MOBILE_LOWER = "max-lg:translate-y-[150px] lg:translate-y-0" as const;

/** Poziomy gutter strony O nas — 50px (mobile/tablet). */
export const ABOUT_PAGE_GUTTER = "px-[50px]" as const;

/** Desktop (lg+) — siatka sekcji jak w commitach 17–18 czerwca. */
export const ABOUT_DESKTOP_GRID_SHELL =
	"mx-auto hidden w-full max-w-7xl grid-cols-2 items-start gap-3 px-4 lg:grid lg:gap-16 xl:gap-20" as const;

/** Wewnętrzny limit szerokości treści — mobile/tablet w gutterze 50px. */
export const ABOUT_PAGE_CONTENT_MAX = "mx-auto w-full max-w-7xl min-w-0" as const;

/** Zapobiega wychodzeniu elementów poza gutter. */
export const ABOUT_PAGE_CLIP = "overflow-x-clip" as const;

/** Sekcja treści — bezpieczna strefa 50px (mobile/tablet). */
export const ABOUT_SECTION_SAFE = "overflow-x-clip" as const;

/** Intro desktop — wiersz zdjęcie + napis boczny (100px od zdjęcia). */
export const ABOUT_INTRO_DESKTOP_MEDIA_ROW =
	"flex min-w-0 max-w-full items-stretch justify-end gap-[100px] overflow-x-clip lg:overflow-visible" as const;

/** Intro desktop — pionowy napis boczny (tylko xl+, znika po pierwszym breakpoincie w dół). */
export const ABOUT_INTRO_SIDE_CAPTION_VISIBILITY = "hidden xl:flex" as const;

export const ABOUT_INTRO_SIDE_CAPTION_ALIGN = "shrink-0 xl:translate-y-[220px]" as const;

/** Intro — nachodzenie zdjęcia na hero / sekcję wyżej. */
export const ABOUT_INTRO_MEDIA_OFFSET = "-mt-48 xl:-mt-56" as const;

/** Intro mobile — środek zdjęcia na styku hero / brand-50 (−20px mniej nachodzenia na hero). */
export const ABOUT_INTRO_MOBILE_IMAGE_OVERLAP =
	"max-lg:-mt-[calc(12rem_-_1.125rem_-_20px)] lg:-mt-48 xl:-mt-56" as const;

/** Intro mobile — przesunięcie nagłówka w prawo. */
export const ABOUT_INTRO_MOBILE_HEADING_SHIFT_RIGHT = "max-lg:translate-x-[30px]" as const;

/** Intro — nachodzenie sekcji na hero. */
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

/** Intro mobile — prawa krawędź tekstu w osi środka szerokości zdjęcia. */
export const ABOUT_INTRO_MOBILE_BODY_WRAPPER =
	"max-lg:ml-auto max-lg:mr-[calc(5.3625rem-30px)] max-lg:w-[calc(100%+30px-5.3625rem)] max-lg:text-right max-lg:[&_p]:w-full" as const;

/** Mobile — wspólny padding wiersza body pod siatką zdjęcia. */
export const ABOUT_SECTION_MOBILE_BODY_ROW = "min-w-0 pt-4 sm:pt-5" as const;

/** Mobile misja — zdjęcie od lewej krawędzi (jak nagłówki w gutterze 50px). */
export const ABOUT_MISSION_MOBILE_MEDIA_ALIGN =
	"max-lg:flex max-lg:items-start max-lg:justify-start" as const;

export const ABOUT_MISSION_MOBILE_MEDIA_BLOCK = "max-lg:mx-0 max-lg:items-start" as const;

/** Mobile misja — tekst obok zdjęcia, wyrównanie do góry obrazu. */
export const ABOUT_MISSION_MOBILE_TEXT_BESIDE_OFFSET = "max-lg:pt-[3.25rem] lg:pt-0" as const;

/** Mobile misja — podniesienie nagłówka względem dołu zdjęcia. */
export const ABOUT_MISSION_MOBILE_HEADING_RAISE = "max-lg:-translate-y-[20px]" as const;

/** Mobile misja — flex obok zdjęcia: kolumna media + tekst, dokładnie 10px gap. */
export const ABOUT_MISSION_MOBILE_BESIDE_LAYOUT =
	"flex flex-row items-start gap-[10px]" as const;

export const ABOUT_MISSION_MOBILE_MEDIA_COL =
	"max-lg:-ml-[30px] w-[10.725rem] shrink-0 min-w-0 max-w-[10.725rem]" as const;

export const ABOUT_MISSION_MOBILE_TEXT_COL =
	"min-w-0 flex-1 basis-0 self-stretch" as const;

/** Mobile misja — tekst wypełnia kolumnę do prawej krawędzi guttera. */
export const ABOUT_MISSION_MOBILE_BODY_WIDTH = "max-lg:w-full" as const;

/** @deprecated Użyj ABOUT_MISSION_MOBILE_BESIDE_LAYOUT — alias dla propsa mobileGridClassName. */
export const ABOUT_MISSION_MOBILE_GRID = ABOUT_MISSION_MOBILE_BESIDE_LAYOUT;

/** Mobile misja — tekst pod zdjęciem; ten sam pas poziomy co intro (50px → oś środka zdjęcia). */
export const ABOUT_MISSION_MOBILE_BODY_WRAPPER =
	"max-lg:w-[calc(100%+30px-5.3625rem)] max-lg:text-left max-lg:[&_p]:w-full" as const;

/** Intro desktop — tekst w kolumnie. */
export const ABOUT_INTRO_DESKTOP_BODY_EDGE = "lg:w-full lg:max-w-full lg:text-right" as const;

/** Szerokość zdjęć — mobile wyśrodkowane; desktop jak w mockupie. */
export const ABOUT_MEDIA_WIDTH_CLASS =
	"w-full max-w-full lg:max-w-[19.44rem] xl:max-w-[22.68rem]" as const;

/** Mobile-only — ta sama szerokość co zdjęcie (w-full + max-w, nie kurczy się do treści). */
export const ABOUT_MEDIA_WIDTH_MOBILE_CLASS =
	"max-lg:mx-auto max-lg:w-full max-lg:max-w-[10.725rem]" as const;

/** Mobile — zdjęcie 20px od krawędzi viewportu (gutter 50px → breakout 30px). */
export const ABOUT_MOBILE_MEDIA_FRAME_RIGHT =
	"max-lg:ml-auto max-lg:-mr-[30px] max-lg:w-full max-lg:max-w-[10.725rem]" as const;

export const ABOUT_MOBILE_MEDIA_FRAME_LEFT =
	"max-lg:mr-auto max-lg:-ml-[30px] max-lg:w-full max-lg:max-w-[10.725rem]" as const;

/** @deprecated Alias — ABOUT_MOBILE_MEDIA_FRAME_RIGHT */
export const ABOUT_INTRO_SECTION_MOBILE_FRAME = ABOUT_MOBILE_MEDIA_FRAME_RIGHT;

/** Mobile intro — wspólna ramka zdjęcia (sekcje media-start/end). */
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

/** Tekst misji — wyrównanie do góry webp (tylko desktop). */
export const ABOUT_MISSION_TEXT_TOP_OFFSET =
	"max-lg:pt-0 lg:pt-[calc(6.83mm+1rem+2px+19.44rem*960/720*0.064-19.44rem*0.067)] xl:pt-[calc(6.83mm+1rem+2px+22.68rem*960/720*0.064-22.68rem*0.067)]" as const;

/** Biały pas tła — sekcja misji. */
export const ABOUT_MISSION_WHITE_BAND_TOP = "top-[16%]" as const;
export const ABOUT_MISSION_WHITE_BAND_HEIGHT = "h-[calc(47%+140px)]" as const;

/** Zdjęcie domknięcia — nachodzi na dół sekcji misji (tylko desktop). */
export const ABOUT_CLOSING_MEDIA_TOP_OFFSET = "max-lg:-mt-[70px] lg:-mt-[250px]" as const;

/** Biały pas nad footerem — sekcja domknięcia. */
export const ABOUT_CLOSING_FOOTER_WHITE_BAND_HEIGHT = "h-[130px]" as const;

/** Odstęp środka półkola od dołu sekcji. */
export const ABOUT_CLOSING_SEPARATOR_CENTER_BOTTOM = "bottom-0" as const;

/** Góra półkola — dół linii pionowej. */
export const ABOUT_CLOSING_SEPARATOR_LINE_BOTTOM = "bottom-10" as const;

/** Tekst domknięcia — podniesienie względem domyślnego wyrównania do zdjęcia. */
export const ABOUT_CLOSING_TEXT_TOP_OFFSET = "max-lg:mt-0 lg:-mt-[50px]" as const;

/** Mobile domknięcie — nagłówek 20px od lewej krawędzi viewportu (gutter 50px → -30px). */
export const ABOUT_CLOSING_MOBILE_HEADING_INSET =
	"max-lg:-ml-[30px] max-lg:text-left" as const;

/** Mobile domknięcie — kolumna nagłówka wyrównana do lewej. */
export const ABOUT_CLOSING_MOBILE_HEADING_COLUMN = "max-lg:items-start" as const;

/** Mobile domknięcie — korekta pionowa nagłówka obok zdjęcia. */
export const ABOUT_CLOSING_MOBILE_HEADING_LOWER = "max-lg:translate-y-[30px]" as const;

/** Mobile domknięcie — obniżenie tekstu body pod nagłówkiem. */
export const ABOUT_CLOSING_MOBILE_BODY_LOWER = "max-lg:translate-y-[30px]" as const;

/** Mobile — przelamanie biały / brand-50 (środek zdjęcia, −50px). */
export const ABOUT_CLOSING_MOBILE_BRAND50_TOP =
	"max-lg:top-[calc(1rem_-_70px_+_10.725rem_*_960_/_720_/_2_-_50px)]" as const;

/** Mobile — biały pas do przelamania (sięga w strefę nachodzenia zdjęcia na misję). */
export const ABOUT_CLOSING_MOBILE_WHITE_COVER_TOP = "max-lg:-top-[12rem]" as const;
export const ABOUT_CLOSING_MOBILE_WHITE_COVER_HEIGHT =
	"max-lg:h-[calc(12rem_+_1rem_-_70px_+_10.725rem_*_960_/_720_/_2_-_50px)]" as const;

/** Mobile — wysokość brand-50 (od środka zdjęcia do brand-100). */
export const ABOUT_CLOSING_MOBILE_BRAND50_HEIGHT =
	"max-lg:h-[calc(10.725rem_*_960_/_720_/_2_+_50px)]" as const;

/** Mobile — początek brand-100 pod nagłówkiem (dół wiersza zdjęcia + offset nagłówka). */
export const ABOUT_CLOSING_MOBILE_BRAND100_TOP =
	"max-lg:top-[calc(1rem_-_70px_+_10.725rem_*_960_/_720_+_50px_-_50px)]" as const;

/** Opaska brand-100 — sekcja domknięcia. */
export const ABOUT_CLOSING_BRAND100_BAND_HEIGHT = "max-lg:bottom-0 max-lg:h-auto lg:h-[530px]" as const;
/** Desktop — środek opaski; mobile — kotwica pod nagłówkiem (patrz MOBILE_BRAND100_TOP). */
export const ABOUT_CLOSING_BRAND100_BAND_TOP =
	"max-lg:top-[calc(1rem_-_70px_+_10.725rem_*_960_/_720_+_50px_-_50px)] lg:top-[calc(50%_+_40px)]" as const;
export const ABOUT_CLOSING_BRAND100_BAND_TRANSFORM = "max-lg:translate-y-0 lg:-translate-y-1/2" as const;

/** Sygnet na styku brand-50 i opaska brand-100. */
export const ABOUT_CLOSING_SIGNET_TOP = "top-[calc(50%_-_235px)]" as const;

export const ABOUT_SIGNET_IMAGE = "/images/lumine-signet-brown.png" as const;
export const ABOUT_SIGNET_ASPECT_CLASS = "aspect-421/396" as const;
/** Sygnet — mobile mniejszy, desktop w-36. */
export const ABOUT_SIGNET_WIDTH_CLASS = "w-24 lg:w-36" as const;
