/** Komunikat po zapisie CMS (tekst live; obrazy — po ręcznym redeploy). */
export function cmsSaveSuccessMessage(): string {
	return "Zapisano. Tekst jest już na stronie. Po zmianie zdjęć użyj przycisku Redeploy.";
}

/** Komunikat po automatycznym zapisie galerii realizacji. */
export function cmsGallerySaveSuccessMessage(): string {
	return "Galeria zapisana w CMS. Na stronie sklepu zdjęcia pojawią się po Redeploy (~2–3 min).";
}
