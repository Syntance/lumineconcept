import Link from "next/link";

export function PolitykaZwrotowDocument() {
  return (
    <article
      className="text-[1.0625rem] leading-relaxed text-brand-800 [&_a]:font-medium [&_a]:text-brand-800 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-brand-900"
      lang="pl"
    >
      <div className="rounded-lg border border-brand-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-6 text-pretty">
          Poniżej znajdziesz najważniejsze informacje dotyczące zgłaszania reklamacji oraz zwrotów. Pełne zasady opisuje{" "}
          <Link href="/regulamin" className="font-semibold">
            regulamin sklepu
          </Link>
          .
        </p>

        <section id="reklamacje" className="scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            Polityka reklamacji
          </h2>
          <ul className="list-disc space-y-4 pl-6 text-pretty marker:text-brand-500">
            <li>
              W przypadku wystąpienia wady zakupionego u Sprzedawcy towaru Klient ma prawo do reklamacji w oparciu o
              przepisy dotyczące rękojmi w Kodeksie cywilnym.
            </li>
            <li>
              Reklamację należy zgłosić drogą elektroniczną na podany w Regulaminie adres mailowy Sprzedawcy:{" "}
              <a href="mailto:kontakt@lumineconcept.pl">kontakt@lumineconcept.pl</a>.
            </li>
            <li>
              W reklamacji należy zawrzeć m.in. zwięzły opis wady, okoliczności (w tym datę) jej wystąpienia, dane Klienta
              składającego reklamację oraz żądanie Klienta w związku z wadą towaru.
            </li>
            <li>Sprzedawca ustosunkuje się do żądania reklamacyjnego w terminie 14 dni.</li>
            <li>
              Klient ponosi koszty i ryzyko związane z odesłaniem towaru do nas. Towar należy wysłać na adres:
            </li>
          </ul>

          <div className="my-4 rounded-md border border-brand-200 bg-brand-50/60 p-4">
            <p className="font-semibold text-brand-900">Lumine Concept</p>
            <p>ul. Jana Pawła II 93</p>
            <p>34-115 Ryczów</p>
          </div>

          <p className="text-pretty">
            Nie ponosimy odpowiedzialności za towary uszkodzone lub zagubione w trakcie transportu zwrotnego. Z tego
            względu zalecamy korzystanie z ubezpieczeń i usługi śledzenia przesyłek pocztowych. Nie możemy dokonać zwrotu
            pieniędzy, jeśli nie otrzymamy towaru lub potwierdzenia przyjęcia przez nas przesyłki zwrotnej.
          </p>
        </section>

        <section id="zwroty" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            Zwrot towarów
          </h2>
          <div className="rounded-md border-l-4 border-brand-500 bg-brand-50 p-4 text-pretty">
            <p>
              Prawo do odstąpienia od Umowy i zwrotu zamówionego Produktu{" "}
              <span className="font-semibold">nie przysługuje Klientowi</span>, ponieważ przedmiotem świadczenia niniejszej
              Umowy jest rzecz nieprefabrykowana, wyprodukowana według specyfikacji Konsumenta lub służąca zaspokojeniu
              jego zindywidualizowanych potrzeb.
            </p>
          </div>
        </section>

        <section id="kontakt" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">Kontakt do nas</h2>
          <p className="text-pretty">
            Jeśli masz jakiekolwiek pytania dotyczące naszej Polityki zwrotów i refundacji, skontaktuj się z nami drogą
            mailową na adres <a href="mailto:kontakt@lumineconcept.pl">kontakt@lumineconcept.pl</a>.
          </p>
        </section>
      </div>

      <p className="mt-6 text-center text-sm text-brand-600">
        <Link href="/" className="font-medium underline underline-offset-2 hover:text-brand-900">
          Wróć na stronę główną
        </Link>
      </p>
    </article>
  );
}
