export function RegulaminZalacznik() {
  return (
    <section id="zalacznik-1" className="mt-10 scroll-mt-24 rounded-lg border border-dashed border-brand-300 bg-brand-50/50 p-6 sm:p-8">
      <h2 className="mb-2 font-display text-lg font-bold uppercase tracking-wide text-brand-800">
        Załącznik nr 1 do Regulaminu – przykładowa treść oświadczenia Konsumenta o odstąpieniu od Umowy Sprzedaży
      </h2>
      <p className="mb-6 text-sm text-brand-600">
        (formularz ten należy wypełnić i odesłać tylko w przypadku chęci odstąpienia od umowy)
      </p>

      <div className="space-y-4 text-brand-800">
        <p>
          <span className="font-semibold">Adresat:</span>
          <br />
          KATARZYNA KNAPIK LUMINE CONCEPT
          <br />
          Jana Pawła II 93, 34-115 Ryczów
          <br />
          <a href="mailto:kontakt@lumineconcept.pl">kontakt@lumineconcept.pl</a>
        </p>

        <p>
          Ja/My<sup>*</sup> niniejszym informuję/informujemy<sup>*</sup> o moim/naszym<sup>*</sup> odstąpieniu od umowy
          sprzedaży następujących towarów<sup>*</sup>:
        </p>
        <p>umowy o świadczenie następującej usługi<sup>*</sup>:</p>
        <p>
          Data zawarcia umowy<sup>*</sup>/odbioru<sup>*</sup>:
        </p>
        <p>Imię i nazwisko konsumenta(-ów):</p>
        <p>Adres konsumenta(-ów):</p>
        <p>Podpis konsumenta(-ów) (tylko jeżeli formularz jest przesyłany w wersji papierowej):</p>
        <p>Data:</p>

        <p className="pt-4 text-sm italic text-brand-600">
          <sup>*</sup> Niepotrzebne skreślić.
        </p>
      </div>
    </section>
  );
}
