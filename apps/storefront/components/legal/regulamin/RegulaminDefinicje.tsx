import type { ReactNode } from "react";

function Def({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="border-b border-brand-100 py-4 last:border-0">
      <dt className="font-semibold text-brand-900">{term}</dt>
      <dd className="mt-2 text-pretty text-brand-800">{children}</dd>
    </div>
  );
}

export function RegulaminDefinicje() {
  return (
    <section id="definicje" className="scroll-mt-24">
      <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">Definicje</h2>
      <p className="mb-4 text-pretty">
        Użyte w Regulaminie zwroty pisane wielką literą, mają następujące znaczenie:
      </p>
      <dl className="divide-y-0">
        <Def term="Akty Prawne">
          przepisy prawa, które bezwzględnie obowiązują w momencie zawarcia Umowy o Świadczenie Usług lub Umowy
          Sprzedaży, wraz z uwzględnieniem wszelkich zmian w tych przepisach, jakie mogą nastąpić w czasie trwania tych
          umów, a także wszelkie nowe przepisy prawa powszechnie obowiązującego, które wejdą w życie w okresie
          obowiązywania tych umów;
        </Def>
        <Def term="Cena">
          określona w złotych polskich (PLN) kwota brutto (wraz z podatkiem) należna Sprzedawcy za przeniesienie
          własności Produktu na Klienta zgodnie z Umową Sprzedaży. Cena nie obejmuje kosztów dostawy ani innych usług,
          chyba że warunki aktualnych promocji, o których informuje Sprzedawca stanowią inaczej;
        </Def>
        <Def term="Dzień Roboczy">jeden dzień od poniedziałku do piątku z wyłączeniem dni ustawowo wolnych od pracy;</Def>
        <Def term="Klient">
          podmiot będący Konsumentem lub Przedsiębiorcą, który zgodnie z Regulaminem zawiera Umowę Sprzedaży za
          pośrednictwem Sklepu Internetowego, składa Zamówienie lub korzysta z Usługi Elektronicznej, posiadający zdolność
          do czynności prawnych w zakresie umożliwiającym skuteczne dokonanie tych czynności. Klient będący osobą
          fizyczną, której zdolności do czynności prawnych jest ograniczona, aby zawrzeć Umowę Sprzedaży lub Umowę o
          Świadczenie Usług, jest zobowiązany uzyskać wymaganą przez Akty Prawne zgodę swojego przedstawiciela ustawowego
          oraz przedstawić taką zgodę na żądanie Sprzedawcy. Przyjmuje się, że Umowy Sprzedaży, a także Umowa o Świadczenie
          Usług, zawierane za pośrednictwem Sklepu Internetowego, mają charakter umów powszechnie zawieranych w drobnych
          bieżących sprawach życia codziennego, o których mowa w Kodeksie Cywilnym. W uzasadnionych przypadkach zawarcie
          Umowy Sprzedaży za pośrednictwem Sklepu Internetowego będzie możliwe jedynie przez osoby powyżej 18 roku życia
          oraz posiadające pełną zdolność do czynności prawnych – o czym Sprzedawca poinformuje Klienta po złożeniu
          Zamówienia. Klientem może być osoba fizyczna, osoba prawna lub jednostka organizacyjna nieposiadająca osobowości
          prawnej, której ustawa przyznaje zdolność prawną, która w swoim imieniu podejmuje czynności celem nabycia lub
          nabywa Produkty za pośrednictwem Sklepu Internetowego;
        </Def>
        <Def term="Kodeks Cywilny">ustawa z dnia 23 kwietnia 1964 r. Kodeks cywilny, (Dz.U.2023 poz. 1610 ze zm.);</Def>
        <Def term="Konsument">
          osoba fizyczna dokonująca z przedsiębiorcą czynności prawnej niezwiązanej bezpośrednio z jej działalnością
          gospodarczą lub zawodową;
        </Def>
        <Def term="Koszyk">
          jedna z Usług Elektronicznych świadczonych przez Sprzedawcę za pośrednictwem Sklepu Internetowego, umożliwiająca
          złożenie Zamówienia obejmującego wybraną ilość określonych przez Klienta Produktów, a także obejmująca takie
          funkcjonalności jak podsumowanie Ceny wybranych przez Klienta Produktów oraz prezentowanie łącznej Ceny za
          wszystkie Produkty znajdujące się w Koszyku oraz prezentowanie łącznej wartość Zamówienia, tj. obejmującej
          również koszt dostawy. Sprzedawca zastrzega możliwość wprowadzenia limitu Produktów lub limitu łącznej Ceny
          Produktów możliwych do dodania w ramach jednego Zamówienia. W takim przypadku, Klient zostanie o tym
          powiadomiony za pomocą odpowiedniego komunikatu – podczas próby złożenia Zamówienia;
        </Def>
        <Def term="Nielegalne Treści">
          wszelkie informacje, które same w sobie lub przez odniesienie do danego działania są niezgodne z powszechnie
          obowiązującym prawem, w tym Aktami Prawnymi (tj. przede wszystkim treści dyskryminujące, wulgarne, nawołujące do
          nienawiści, naruszające dobra osobiste, naruszające prawa autorskie oraz treści, które promują materiały o
          charakterze jednoznacznie seksualnym, przemoc lub jakąkolwiek nielegalną działalność).
        </Def>
        <Def term="Produkt">
          rzecz ruchoma stanowiąca przedmiot Zamówienia lub Umowy Sprzedaży między Klientem a Sprzedawcą, prezentowana w
          Sklepie Internetowym przez Sprzedawcę i która może ulegać konfiguracji na życzenie Klienta;
        </Def>
        <Def term="Przedsiębiorca">
          Kupujący, który nie jest Konsumentem i który zawiera Umowę Sprzedaży lub Umowę o Świadczenie Usług lub inną umowę
          ze Sprzedawcą w celu związanym bezpośrednio lub pośrednio z prowadzoną działalnością gospodarczą lub zawodową;
        </Def>
        <Def term="Regulamin">
          niniejszy regulamin określający warunki i zasady korzystania przez Klientów ze Sklepu Internetowego i jego
          funkcjonalności oraz zasady składania Zamówień oraz zawierania i realizacji Umów Sprzedaży. W zakresie Usług
          Elektronicznych niniejszy Regulamin jest regulaminem, o którym mowa w art. 8 ustawy z dnia 18 lipca 2002 r. o
          świadczeniu usług drogą elektroniczną;
        </Def>
        <Def term="Sklep Internetowy">
          serwis internetowy prowadzony przez Sprzedawcę, umożliwiający składanie Zamówień, zawieranie Umów Sprzedaży oraz
          świadczenie przez Sprzedawcę Usług Elektronicznych, dostępny pod adresem internetowym: www.lumineconcept.pl;
        </Def>
        <Def term="Sprzedawca">
          Katarzyna Knapik, prowadząca działalność gospodarczą pod firmą KATARZYNA KNAPIK LUMINE CONCEPT, adres: ul. Jana
          Pawła II 93, 34-115 Ryczów; NIP 5512668956, REGON 540207674, adres strony internetowej: www.lumineconcept.pl,
          adres poczty elektronicznej: kontakt@lumineconcept.pl;
        </Def>
        <Def term="Treść">
          treść tekstowa, graficzna lub multimedialna (w tym w szczególności opis lub zdjęcie Produktu), w tym stanowiąca
          utwór w rozumieniu ustawy z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych (Dz.U.2022 poz. 2509 ze
          zm.) oraz wizerunek osoby fizycznej, zamieszczana i rozpowszechniana przez Sprzedawcę w ramach Sklepu
          Internetowego;
        </Def>
        <Def term="Umowa o Świadczenie Usług">
          umowa o korzystanie ze Sklepu Internetowego i świadczonych za jego pośrednictwem Usług Elektronicznych, zawierana
          między Klientem a Sprzedawcą, na odległość i za pośrednictwem Sklepu Internetowego, na warunkach i zasadach
          określonych w Regulaminie, który stanowi integralną część Umowy o Świadczenie Usług;
        </Def>
        <Def term="Umowa Sprzedaży">
          umowa sprzedaży Produktu w rozumieniu przepisów Kodeksu cywilnego, zawierana między Sprzedawcą a Kupującym za
          pośrednictwem Sklepu Internetowego, której przedmiotem jest przeniesienie przez Sprzedawcę na rzecz Kupującego
          własności Produktu lub Produktów objętych Zamówieniem złożonym przez Kupującego, w zamian za zapłatę Ceny
          powiększonej o opłaty dodatkowe, w tym koszty dostawy – wskazane Kupującemu podczas składania Zamówienia. Warunki
          Umowy Sprzedaży określa w szczególności Regulamin. Umowa Sprzedaży jest zawierana pomiędzy Kupującym a
          Sprzedawcą z wykorzystaniem środków porozumiewania się na odległość, po akceptacji danego Zamówienia przez
          Sprzedawcę na zasadach określonych w Regulaminie. Złożenie Zamówienia nie stanowi o zawarciu Umowy Sprzedaży ani
          zobowiązaniu Sprzedawcy do jej zawarcia;
        </Def>
        <Def term="Usługi Elektroniczne">
          usługi świadczone drogą elektroniczną w rozumieniu ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą
          elektroniczną (Dz.U.2020 poz. 344 ze zm.), przez Sprzedawcę na rzecz Klienta za pośrednictwem Sklepu
          Internetowego, zgodnie z Regulaminem. W zakresie, w jakim Usługi Elektroniczne są świadczone przez podmioty
          współpracujące ze Sprzedawcą, odpowiednie postanowienia dotyczące zasad korzystania z tych usług zawarte zostały
          w regulaminach świadczenia usług przez takie podmioty;
        </Def>
        <Def term="Ustawa o Prawach Konsumenta">
          ustawa z dnia 30 maja 2014 r. o prawach konsumenta (Dz.U.2023 poz. 2759 ze zm.);
        </Def>
        <Def term="Zamówienie">
          oświadczenie woli składane Sprzedawcy przez Kupującego (w tym w formie elektronicznej), obejmujące wiążącą
          Kupującego od momentu złożenia Zamówienia ofertę zawarcia Umowy Sprzedaży i określające Produkt lub Produkty,
          które Kupujący chce nabyć od Sprzedawcy, a także zawierające dane Klienta konieczne dla zawarcia i wykonania Umowy
          Sprzedaży. W ramach jednego zamówienia, Kupujący może złożyć kilka ofert zakupu Produktu;
        </Def>
        <Def term="Zamówienie Ekspresowe">
          świadczona przez Sprzedawcę na rzecz Klienta opcjonalna usługa dodatkowa polegająca na realizacji Zamówienia w
          terminie do 3 dni roboczych. Realizacja Zamówienia Ekspresowego wiąże się z powiększeniem o 50% Ceny za Produkty
          objęte Zamówieniem.
        </Def>
      </dl>
    </section>
  );
}
