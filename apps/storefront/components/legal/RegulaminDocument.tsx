import Link from "next/link";
import { RegulaminDefinicje } from "./regulamin/RegulaminDefinicje";
import { RegulaminPostanowieniaOgolne } from "./regulamin/RegulaminPostanowieniaOgolne";
import { RegulaminUslugiElektroniczne } from "./regulamin/RegulaminUslugiElektroniczne";
import { RegulaminZamowienia } from "./regulamin/RegulaminZamowienia";
import { RegulaminReklamacje } from "./regulamin/RegulaminReklamacje";
import { RegulaminDostawaPlatnosci } from "./regulamin/RegulaminDostawaPlatnosci";
import { RegulaminPozasadoweOdstapienie } from "./regulamin/RegulaminPozasadoweOdstapienie";
import { RegulaminPrzedsiebiorcyIp } from "./regulamin/RegulaminPrzedsiebiorcyIp";
import { RegulaminZmianaRodoKoniec } from "./regulamin/RegulaminZmianaRodoKoniec";
import { RegulaminZalacznik } from "./regulamin/RegulaminZalacznik";

const sectionLinkClass =
  "text-brand-800 underline-offset-2 hover:text-brand-900 hover:underline";

export function RegulaminDocument() {
  return (
    <article
      className="text-[1.0625rem] leading-relaxed text-brand-800 [&_a]:font-medium [&_a]:text-brand-800 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-brand-900"
      lang="pl"
    >
      <div className="rounded-lg border border-brand-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-4">
          Niniejszy Regulamin określa zasady korzystania przez Klientów ze Sklepu Internetowego, świadczenia przez
          Sprzedawcę na rzecz Klientów Usług Elektronicznych oraz zasady składania Zamówień oraz zawierania i realizacji
          Umów Sprzedaży. Regulamin określa również zasady dostawy Produktów oraz zgłaszania Reklamacji. Regulamin zawiera
          również inne istotne informacje na temat praw i obowiązków Klientów oraz Sprzedawcy.
        </p>
        <p className="mb-6">
          W razie wątpliwości lub pytań dotyczących treści Regulaminu zachęcamy do kontaktu ze Sprzedawcą, za
          pośrednictwem adresu e-mail:{" "}
          <a href="mailto:kontakt@lumineconcept.pl">kontakt@lumineconcept.pl</a>.
        </p>

        <nav aria-label="Spis treści regulaminu" className="mb-10 border-t border-brand-100 pt-6">
          <h2 className="mb-3 font-display text-lg font-semibold text-brand-800">Spis treści</h2>
          <ol className="list-decimal space-y-1.5 pl-6 text-brand-700">
            <li>
              <a href="#definicje" className={sectionLinkClass}>
                Definicje
              </a>
            </li>
            <li>
              <a href="#postanowienia-ogolne" className={sectionLinkClass}>
                Postanowienia ogólne
              </a>
            </li>
            <li>
              <a href="#uslugi-elektroniczne" className={sectionLinkClass}>
                Usługi elektroniczne w sklepie internetowym
              </a>
            </li>
            <li>
              <a href="#zamowienia" className={sectionLinkClass}>
                Zamówienia i umowy sprzedaży
              </a>
            </li>
            <li>
              <a href="#reklamacje" className={sectionLinkClass}>
                Reklamacje
              </a>
            </li>
            <li>
              <a href="#dostawa" className={sectionLinkClass}>
                Dostawa produktów
              </a>
            </li>
            <li>
              <a href="#platnosci" className={sectionLinkClass}>
                Płatności za zamówienia
              </a>
            </li>
            <li>
              <a href="#pozasadowe" className={sectionLinkClass}>
                Pozasądowe sposoby rozpatrywania reklamacji i dochodzenia roszczeń
              </a>
            </li>
            <li>
              <a href="#odstapienie" className={sectionLinkClass}>
                Prawo odstąpienia od umowy (zwrot produktu)
              </a>
            </li>
            <li>
              <a href="#przedsiebiorcy" className={sectionLinkClass}>
                Postanowienia dotyczące przedsiębiorców
              </a>
            </li>
            <li>
              <a href="#wlasnosc-intelektualna" className={sectionLinkClass}>
                Prawa własności intelektualnej
              </a>
            </li>
            <li>
              <a href="#zmiana-regulaminu" className={sectionLinkClass}>
                Zmiana regulaminu
              </a>
            </li>
            <li>
              <a href="#dane-osobowe" className={sectionLinkClass}>
                Przetwarzanie danych osobowych
              </a>
            </li>
            <li>
              <a href="#postanowienia-koncowe" className={sectionLinkClass}>
                Postanowienia końcowe
              </a>
            </li>
            <li>
              <a href="#zalacznik-1" className={sectionLinkClass}>
                Załącznik nr 1 — wzór odstąpienia
              </a>
            </li>
          </ol>
        </nav>

        <RegulaminDefinicje />
        <RegulaminPostanowieniaOgolne />
        <RegulaminUslugiElektroniczne />
        <RegulaminZamowienia />
        <RegulaminReklamacje />
        <RegulaminDostawaPlatnosci />
        <RegulaminPozasadoweOdstapienie />
        <RegulaminPrzedsiebiorcyIp />
        <RegulaminZmianaRodoKoniec />
        <RegulaminZalacznik />
      </div>

      <p className="mt-6 text-center text-sm text-brand-600">
        <Link href="/" className="font-medium underline underline-offset-2 hover:text-brand-900">
          Wróć na stronę główną
        </Link>
      </p>
    </article>
  );
}
