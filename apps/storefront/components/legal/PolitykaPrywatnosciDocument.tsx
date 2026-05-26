import Link from "next/link";

const linkClass =
  "text-brand-800 underline-offset-2 hover:text-brand-900 hover:underline";

export function PolitykaPrywatnosciDocument() {
  return (
    <article
      className="text-[1.0625rem] leading-relaxed text-brand-800 [&_a]:font-medium [&_a]:text-brand-800 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-brand-900"
      lang="pl"
    >
      <div className="rounded-lg border border-brand-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-4">
          Niniejsza Polityka prywatności wyjaśnia, w jaki sposób Lumine Concept przetwarza dane osobowe Klientów Sklepu
          Internetowego dostępnego pod adresem{" "}
          <a href="https://www.lumineconcept.pl">www.lumineconcept.pl</a>. Dokument przygotowano w zgodzie z Rozporządzeniem
          Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w
          związku z przetwarzaniem danych osobowych (dalej: „RODO”) oraz powszechnie obowiązującymi przepisami prawa
          polskiego.
        </p>
        <p className="mb-6">
          W razie wątpliwości lub pytań prosimy o kontakt:{" "}
          <a href="mailto:kontakt@lumineconcept.pl">kontakt@lumineconcept.pl</a>.
        </p>

        <nav aria-label="Spis treści polityki prywatności" className="mb-10 border-t border-brand-100 pt-6">
          <h2 className="mb-3 font-display text-lg font-semibold text-brand-800">Spis treści</h2>
          <ol className="list-decimal space-y-1.5 pl-6 text-brand-700">
            <li>
              <a href="#administrator" className={linkClass}>
                Administrator danych
              </a>
            </li>
            <li>
              <a href="#zakres-danych" className={linkClass}>
                Zakres przetwarzanych danych
              </a>
            </li>
            <li>
              <a href="#cele-podstawy" className={linkClass}>
                Cele i podstawy prawne przetwarzania
              </a>
            </li>
            <li>
              <a href="#okres" className={linkClass}>
                Okres przechowywania danych
              </a>
            </li>
            <li>
              <a href="#odbiorcy" className={linkClass}>
                Odbiorcy danych
              </a>
            </li>
            <li>
              <a href="#przekazywanie" className={linkClass}>
                Przekazywanie danych poza EOG
              </a>
            </li>
            <li>
              <a href="#prawa" className={linkClass}>
                Prawa osób, których dane dotyczą
              </a>
            </li>
            <li>
              <a href="#cookies" className={linkClass}>
                Pliki cookies i podobne technologie
              </a>
            </li>
            <li>
              <a href="#analityka" className={linkClass}>
                Analityka i narzędzia marketingowe
              </a>
            </li>
            <li>
              <a href="#bezpieczenstwo" className={linkClass}>
                Bezpieczeństwo danych
              </a>
            </li>
            <li>
              <a href="#dzieci" className={linkClass}>
                Dane dzieci
              </a>
            </li>
            <li>
              <a href="#zmiany" className={linkClass}>
                Zmiany polityki prywatności
              </a>
            </li>
          </ol>
        </nav>

        <section id="administrator" className="scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            1. Administrator danych
          </h2>
          <p className="mb-3 text-pretty">
            Administratorem Twoich danych osobowych jest:
          </p>
          <div className="mb-4 rounded-md border border-brand-200 bg-brand-50/60 p-4">
            <p className="font-semibold text-brand-900">KATARZYNA KNAPIK LUMINE CONCEPT</p>
            <p>Katarzyna Knapik prowadząca działalność gospodarczą</p>
            <p>ul. Jana Pawła II 93, 34-115 Ryczów</p>
            <p>NIP: 5512668956 · REGON: 540207674</p>
            <p>
              E-mail: <a href="mailto:kontakt@lumineconcept.pl">kontakt@lumineconcept.pl</a>
            </p>
            <p>
              WWW: <a href="https://www.lumineconcept.pl">www.lumineconcept.pl</a>
            </p>
          </div>
          <p>
            We wszelkich sprawach dotyczących przetwarzania danych osobowych możesz skontaktować się z nami pisemnie na
            adres siedziby lub elektronicznie na adres e-mail wskazany powyżej.
          </p>
        </section>

        <section id="zakres-danych" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            2. Zakres przetwarzanych danych
          </h2>
          <p className="mb-3 text-pretty">
            W zależności od korzystania ze Sklepu Internetowego oraz Usług Elektronicznych, możemy przetwarzać następujące
            kategorie danych osobowych:
          </p>
          <ul className="list-disc space-y-2 pl-6 marker:text-brand-500">
            <li>
              <span className="font-semibold">dane identyfikacyjne i kontaktowe</span> – imię i nazwisko, adres e-mail,
              numer telefonu, adres dostawy i adres rozliczeniowy;
            </li>
            <li>
              <span className="font-semibold">dane firmowe</span> – w przypadku Przedsiębiorców: nazwa firmy, NIP, adres
              siedziby;
            </li>
            <li>
              <span className="font-semibold">dane transakcyjne</span> – numer Zamówienia, treść Zamówienia, zawartość
              Koszyka, wartość Zamówienia, sposób i status płatności;
            </li>
            <li>
              <span className="font-semibold">dane konfiguracji Produktu</span> – treści, grafiki, kody QR i inne
              materiały przekazane przez Klienta w celu personalizacji Produktu;
            </li>
            <li>
              <span className="font-semibold">korespondencja</span> – treści wiadomości przesyłanych przez formularz
              kontaktowy, formularz wycen, e-mail oraz wiadomości w mediach społecznościowych (Facebook, Instagram);
            </li>
            <li>
              <span className="font-semibold">dane techniczne</span> – adres IP, identyfikatory urządzenia, dane
              przeglądarki, dane o sesji, pliki cookies oraz logi serwera;
            </li>
            <li>
              <span className="font-semibold">treści generowane przez użytkownika</span> – opinie o Produktach, lista
              ulubionych Produktów (wishlist).
            </li>
          </ul>
        </section>

        <section id="cele-podstawy" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            3. Cele i podstawy prawne przetwarzania
          </h2>
          <p className="mb-3 text-pretty">Twoje dane osobowe przetwarzamy w następujących celach:</p>
          <ul className="list-disc space-y-3 pl-6 marker:text-brand-500">
            <li>
              <span className="font-semibold">zawarcie i wykonanie Umowy Sprzedaży lub Umowy o Świadczenie Usług</span>{" "}
              (w tym obsługa Zamówienia, dostawa Produktu, kontakt w sprawie realizacji) – art. 6 ust. 1 lit. b RODO;
            </li>
            <li>
              <span className="font-semibold">obsługa formularza wycen, formularza kontaktowego i korespondencji</span>{" "}
              – art. 6 ust. 1 lit. b RODO (czynności podejmowane na żądanie osoby przed zawarciem umowy) oraz art. 6
              ust. 1 lit. f RODO (uzasadniony interes Administratora w postaci udzielania odpowiedzi);
            </li>
            <li>
              <span className="font-semibold">rozpatrywanie reklamacji i obsługa procesu odstąpienia od umowy</span> –
              art. 6 ust. 1 lit. c RODO (obowiązek prawny) oraz art. 6 ust. 1 lit. b RODO;
            </li>
            <li>
              <span className="font-semibold">wystawianie i przechowywanie dokumentów księgowych (m.in. faktur VAT)</span>{" "}
              – art. 6 ust. 1 lit. c RODO w związku z przepisami podatkowymi i o rachunkowości;
            </li>
            <li>
              <span className="font-semibold">dochodzenie lub obrona przed roszczeniami</span> – art. 6 ust. 1 lit. f
              RODO (uzasadniony interes Administratora);
            </li>
            <li>
              <span className="font-semibold">zapewnienie bezpieczeństwa Sklepu Internetowego oraz wykrywanie nadużyć</span>{" "}
              – art. 6 ust. 1 lit. f RODO;
            </li>
            <li>
              <span className="font-semibold">analityka, statystyki i ulepszanie Sklepu Internetowego</span> – art. 6
              ust. 1 lit. f RODO lub art. 6 ust. 1 lit. a RODO (zgoda — w odniesieniu do cookies analitycznych);
            </li>
            <li>
              <span className="font-semibold">marketing własnych produktów i usług</span> (np. newsletter, komunikaty
              marketingowe) – art. 6 ust. 1 lit. a RODO (Twoja zgoda) oraz art. 6 ust. 1 lit. f RODO w zakresie marketingu
              bezpośredniego;
            </li>
            <li>
              <span className="font-semibold">publikowanie opinii o Produktach</span> – art. 6 ust. 1 lit. a RODO lub art.
              6 ust. 1 lit. f RODO.
            </li>
          </ul>
          <p className="mt-4 text-pretty">
            Podanie danych osobowych jest dobrowolne, jednak niezbędne do zawarcia i wykonania Umowy Sprzedaży, korzystania
            z Usług Elektronicznych oraz – w odpowiednim zakresie – do realizacji obowiązków prawnych spoczywających na
            Administratorze.
          </p>
        </section>

        <section id="okres" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            4. Okres przechowywania danych
          </h2>
          <ul className="list-disc space-y-3 pl-6 marker:text-brand-500">
            <li>
              dane związane z Umową Sprzedaży – przez czas niezbędny do wykonania umowy, a po jej zakończeniu przez okres
              przedawnienia roszczeń (zasadniczo 6 lat zgodnie z Kodeksem Cywilnym, a w przypadku roszczeń związanych z
              prowadzoną działalnością gospodarczą — 3 lata);
            </li>
            <li>
              dane zawarte na fakturach i innych dokumentach księgowych – przez okres wymagany przepisami podatkowymi
              (zasadniczo 5 lat licząc od końca roku kalendarzowego, w którym upłynął termin płatności podatku);
            </li>
            <li>
              dane przetwarzane na podstawie zgody – do momentu jej cofnięcia lub do realizacji celu, w którym dane były
              zbierane;
            </li>
            <li>
              dane przetwarzane na podstawie uzasadnionego interesu (w tym marketing bezpośredni i analityka) – do czasu
              zgłoszenia skutecznego sprzeciwu lub osiągnięcia celu przetwarzania;
            </li>
            <li>
              dane techniczne (logi, cookies) – zgodnie z okresami wskazanymi w polityce cookies oraz w regulaminach
              dostawców (zwykle do 24 miesięcy).
            </li>
          </ul>
        </section>

        <section id="odbiorcy" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            5. Odbiorcy danych
          </h2>
          <p className="mb-3 text-pretty">
            Dostęp do Twoich danych osobowych mogą mieć podmioty współpracujące z Administratorem, w zakresie niezbędnym
            do realizacji wskazanych wyżej celów. Należą do nich w szczególności:
          </p>
          <ul className="list-disc space-y-2 pl-6 marker:text-brand-500">
            <li>dostawcy usług płatniczych (operatorzy płatności elektronicznych);</li>
            <li>firmy kurierskie i operatorzy pocztowi realizujący dostawę Produktów;</li>
            <li>
              dostawcy infrastruktury IT i hostingu (m.in. Vercel Inc., Cloudflare, Inc.) oraz dostawcy systemu CMS i
              wyszukiwarki Produktów;
            </li>
            <li>
              dostawcy narzędzi do monitorowania błędów i wydajności aplikacji (np. Sentry) oraz narzędzi analitycznych
              (np. PostHog);
            </li>
            <li>biuro rachunkowe, doradcy prawni, audytorzy;</li>
            <li>operatorzy wiadomości e-mail i platformy do wysyłki newslettera;</li>
            <li>
              uprawnione organy państwowe lub osoby trzecie, gdy obowiązek przekazania danych wynika z przepisów prawa.
            </li>
          </ul>
          <p className="mt-4 text-pretty">
            Wszystkie podmioty przetwarzające dane na zlecenie Administratora robią to na podstawie zawartych umów
            powierzenia oraz zgodnie z RODO.
          </p>
        </section>

        <section id="przekazywanie" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            6. Przekazywanie danych poza Europejski Obszar Gospodarczy (EOG)
          </h2>
          <p className="text-pretty">
            W zakresie, w jakim korzystamy z dostawców usług IT, hostingu lub narzędzi analitycznych z siedzibą poza EOG
            (np. w Stanach Zjednoczonych), dane mogą być przekazywane do państw trzecich. W takim przypadku przekazanie
            danych odbywa się wyłącznie z zachowaniem odpowiednich zabezpieczeń, o których mowa w RODO – w szczególności na
            podstawie standardowych klauzul umownych zatwierdzonych przez Komisję Europejską lub decyzji Komisji
            stwierdzających odpowiedni stopień ochrony (m.in. Data Privacy Framework). Na żądanie udostępniamy kopię
            stosowanych zabezpieczeń.
          </p>
        </section>

        <section id="prawa" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            7. Prawa osób, których dane dotyczą
          </h2>
          <p className="mb-3 text-pretty">W związku z przetwarzaniem Twoich danych przysługują Ci następujące prawa:</p>
          <ul className="list-disc space-y-2 pl-6 marker:text-brand-500">
            <li>prawo dostępu do swoich danych oraz otrzymania ich kopii;</li>
            <li>prawo do sprostowania (poprawiania) danych;</li>
            <li>prawo do usunięcia danych („prawo do bycia zapomnianym”) – w przypadkach wskazanych w RODO;</li>
            <li>prawo do ograniczenia przetwarzania;</li>
            <li>prawo do przenoszenia danych – w zakresie i na zasadach określonych w art. 20 RODO;</li>
            <li>
              prawo do wniesienia sprzeciwu – wobec przetwarzania opartego na uzasadnionym interesie Administratora, w tym
              wobec marketingu bezpośredniego;
            </li>
            <li>
              prawo do cofnięcia zgody w dowolnym momencie (cofnięcie zgody nie wpływa na zgodność z prawem przetwarzania,
              którego dokonano na podstawie zgody przed jej cofnięciem);
            </li>
            <li>
              prawo do wniesienia skargi do organu nadzorczego — Prezesa Urzędu Ochrony Danych Osobowych, ul. Stawki 2,
              00-193 Warszawa,{" "}
              <a href="https://www.uodo.gov.pl/" target="_blank" rel="noopener noreferrer">
                uodo.gov.pl
              </a>
              .
            </li>
          </ul>
          <p className="mt-4 text-pretty">
            Aby skorzystać ze swoich praw, skontaktuj się z nami pisemnie lub na adres{" "}
            <a href="mailto:kontakt@lumineconcept.pl">kontakt@lumineconcept.pl</a>. Możemy poprosić o potwierdzenie
            tożsamości w sposób adekwatny do zgłoszonego żądania.
          </p>
        </section>

        <section id="cookies" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            8. Pliki cookies i podobne technologie
          </h2>
          <p className="mb-3 text-pretty">
            Sklep Internetowy wykorzystuje pliki cookies (ciasteczka) – niewielkie pliki tekstowe zapisywane w urządzeniu
            końcowym Klienta. Cookies pozwalają m.in. zapamiętać zawartość Koszyka, preferencje użytkownika oraz mierzyć
            ruch na stronie. Wyróżniamy następujące kategorie cookies:
          </p>
          <ul className="list-disc space-y-2 pl-6 marker:text-brand-500">
            <li>
              <span className="font-semibold">niezbędne</span> – zapewniają podstawowe funkcjonalności Sklepu (np. Koszyk,
              logowanie, bezpieczeństwo sesji). Nie wymagają zgody;
            </li>
            <li>
              <span className="font-semibold">funkcjonalne</span> – zapamiętują preferencje Klienta, takie jak ostatnio
              oglądane Produkty lub lista ulubionych;
            </li>
            <li>
              <span className="font-semibold">analityczne</span> – pozwalają mierzyć ruch i sposób korzystania ze Sklepu
              (np. PostHog, statystyki dostawców infrastruktury). Wymagają Twojej zgody;
            </li>
            <li>
              <span className="font-semibold">marketingowe</span> – służą prezentowaniu spersonalizowanych komunikatów
              marketingowych (jeżeli są wykorzystywane). Wymagają Twojej zgody.
            </li>
          </ul>
          <p className="mt-4 text-pretty">
            Zgodę na cookies inne niż niezbędne wyrażasz w banerze zgody widocznym podczas pierwszej wizyty w Sklepie
            Internetowym. Możesz w każdej chwili zmienić ustawienia lub wycofać zgodę, korzystając z ustawień przeglądarki
            lub kontaktując się z nami pod adresem{" "}
            <a href="mailto:kontakt@lumineconcept.pl">kontakt@lumineconcept.pl</a>.
          </p>
        </section>

        <section id="analityka" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            9. Analityka i narzędzia marketingowe
          </h2>
          <p className="mb-3 text-pretty">
            W celu poprawy działania Sklepu Internetowego oraz mierzenia jego skuteczności możemy korzystać m.in. z
            następujących narzędzi:
          </p>
          <ul className="list-disc space-y-2 pl-6 marker:text-brand-500">
            <li>
              <span className="font-semibold">PostHog</span> – analityka produktowa i statystyki użytkowania Sklepu;
            </li>
            <li>
              <span className="font-semibold">Sentry</span> – monitorowanie błędów i wydajności aplikacji;
            </li>
            <li>
              <span className="font-semibold">Vercel Analytics / Web Vitals</span> – pomiar parametrów wydajnościowych
              stron;
            </li>
            <li>
              <span className="font-semibold">Meta Pixel, Google Ads, Google Analytics</span> – wyłącznie w przypadku,
              gdy zostały włączone i tylko po wyrażeniu Twojej zgody w banerze cookies.
            </li>
          </ul>
          <p className="mt-4 text-pretty">
            Dane przetwarzane w ramach narzędzi analitycznych zwykle nie pozwalają na bezpośrednią identyfikację Klienta i
            mają charakter zagregowanych statystyk.
          </p>
        </section>

        <section id="bezpieczenstwo" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            10. Bezpieczeństwo danych
          </h2>
          <p className="text-pretty">
            Stosujemy odpowiednie środki techniczne i organizacyjne, aby zapewnić poufność, integralność i dostępność
            przetwarzanych danych osobowych. Obejmuje to w szczególności szyfrowane połączenie (HTTPS/TLS), kontrolę
            dostępu, regularne aktualizacje oprogramowania, kopie zapasowe oraz umowy powierzenia z dostawcami usług. Mimo
            tego, korzystanie z internetu zawsze wiąże się z pewnym ryzykiem – prosimy o nieudostępnianie osobom trzecim
            danych logowania ani treści korespondencji.
          </p>
        </section>

        <section id="dzieci" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            11. Dane dzieci
          </h2>
          <p className="text-pretty">
            Sklep Internetowy nie jest skierowany do osób poniżej 16. roku życia. Nie zbieramy świadomie danych osobowych
            takich osób bez zgody opiekuna prawnego. Jeżeli dowiesz się, że Twoje dziecko przekazało nam dane osobowe bez
            Twojej wiedzy, skontaktuj się z nami – usuniemy takie dane niezwłocznie.
          </p>
        </section>

        <section id="zmiany" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide text-brand-800">
            12. Zmiany polityki prywatności
          </h2>
          <p className="text-pretty">
            Polityka prywatności może być aktualizowana w przypadku zmian przepisów prawa, wprowadzenia nowych
            funkcjonalności w Sklepie Internetowym lub korzystania z nowych narzędzi. Aktualna wersja polityki jest zawsze
            dostępna pod adresem{" "}
            <a href="https://www.lumineconcept.pl/polityka-prywatnosci">www.lumineconcept.pl/polityka-prywatnosci</a>. O
            istotnych zmianach poinformujemy Klientów drogą elektroniczną lub komunikatem widocznym w Sklepie.
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
