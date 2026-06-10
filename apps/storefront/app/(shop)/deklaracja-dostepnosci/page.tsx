import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deklaracja dostępności",
  description: "Deklaracja dostępności cyfrowej sklepu Lumineconcept",
};

export default function AccessibilityDeclarationPage() {
  const currentDate = new Date().toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-brand-800 mb-8">
        Deklaracja dostępności
      </h1>

      <div className="prose prose-brand max-w-none space-y-6">
        <p className="text-lg text-brand-600">
          Lumineconcept zobowiązuje się zapewnić dostępność swojej strony internetowej
          zgodnie z ustawą z dnia 4 kwietnia 2019 r. o dostępności cyfrowej stron
          internetowych i aplikacji mobilnych podmiotów publicznych.
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand-800 mt-8">Status zgodności</h2>
        <p>
          Niniejsza strona internetowa jest <strong>częściowo zgodna</strong> z ustawą
          z dnia 4 kwietnia 2019 r. o dostępności cyfrowej stron internetowych i
          aplikacji mobilnych podmiotów publicznych z powodu niezgodności lub wyłączeń
          wymienionych poniżej.
        </p>

        <h3 className="font-serif text-xl font-semibold text-brand-800">Treści niedostępne</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Niektóre obrazy produktów mogą nie posiadać pełnych opisów alternatywnych</li>
          <li>Niektóre treści wideo mogą nie zawierać napisów lub audiodeskrypcji</li>
        </ul>

        <h2 className="font-serif text-2xl font-bold text-brand-800 mt-8">Data sporządzenia deklaracji</h2>
        <p>Deklaracja została sporządzona dnia: <strong>{currentDate}</strong></p>
        <p>Deklaracja została ostatnio zaktualizowana dnia: <strong>{currentDate}</strong></p>

        <h2 className="font-serif text-2xl font-bold text-brand-800 mt-8">Informacje zwrotne i dane kontaktowe</h2>
        <p>
          W przypadku problemów z dostępnością strony internetowej prosimy o kontakt:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>E-mail: <a href="mailto:kontakt@lumineconcept.pl" className="text-brand-600 underline hover:text-brand-900">kontakt@lumineconcept.pl</a></li>
          <li>Telefon: +48 123 456 789</li>
        </ul>

        <p>
          Tą samą drogą można składać wnioski o udostępnienie informacji niedostępnej
          oraz składać żądania zapewnienia dostępności.
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand-800 mt-8">Procedura wnioskowo-skargowa</h2>
        <p>
          Każdy ma prawo do wystąpienia z żądaniem zapewnienia dostępności cyfrowej
          strony internetowej, aplikacji mobilnej lub jakiegoś ich elementu. Można
          również zażądać udostępnienia informacji za pomocą alternatywnego sposobu
          dostępu, na przykład przez odczytanie niedostępnego cyfrowo dokumentu,
          opisanie zawartości filmu bez audiodeskrypcji itp.
        </p>

        <p>
          Żądanie powinno zawierać dane osoby zgłaszającej żądanie, wskazanie, o którą
          stronę internetową lub aplikację mobilną chodzi oraz sposób kontaktu. Jeżeli
          osoba żądająca zgłasza potrzebę otrzymania informacji za pomocą
          alternatywnego sposobu dostępu, powinna także określić dogodny dla niej
          sposób przedstawienia tej informacji.
        </p>

        <p>
          Rozpatrzymy żądanie niezwłocznie, nie później niż w ciągu 7 dni od dnia
          wystąpienia z żądaniem. Jeżeli dotrzymanie tego terminu nie jest możliwe,
          niezwłocznie poinformujemy o tym wnoszącego żądanie, kiedy realizacja żądania
          będzie możliwa, przy czym termin ten nie może być dłuższy niż 2 miesiące od
          dnia wystąpienia z żądaniem.
        </p>

        <p>
          Jeżeli zapewnienie dostępności cyfrowej nie jest możliwe, zaproponujemy
          alternatywny sposób dostępu do informacji.
        </p>

        <p>
          W przypadku, gdy nie zrealizujemy żądania lub alternatywny sposób dostępu do
          informacji jest dla Ciebie niewystarczający, możesz złożyć skargę na
          zapewnienie dostępności cyfrowej strony internetowej, aplikacji mobilnej lub
          elementu strony internetowej, lub aplikacji mobilnej.
        </p>

        <p>
          Po wyczerpaniu wskazanej wyżej procedury można także złożyć wniosek do
          Rzecznika Praw Obywatelskich:{" "}
          <a
            href="https://www.rpo.gov.pl/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline hover:text-brand-900"
          >
            https://www.rpo.gov.pl/
          </a>
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand-800 mt-8">Dostępność architektoniczna</h2>
        <p>
          Niniejsza deklaracja dotyczy wyłącznie dostępności cyfrowej. W sprawach
          dostępności architektonicznej prosimy o kontakt.
        </p>
      </div>
    </div>
  );
}
