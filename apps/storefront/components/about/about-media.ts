/** Wspólna szerokość zdjęć sekcji O nas (~81% poprzedniego max-w-sm/md). */
export const ABOUT_MEDIA_WIDTH_CLASS = "max-w-[19.44rem] sm:max-w-[22.68rem]" as const;

/** Odstęp od środka (gutter) — lewa kolumna z tekstem wyrównanym w prawo. */
export const ABOUT_TEXT_GUTTER_RIGHT = "md:pr-4" as const;

/** Odstęp od środka — prawa kolumna ze zdjęciem (lustrzane odbicie tekstu intro). */
export const ABOUT_MEDIA_GUTTER_LEFT = "md:pl-4" as const;

/** Odstęp od środka — prawa kolumna z tekstem (misja). Linia: AboutMissionSection. */
export const ABOUT_TEXT_GUTTER_LEFT = "md:pl-10 lg:pl-14 xl:pl-16" as const;

/** Odstęp od środka — lewa kolumna ze zdjęciem (lustrzane odbicie tekstu misji). */
export const ABOUT_MEDIA_GUTTER_RIGHT = "md:pr-10 lg:pr-14 xl:pr-16" as const;

/** Tekst misji — wyrównanie do widocznej góry webp (etykieta nad zdjęciem + overlap alfa). */
export const ABOUT_MISSION_TEXT_TOP_OFFSET =
  "md:pt-[calc(6.83mm+1rem+2px+19.44rem*960/720*0.064-19.44rem*0.067)] lg:pt-[calc(6.83mm+1rem+2px+22.68rem*960/720*0.064-22.68rem*0.067)]" as const;
