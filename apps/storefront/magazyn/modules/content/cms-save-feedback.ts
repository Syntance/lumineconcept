"use client";

/** Komunikat po zapisie CMS (hybrid: tekst live, obrazy przez deploy). */
export function cmsSaveSuccessMessage(mediaPublishQueued?: boolean): string {
	if (mediaPublishQueued) {
		return "Zapisano. Tekst jest już na stronie (bez pełnego redeploy). Obrazy zostaną zoptymalizowane po publikacji mediów (ok. 2–3 min).";
	}
	return "Zapisano. Treść jest już na stronie — redeploy nie jest potrzebny.";
}
