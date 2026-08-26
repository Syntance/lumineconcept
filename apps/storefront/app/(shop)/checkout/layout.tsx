import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Cała ścieżka płatności poza indeksem.
 *
 * `/checkout` i `/checkout/potwierdzenie` miały własne `robots: { index: false }`,
 * ale `/checkout/p24/retry`, `/checkout/przelewy24/start` i `.../return` to
 * komponenty klienckie — a te nie mogą eksportować `metadata`. Layout jest
 * jedynym miejscem, w którym da się je objąć: metadane Next dziedziczą się
 * po segmentach, więc `noindex` spływa na cały podkatalog.
 *
 * `robots.txt` też blokuje `/checkout`, ale zablokowany crawl oznacza, że
 * robot nie zobaczy `noindex` — dlatego trzymamy oba zabezpieczenia, tak jak
 * dotąd robiły to pojedyncze strony checkoutu.
 */
export const metadata: Metadata = {
	robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
	return <>{children}</>;
}
