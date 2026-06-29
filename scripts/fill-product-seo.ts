/**
 * Uzupełnia dane SEO produktów w Medusie:
 *   - metadata.seo_meta_title
 *   - metadata.seo_meta_description
 *   - metadata.product_faq (FAQ schema.org)
 *
 * Użycie:
 *   pnpm fill-product-seo
 *
 * Opcje (env lub plik scripts/fill-product-seo.env):
 *   MEDUSA_BACKEND_URL   — domyślnie http://localhost:9000
 *   MEDUSA_ADMIN_EMAIL
 *   MEDUSA_ADMIN_PASSWORD
 *   DRY_RUN=1            — tylko podgląd, bez zapisu
 *   FORCE=1              — nadpisuj istniejące SEO
 *   HANDLE=<slug>        — aktualizuj tylko jeden produkt
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadOptionalEnvFile(): void {
  const envPath = resolve(process.cwd(), "scripts/fill-product-seo.env");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadOptionalEnvFile();

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const ADMIN_EMAIL = (process.env.MEDUSA_ADMIN_EMAIL ?? "").trim();
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD ?? "";
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const FORCE = process.env.FORCE === "1" || process.env.FORCE === "true";
const HANDLE_FILTER = process.env.HANDLE?.trim() ?? "";

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  order: number;
};

type ProductSeoData = {
  metaTitle: string;
  metaDescription: string;
  faq: Omit<FaqItem, "id">[];
  noIndex?: boolean;
};

type SeoDatabase = Record<string, ProductSeoData>;

// ---------------------------------------------------------------------------
// Baza danych SEO — 48 produktów
// Zasady:
//   metaTitle   ≤ 60 znaków, zawiera główne słowo kluczowe + markę
//   metaDescription ≤ 160 znaków, zawiera korzyść + CTA
//   faq         3–4 pytania per produkt, realne obiekcje klientów salonu beauty
// ---------------------------------------------------------------------------

const SEO_DATABASE: SeoDatabase = {
  "babeczka-qr": {
    metaTitle: "Tabliczka QR Babeczka z plexi | Lumine Concept",
    metaDescription:
      "Śliczna tabliczka QR w kształcie babeczki z plexi dla cukierni i kawiarni. Personalizacja, rozmiar 20×25 cm. Szybka realizacja, wysyłka w 5 dni.",
    faq: [
      {
        question: "Z jakiego materiału wykonana jest tabliczka QR Babeczka?",
        answer:
          "Tabliczka wykonana jest z wysokiej jakości przezroczystej plexi (akrylu). Materiał jest trwały, odporny na zarysowania i wilgoć — idealny do salonu lub kawiarni.",
        order: 0,
      },
      {
        question: "Czy mogę personalizować kod QR?",
        answer:
          "Tak, kod QR jest w pełni personalizowany — możesz wpisać własny link do Google Maps, Instagram, Booksy lub dowolnej innej strony podczas konfiguracji zamówienia.",
        order: 1,
      },
      {
        question: "Ile trwa realizacja zamówienia?",
        answer:
          "Standardowy czas realizacji wynosi 3–5 dni roboczych. Po tym czasie wysyłamy zamówienie kurierem DPD lub do paczkomatu InPost.",
        order: 2,
      },
      {
        question: "Jak mocować tabliczkę na ścianie?",
        answer:
          "Tabliczka wyposażona jest w otwory montażowe lub samoprzylepny uchwyt. W zestawie znajdują się elementy montażowe. Możesz też zawiesić ją na haczyku lub postawić na blacie.",
        order: 3,
      },
    ],
  },

  "cennik-klasyczny": {
    metaTitle: "Cennik z plexi Klasyczny dla salonu beauty | Lumine Concept",
    metaDescription:
      "Elegancki cennik z plexi 20×30 cm do 20 pozycji — personalizowany z Twoim logo. Profesjonalny wygląd salonu beauty. Zamów online, wysyłka 5 dni.",
    faq: [
      {
        question: "Ile pozycji mieści cennik klasyczny?",
        answer:
          "Cennik klasyczny pomieści do 20 pozycji usług. Jeśli potrzebujesz więcej miejsca, skontaktuj się z nami — możemy dostosować projekt do Twoich potrzeb.",
        order: 0,
      },
      {
        question: "Czy cennik jest personalizowany moim logo?",
        answer:
          "Tak, podczas konfiguracji wpisujesz treść cennika (usługi i ceny) oraz możesz dodać logo salonu. Gotowy projekt jest do akceptacji przed drukiem.",
        order: 1,
      },
      {
        question: "Jaka jest grubość plexi w cenniku?",
        answer:
          "Używamy plexi o grubości 3 mm, co zapewnia sztywność i elegancki wygląd tabliczki. Materiał jest odporny na ścieranie i odbarwienie.",
        order: 2,
      },
      {
        question: "Czy mogę zmieniać ceny na cenniku samodzielnie?",
        answer:
          "Nadruk jest trwały i nie podlega samodzielnej zmianie — przy aktualizacji cennika zamaw nową tabliczkę. Wiele salonów zamawia jednorazowo kilka wersji.",
        order: 3,
      },
    ],
  },

  "cennik-portal": {
    metaTitle: "Cennik Portal z plexi dla salonu | Lumine Concept",
    metaDescription:
      "Cennik Portal z plexi — nowoczesny, pełny design dla salonu kosmetycznego. Personalizacja online, trwałość plexi, wysyłka w 5 dni roboczych.",
    faq: [
      {
        question: "Czym wyróżnia się cennik Portal?",
        answer:
          "Cennik Portal ma unikalny kształt nawiązujący do portalu — efektowny i nowoczesny. Wyróżnia się na tle standardowych tabliczek, przyciągając wzrok klientów salonu.",
        order: 0,
      },
      {
        question: "Czy mogę wybrać kolor plexi?",
        answer:
          "Tak, podczas konfiguracji wybierasz kolor plexi spośród dostępnych opcji (przezroczysty, mleczny, czarny, złoty lustro i inne). Paleta kolorów dostępna jest w konfiguratorze.",
        order: 1,
      },
      {
        question: "Jak zamawiać cennik Portal?",
        answer:
          "Kliknij 'Skonfiguruj produkt', wpisz treść cennika i wybierz kolor plexi. Po złożeniu zamówienia przesyłamy wizualizację do akceptacji przed realizacją.",
        order: 2,
      },
    ],
  },

  "cennik-z-elementami-3d": {
    metaTitle: "Cennik 3D z plexi dla salonu beauty | Lumine Concept",
    metaDescription:
      "Cennik z elementami 3D z plexi — efektowny, nowoczesny design dla salonu beauty. Personalizacja, trwała plexi, szybka wysyłka 5 dni. Zamów teraz.",
    faq: [
      {
        question: "Co to są elementy 3D w cenniku?",
        answer:
          "Elementy 3D to wypukłe, warstwowe elementy z plexi przyklejone na tabliczkę — tworzą efekt głębi i przestrzenności. Wyglądają luksusowo i nowoczesnie.",
        order: 0,
      },
      {
        question: "Czy elementy 3D są trwałe?",
        answer:
          "Elementy 3D przyklejane są trwałym klejem akrylowym i wytrzymują codzienny użytek w salonie. Nie odpadają przy normalnym użytkowaniu i czyszczeniu.",
        order: 1,
      },
      {
        question: "Jaki rozmiar ma cennik z elementami 3D?",
        answer:
          "Standardowy rozmiar to 20×30 cm, jednak możemy dostosować wymiary do Twoich potrzeb. Skontaktuj się z nami przed złożeniem zamówienia.",
        order: 2,
      },
    ],
  },

  "cennik-ze-scietym-bokiem": {
    metaTitle: "Cennik ze ściętym bokiem z plexi | Lumine Concept",
    metaDescription:
      "Cennik ze ściętym bokiem z plexi — niepowtarzalny kształt dla salonu beauty. Personalizacja z logo, trwałość, wysyłka 5 dni. Wyróżnij się na rynku.",
    faq: [
      {
        question: "Na czym polega specyfika kształtu ze ściętym bokiem?",
        answer:
          "Tabliczka ma asymetryczny kształt z ukosem po jednej stronie — to niepowtarzalny design, który wyróżnia Twój salon spośród konkurencji.",
        order: 0,
      },
      {
        question: "Czy mogę mieć własną treść na cenniku?",
        answer:
          "Oczywiście — cennik jest w pełni personalizowany. Wpisujesz swoje usługi i ceny, my przygotowujemy projekt graficzny.",
        order: 1,
      },
      {
        question: "Czy tabliczka jest odporna na warunki salonu?",
        answer:
          "Tak, plexi jest odporna na wilgoć i preparaty kosmetyczne. Tabliczkę łatwo wyczyścić wilgotną ściereczką bez ryzyka uszkodzenia nadruku.",
        order: 2,
      },
    ],
  },

  "certyfikat-lustrzany": {
    metaTitle: "Certyfikat lustrzany z plexi dla salonu | Lumine Concept",
    metaDescription:
      "Luksusowy certyfikat lustrzany z plexi dla salonu beauty — efekt lustra, personalizacja z logo. Idealny na ścianę gabinetu. Wysyłka 5 dni.",
    faq: [
      {
        question: "Do czego służy certyfikat lustrzany?",
        answer:
          "Certyfikat lustrzany to elegancka forma potwierdzenia ukończenia kursu lub szkolenia beauty. Wiesz się na ścianie gabinetu, budując zaufanie klientów.",
        order: 0,
      },
      {
        question: "Czy mogę umieścić własne zdjęcie lub logo na certyfikacie lustrzanym?",
        answer:
          "Tak, certyfikat jest personalizowany — wpisujesz imię i nazwisko, datę, nazwę kursu i możesz dodać logo szkoły lub salonu.",
        order: 1,
      },
      {
        question: "Jak montować certyfikat lustrzany na ścianie?",
        answer:
          "Certyfikat wyposażony jest w otwory montażowe. Do zestawu dołączamy śruby dystansowe, które dodają efekt unoszenia się tabliczki nad ścianą.",
        order: 2,
      },
      {
        question: "Jak dbać o certyfikat lustrzany?",
        answer:
          "Czyść delikatną, suchą lub lekko wilgotną ściereczką z mikrofibry. Unikaj środków czyszczących z acetonem lub alkoholem — mogą uszkodzić lustrzaną powierzchnię.",
        order: 3,
      },
    ],
  },

  "certyfikat-ze-zdjeciem": {
    metaTitle: "Certyfikat ze zdjęciem z plexi | Lumine Concept",
    metaDescription:
      "Personalizowany certyfikat ze zdjęciem z plexi — pamiątka kursów i szkoleń beauty. Trwały, elegancki, wisi na ścianie salonu. Wysyłka 5 dni.",
    faq: [
      {
        question: "Jak wysłać zdjęcie do certyfikatu?",
        answer:
          "Po złożeniu zamówienia możesz przesłać zdjęcie przez formularz lub na adres e-mail. Minimalna rozdzielczość to 300 dpi; akceptujemy JPG, PNG i PDF.",
        order: 0,
      },
      {
        question: "Czy certyfikat ze zdjęciem jest trwały?",
        answer:
          "Zdjęcie drukowane jest techniką UV na plexi — odporną na blaknięcie, wilgoć i zarysowania. Certyfikat zachowa piękny wygląd przez lata.",
        order: 1,
      },
      {
        question: "Jaki format ma certyfikat ze zdjęciem?",
        answer:
          "Standardowy format to A4 (210×297 mm), ale możemy dostosować do innego rozmiaru na życzenie.",
        order: 2,
      },
    ],
  },

  "drink-menu-3d": {
    metaTitle: "Menu drinków 3D z plexi dla baru | Lumine Concept",
    metaDescription:
      "Efektowne menu drinków 3D z plexi dla baru i restauracji. Nowoczesny design, personalizacja z Twoimi drinkami, wysyłka 5 dni. Zamów online.",
    faq: [
      {
        question: "Ile pozycji drinków pomieści menu 3D?",
        answer:
          "Standardowe menu mieści 8–12 pozycji drinków. Możemy dostosować rozmiar lub liczbę stron do potrzeb Twojego baru.",
        order: 0,
      },
      {
        question: "Czy mogę dodać zdjęcia drinków do menu?",
        answer:
          "Tak, projekt graficzny menu może zawierać zdjęcia lub grafiki drinków. Przesyłasz materiały, a my tworzymy gotowe menu.",
        order: 1,
      },
      {
        question: "Czy menu 3D jest odporne na wilgoć w barze?",
        answer:
          "Plexi jest wodoodporna i odporna na rozlania. Łatwo ją wytrzeć ściereczką. Nadruk UV jest trwały i nie blednie przy normalnym użytkowaniu.",
        order: 2,
      },
    ],
  },

  "ekspozytor-na-voucher-podarunkowy": {
    metaTitle: "Ekspozytor na voucher podarunkowy z plexi | Lumine Concept",
    metaDescription:
      "Elegancki ekspozytor na vouchery podarunkowe z plexi dla salonu beauty. Profesjonalna prezentacja, personalizacja z logo. Wysyłka 5 dni roboczych.",
    faq: [
      {
        question: "Do jakiego formatu voucherów pasuje ekspozytor?",
        answer:
          "Standardowy ekspozytor przeznaczony jest do voucherów formatu A5 lub wizytówkowego. Możemy dostosować rozmiar do Twoich voucherów.",
        order: 0,
      },
      {
        question: "Czy ekspozytor można personalizować?",
        answer:
          "Tak, ekspozytor może zawierać logo salonu i tekst reklamowy. Personalizacja jest dostępna podczas konfiguracji zamówienia.",
        order: 1,
      },
      {
        question: "Ile voucherów mieści ekspozytor?",
        answer:
          "Zależnie od modelu ekspozytor pomieści od 5 do 20 voucherów. Dokładna pojemność podana jest w opisie produktu.",
        order: 2,
      },
    ],
  },

  "heksagon-z-kodami-qr": {
    metaTitle: "Tabliczka QR heksagon z plexi | Lumine Concept",
    metaDescription:
      "Tabliczka QR w kształcie heksagonu 23×25 cm z plexi dla salonu beauty. Kody do social media i recenzji Google. Personalizacja, wysyłka 5 dni.",
    faq: [
      {
        question: "Ile kodów QR mieści tabliczka heksagon?",
        answer:
          "Tabliczka heksagonalna może pomieścić od 1 do 4 kodów QR. Każdy kod możesz przypisać do innej platformy: Google, Instagram, Booksy, Facebook.",
        order: 0,
      },
      {
        question: "Do czego służą kody QR na tabliczce?",
        answer:
          "Kody QR kierują klientów bezpośrednio do wybranych platform — np. do wystawienia recenzji Google, obserwowania na Instagramie lub rezerwacji przez Booksy.",
        order: 1,
      },
      {
        question: "Czy heksagon pasuje do nowoczesnych salonów?",
        answer:
          "Kształt heksagonu to jeden z najpopularniejszych designów 2024/2025 w aranżacji wnętrz. Wygląda elegancko i nowocześnie zarówno w salonach minimalistycznych, jak i glamour.",
        order: 2,
      },
    ],
  },

  "instrukcja-aparatu-instax": {
    metaTitle: "Instrukcja aparatu Instax z plexi | Lumine Concept",
    metaDescription:
      "Estetyczna instrukcja obsługi aparatu Instax z plexi dla fotobootha i eventów. Personalizowana, trwała. Wysyłka w 5 dni roboczych.",
    faq: [
      {
        question: "Do jakiego modelu aparatu Instax pasuje instrukcja?",
        answer:
          "Instrukcja projektowana jest pod wybrany model Instax (Mini, Wide, Square). Podczas konfiguracji podajesz model, a my dostosowujemy treść.",
        order: 0,
      },
      {
        question: "Czy instrukcja jest zrozumiała dla gości weselnych?",
        answer:
          "Tak — instrukcja napisana jest prostym językiem z ikonami i numerowanymi krokami. Nawet osoby nieznające aparatu Instax obsłużą go samodzielnie.",
        order: 1,
      },
      {
        question: "Czy mogę mieć własne logo na instrukcji?",
        answer:
          "Oczywiście — możesz dodać logo swojego studia lub event agencji. Tworzysz spójny branding fotobootha.",
        order: 2,
      },
    ],
  },

  "instrukcja-mycia-rak": {
    metaTitle: "Instrukcja mycia rąk z plexi 20×30 cm | Lumine Concept",
    metaDescription:
      "Estetyczna instrukcja mycia rąk 20×30 cm z plexi dla salonu beauty i gabinetu. Wymóg sanitarny w eleganckiej formie. Wysyłka 5 dni.",
    faq: [
      {
        question: "Czy instrukcja mycia rąk spełnia wymogi sanepidu?",
        answer:
          "Tak — nasza instrukcja zawiera wszystkie 6 kroków mycia rąk zgodnie z wytycznymi Głównego Inspektora Sanitarnego i WHO.",
        order: 0,
      },
      {
        question: "Jak montować instrukcję mycia rąk w łazience?",
        answer:
          "Tabliczkę możesz zawiesić na ścianie (otwory montażowe w zestawie) lub przykleić za pomocą samoprzylepnych pasków 3M. Dostępna też opcja z kieszonką na stolik.",
        order: 1,
      },
      {
        question: "Czy mogę dodać logo salonu do instrukcji?",
        answer:
          "Tak, standardowa instrukcja może zawierać logo lub nazwę Twojego salonu. Personalizacja dostępna w konfiguratorze.",
        order: 2,
      },
    ],
  },

  "instrukcja-mycia-rak-fala": {
    metaTitle: "Instrukcja mycia rąk Fala z plexi | Lumine Concept",
    metaDescription:
      "Instrukcja mycia rąk Fala z plexi 24×36 cm — elegancki kształt fali dla salonu. Spełnia wymogi sanitarne, wyróżnia się designem. Wysyłka 5 dni.",
    faq: [
      {
        question: "Czym różni się wariant Fala od standardowego?",
        answer:
          "Wariant Fala ma faliste, organiczne kształty krawędzi, co nadaje tabliczce niepowtarzalny, miękki charakter — idealny do salonów w stylu boho lub minimalistycznym.",
        order: 0,
      },
      {
        question: "Jaki rozmiar ma instrukcja Fala?",
        answer:
          "Rozmiar wynosi 24×36 cm — nieco większy niż standardowy, co zwiększa widoczność instrukcji na ścianie.",
        order: 1,
      },
      {
        question: "Czy instrukcja Fala jest wodoodporna?",
        answer:
          "Tak — plexi jest w pełni wodoodporna. Tabliczkę wyczyścisz wilgotną ściereczką. Nadaje się do stosowania przy umywalkach i w łazienkach.",
        order: 2,
      },
    ],
  },

  "instrukcja-mycia-rak-owalna": {
    metaTitle: "Owalna instrukcja mycia rąk z plexi | Lumine Concept",
    metaDescription:
      "Owalna instrukcja mycia rąk 24×36 cm z plexi. Spełnia normy sanitarne w nowoczesnej, eleganckiej formie. Personalizacja, wysyłka 5 dni.",
    faq: [
      {
        question: "Dlaczego warto wybrać owalny kształt tabliczki?",
        answer:
          "Owal to jeden z najpopularniejszych kształtów w nowoczesnych salonach beauty — miękki, organiczny, kojarzy się z luksusem i troską o detale.",
        order: 0,
      },
      {
        question: "Czy mogę personalizować treść instrukcji owalnej?",
        answer:
          "Standardowa wersja zawiera instrukcję 6-krokową zgodną z wymogami sanepidu. Na życzenie można dodać logo lub zmienić kolorystykę.",
        order: 1,
      },
      {
        question: "Jak dbać o owalną tabliczkę?",
        answer:
          "Czyść miękką, wilgotną ściereczką. Unikaj szorstkich gąbek i środków na bazie acetonu.",
        order: 2,
      },
    ],
  },

  "iskierki-milosci-lustrzana-tabliczka": {
    metaTitle: "Iskierki miłości lustrzana tabliczka z plexi | Lumine Concept",
    metaDescription:
      "Lustrzana tabliczka 'Iskierki miłości' z plexi — efektowna dekoracja weselna i ślubna. Personalizacja tekstu, wysyłka 5 dni. Piękna pamiątka.",
    faq: [
      {
        question: "Czy tabliczkę można personalizować własnym tekstem?",
        answer:
          "Tak — możesz zmienić napis, datę lub dodać imiona. Podczas konfiguracji wpisujesz żądaną treść.",
        order: 0,
      },
      {
        question: "Do czego służy lustrzana tabliczka?",
        answer:
          "Lustrzana tabliczka to dekoracja dla fotobootha, sali weselnej lub dekoracja ściennej. Efekt lustra sprawia, że wygląda luksusowo na zdjęciach.",
        order: 1,
      },
      {
        question: "Jak mocować tabliczkę dekoracyjną?",
        answer:
          "Tabliczkę można powiesić na ścianie (otwory montażowe) lub postawić na stole przy użyciu podstawki (opcja dostępna w konfiguratorze).",
        order: 2,
      },
    ],
  },

  "koszyk-ratunkowy": {
    metaTitle: "Tabliczka koszyk ratunkowy z plexi — BHP | Lumine Concept",
    metaDescription:
      "Estetyczna tabliczka 'Koszyk ratunkowy' z plexi spełniająca wymogi BHP. Elegancka forma dla salonu i gabinetu. Wysyłka 5 dni.",
    faq: [
      {
        question: "Czy tabliczka spełnia przepisy BHP?",
        answer:
          "Tak — tabliczka zawiera standardowy piktogram i napis 'Koszyk ratunkowy' zgodnie z normą PN-EN ISO 7010. Spełnia wymagania BHP dla gabinetów i salonów.",
        order: 0,
      },
      {
        question: "Jaki rozmiar ma tabliczka koszyka ratunkowego?",
        answer:
          "Standardowy rozmiar to 15×15 cm, co jest zgodne z wymaganiami dotyczącymi oznakowania bezpieczeństwa. Możliwe inne rozmiary na zamówienie.",
        order: 1,
      },
      {
        question: "Czy tabliczkę BHP można personalizować?",
        answer:
          "Piktogram BHP musi być zgodny z normą, ale możemy dodać nazwę firmy lub salonu w dolnej części tabliczki.",
        order: 2,
      },
    ],
  },

  "lustrzana-instrukcja-aparatu-instax": {
    metaTitle: "Lustrzana instrukcja aparatu Instax z plexi | Lumine Concept",
    metaDescription:
      "Lustrzana instrukcja aparatu Instax z plexi — efektowna tabliczka dla fotobootha. Elegancja i praktyczność. Personalizacja, wysyłka 5 dni.",
    faq: [
      {
        question: "Czym różni się lustrzana instrukcja od standardowej?",
        answer:
          "Lustrzana wersja wykonana jest z plexi w efekcie lustra — wygląda luksusowo i elegancko. Tekst i ikony są wygrawerowane lub nadrukowane UV, co daje świetny kontrast.",
        order: 0,
      },
      {
        question: "Czy lustrzana instrukcja pasuje do fotobootha?",
        answer:
          "Tak — to jeden z najchętniej wybieranych akcesorium do fotobootha. Efekt lustra na zdjęciach wygląda spektakularnie.",
        order: 1,
      },
      {
        question: "Czy można wygrawerować własny napis?",
        answer:
          "Tak — możesz wpisać własny tekst, np. hashtag eventu, datę ślubu lub nazwę marki. Grawerowanie jest precyzyjne i trwałe.",
        order: 2,
      },
    ],
  },

  "lustrzany-voucher-podarunkowy": {
    metaTitle: "Lustrzany voucher podarunkowy z plexi | Lumine Concept",
    metaDescription:
      "Luksusowy lustrzany voucher podarunkowy z plexi dla salonu beauty. Efektowna forma na prezenty i karnety. Personalizacja z logo. Wysyłka 5 dni.",
    faq: [
      {
        question: "Co drukowane jest na lustrzanym voucherze?",
        answer:
          "Na voucherze drukowane są: wartość vouchera, nazwa salonu, logo, termin ważności i ewentualny dedykowany napis. Wszystko personalizujesz w konfiguratorze.",
        order: 0,
      },
      {
        question: "Czy lustrzany voucher robi wrażenie jako prezent?",
        answer:
          "Zdecydowanie tak — efekt lustra sprawia, że voucher wygląda premium i luksusowo. Świetnie nadaje się na Walentynki, urodziny i Dzień Matki.",
        order: 1,
      },
      {
        question: "W jakich rozmiarach dostępny jest lustrzany voucher?",
        answer:
          "Standardowy rozmiar to format wizytówki (85×55 mm) lub A6. Na życzenie realizujemy inne formaty.",
        order: 2,
      },
    ],
  },

  "oktagon-z-kodem-qr-wi-fi": {
    metaTitle: "Tabliczka QR Wi-Fi oktagon z plexi | Lumine Concept",
    metaDescription:
      "Ośmiokątna tabliczka QR z kodem Wi-Fi z plexi dla salonu i hotelu. Elegancki dostęp gości do sieci, personalizacja z logo. Wysyłka 5 dni.",
    faq: [
      {
        question: "Jak działa kod QR Wi-Fi?",
        answer:
          "Klient skanuje kod QR smartfonem i automatycznie łączy się z siecią Wi-Fi bez wpisywania hasła. Kod generujemy na podstawie nazwy sieci i hasła, które podajesz przy zamówieniu.",
        order: 0,
      },
      {
        question: "Czy muszę zmieniać tabliczkę przy zmianie hasła Wi-Fi?",
        answer:
          "Tak, przy zmianie hasła sieci kod QR staje się nieaktywny. Warto ustawić stabilne hasło do sieci gościnnej lub zamówić nową tabliczkę (co jest szybkie i ekonomiczne).",
        order: 1,
      },
      {
        question: "Dlaczego kształt oktagonu?",
        answer:
          "Oktagon (ośmiobok) to nowoczesny, symetryczny kształt, który wyróżnia tabliczkę spośród standardowych prostokątów. Idealny do minimalistycznych i premium wnętrz.",
        order: 2,
      },
    ],
  },

  "pamiatka-pierwszej-komunii-swietej": {
    metaTitle: "Pamiątka Komunii Świętej z plexi — elipsa | Lumine Concept",
    metaDescription:
      "Elegancka pamiątka Pierwszej Komunii Świętej z plexi — elipsa 15×22,5 cm. Wyjątkowy, personalizowany upominek. Wysyłka 5 dni roboczych.",
    faq: [
      {
        question: "Co można personalizować na pamiątce komunijnej?",
        answer:
          "Na pamiątce możesz umieścić imię dziecka, datę Komunii, cytat religijny lub zdjęcie. Wszystkie dane wpisujesz podczas konfiguracji zamówienia.",
        order: 0,
      },
      {
        question: "Czy pamiątka z plexi jest trwała?",
        answer:
          "Tak — nadruk UV jest odporny na blaknięcie, wilgoć i zarysowania. Pamiątka z plexi przetrwa wiele lat jako piękna ozdoba pokoju dziecka.",
        order: 1,
      },
      {
        question: "Kiedy zamówić pamiątkę komunijną?",
        answer:
          "Zalecamy zamawiać co najmniej 2 tygodnie przed uroczystością, aby mieć czas na ewentualne korekty projektu. Czas realizacji to 5–7 dni roboczych.",
        order: 2,
      },
    ],
  },

  "piktogram-gasnica": {
    metaTitle: "Piktogram gaśnica z plexi 15×15 cm | Lumine Concept",
    metaDescription:
      "Tabliczka BHP piktogram gaśnica 15×15 cm z plexi. Spełnia normy bezpieczeństwa, elegancki wygląd dla salonu i biura. Szybka realizacja.",
    faq: [
      {
        question: "Czy piktogram gaśnicy spełnia normy bezpieczeństwa?",
        answer:
          "Tak — piktogram gaśnicy wykonany jest zgodnie z normą PN-EN ISO 7010:2012 (F001). Spełnia wymagania inspektora pracy i straży pożarnej.",
        order: 0,
      },
      {
        question: "Jak montować tabliczkę piktogram?",
        answer:
          "Tabliczkę możesz powiesić na ścianie przez otwory montażowe lub przykleić samoprzylepnym uchwytem. Montaż zajmuje kilka minut.",
        order: 1,
      },
      {
        question: "Dlaczego warto wybrać piktogram z plexi zamiast plastikowego?",
        answer:
          "Plexi wygląda znacznie bardziej luksusowo niż standard plastik i pasuje do nowoczesnych salonów i biur. Jest też trwalsza i odporniejsza na uszkodzenia.",
        order: 2,
      },
    ],
  },

  "podziekowanie-dla-rodzicow": {
    metaTitle: "Podziękowanie dla Rodziców z plexi — tabliczka ślubna | Lumine Concept",
    metaDescription:
      "Piękna tabliczka z podziękowaniem dla Rodziców z plexi w kształcie koła. Personalizowana, wyjątkowy prezent ślubny. Wysyłka 5 dni.",
    faq: [
      {
        question: "Co można wpisać na tabliczce z podziękowaniem?",
        answer:
          "Wpisujesz własny tekst — imiona rodziców, datę ślubu, wiersz lub cytaty. Tabliczka jest w pełni personalizowana pod Twoje życzenia.",
        order: 0,
      },
      {
        question: "Czy tabliczka z podziękowaniem pasuje jako prezent ślubny?",
        answer:
          "To jeden z najpiękniejszych i najbardziej wzruszających prezentów dla rodziców młodej pary. Wysoka jakość wykonania sprawia, że zostanie z nimi na lata.",
        order: 1,
      },
      {
        question: "Kiedy zamówić tabliczkę z podziękowaniem?",
        answer:
          "Zalecamy zamawiać minimum 2 tygodnie przed ślubem, by mieć czas na akceptację projektu. Standardowy czas realizacji wynosi 5–7 dni roboczych.",
        order: 2,
      },
    ],
  },

  "pudelko-na-koperty-mleczne": {
    metaTitle: "Pudełko na koperty ślubne z plexi mlecznej | Lumine Concept",
    metaDescription:
      "Eleganckie pudełko na koperty z mlecznej plexi 28×28×28 cm — idealne na wesele. Personalizowane, wyjątkowy element sali weselnej. Wysyłka 5 dni.",
    faq: [
      {
        question: "Ile kopert mieści pudełko mleczne?",
        answer:
          "Pudełko 28×28×28 cm mieści od 50 do 100 kopert standardowego formatu (C5/C6), w zależności od grubości. Wystarczy nawet na duże wesela.",
        order: 0,
      },
      {
        question: "Jak personalizować pudełko na koperty?",
        answer:
          "W konfiguratorze wpisujesz imiona pary młodej i datę ślubu. Możliwe jest też dodanie monogramu lub własnego tekstu.",
        order: 1,
      },
      {
        question: "Czy pudełko jest łatwe w transporcie?",
        answer:
          "Pudełko jest rozkładane — przysyłamy je w stanie płaskim, a montaż trwa kilka minut bez użycia narzędzi. Wymiary złożonego pudełka: 28×28×28 cm.",
        order: 2,
      },
    ],
  },

  "tabliczka-3d-z-kodami-qr": {
    metaTitle: "Tabliczka 3D z kodami QR z plexi | Lumine Concept",
    metaDescription:
      "Efektowna tabliczka 3D z kodami QR z plexi dla salonu beauty. Nowoczesny design, kody do recenzji Google i social media. Wysyłka 5 dni.",
    faq: [
      {
        question: "Czym różni się tabliczka 3D od płaskiej?",
        answer:
          "Tabliczka 3D ma warstwową budowę — elementy graficzne (logo, ikony platform) unoszą się nad tłem, tworząc efekt głębi i przestrzenności.",
        order: 0,
      },
      {
        question: "Ile kodów QR mieści tabliczka 3D?",
        answer:
          "Standardowa tabliczka mieści 2–4 kody QR. Każdy kod można przypisać do innej platformy: Google Maps, Instagram, Booksy, Facebook.",
        order: 1,
      },
      {
        question: "Jak montować tabliczkę 3D?",
        answer:
          "Do zestawu dołączamy dystanse i śruby montażowe. Tabliczkę montujesz na ścianie lub stawiasz na blacie przy użyciu opcjonalnej podstawki.",
        order: 2,
      },
    ],
  },

  "tabliczka-3d-z-kodami-qr-2": {
    metaTitle: "Tabliczka 3D z kodami QR wariant 2 z plexi | Lumine Concept",
    metaDescription:
      "Drugi wzór tabliczki 3D z kodami QR z plexi — nowoczesna dekoracja salonu beauty. Kieruj klientów do Google i social media. Wysyłka 5 dni.",
    faq: [
      {
        question: "Czym różni się wariant 2 od wariantu 1?",
        answer:
          "Wariant 2 ma inny układ graficzny i kształt elementów 3D — inne proporcje i rozmieszczenie ikon platform. Oba warianty służą temu samemu celowi.",
        order: 0,
      },
      {
        question: "Czy mogę wybrać platformy social media na tabliczce?",
        answer:
          "Tak — możesz wybrać ikonki Google, Instagram, Facebook, TikTok, Booksy i inne. Podajesz linki do swoich profili podczas konfiguracji.",
        order: 1,
      },
    ],
  },

  "tabliczka-3d-z-kodami-qr-3": {
    metaTitle: "Tabliczka 3D z kodami QR wariant 3 z plexi | Lumine Concept",
    metaDescription:
      "Trzeci wzór tabliczki 3D z kodami QR z plexi — elegancka dekoracja dla salonu kosmetycznego. Personalizacja platform, wysyłka 5 dni.",
    faq: [
      {
        question: "Czym wyróżnia się wariant 3 tabliczki 3D?",
        answer:
          "Wariant 3 ma najbardziej minimalistyczny układ — skupia uwagę na kodach QR, bez zbędnych ozdobników. Idealny do nowoczesnych salonów premium.",
        order: 0,
      },
      {
        question: "Czy kody QR można aktualizować po zakupie?",
        answer:
          "Kody QR są na stałe wydrukowane na tabliczce. Jeśli zmieniasz np. link do Instagrama, warto użyć skracacza linków (np. Bitly), który możesz edytować bez drukowania nowej tabliczki.",
        order: 1,
      },
    ],
  },

  "tabliczka-higiena": {
    metaTitle: "Tabliczka HIGIENA z plexi dla salonu | Lumine Concept",
    metaDescription:
      "Estetyczna tabliczka z informacją o higienie toalety 20×30 cm z plexi. Spełnia normy sanitarne w eleganckim designie salonu beauty. Wysyłka 5 dni.",
    faq: [
      {
        question: "Co zawiera tabliczka HIGIENA?",
        answer:
          "Tabliczka zawiera informacje o higienie użytkowania toalety — obowiązkowe oznaczenie w gabinetach kosmetycznych i salonach zgodnie z przepisami sanitarnymi.",
        order: 0,
      },
      {
        question: "Czy tabliczka spełnia wymogi sanepidu?",
        answer:
          "Tak — treść tabliczki jest zgodna z wymogami Państwowej Inspekcji Sanitarnej dla gabinetów kosmetycznych i salonów beauty.",
        order: 1,
      },
      {
        question: "Czy mogę personalizować treść tabliczki HIGIENA?",
        answer:
          "Możesz dostosować kolorystykę i dodać logo salonu. Treść merytoryczna jest zgodna z przepisami i nie podlega dowolnej modyfikacji.",
        order: 2,
      },
    ],
  },

  "tabliczka-qr-lane-zloto": {
    metaTitle: "Tabliczka QR lane złoto z plexi — premium | Lumine Concept",
    metaDescription:
      "Luksusowa tabliczka QR z efektem lanego złota z plexi dla premium salonu beauty. Kieruj klientów do recenzji Google. Wysyłka 5 dni.",
    faq: [
      {
        question: "Co to jest efekt lanego złota?",
        answer:
          "Efekt lanego złota uzyskiwany jest poprzez zastosowanie złotej folii lub specjalnej farby UV, która imituje rozlane, organiczne złoto. Efekt jest wyjątkowy i luksusowy.",
        order: 0,
      },
      {
        question: "Do jakiego salonu pasuje tabliczka 'lane złoto'?",
        answer:
          "Tabliczka idealna do salonów w stylu glamour, gold&black i premium. Harmonizuje z dekoracjami w odcieniach złota, bieli i czerni.",
        order: 1,
      },
      {
        question: "Czy efekt lanego złota jest trwały?",
        answer:
          "Tak — folia lub nadruk UV jest trwały i odporny na ścieranie przy normalnym użytkowaniu. Unikaj agresywnych środków czyszczących.",
        order: 2,
      },
    ],
  },

  "tabliczka-qr-zab": {
    metaTitle: "Tabliczka QR ząb z plexi dla gabinetu dentystycznego | Lumine Concept",
    metaDescription:
      "Tabliczka QR w kształcie zęba 18×20 cm z plexi dla dentysty. Kieruj pacjentów do recenzji Google Maps. Personalizacja, wysyłka 5 dni.",
    faq: [
      {
        question: "Czy tabliczka QR ząb pasuje do gabinetu stomatologicznego?",
        answer:
          "Tak — kształt zęba to symbol branży stomatologicznej. Tabliczka świetnie sprawdza się na recepcji lub blacie w poczekalni gabinetu.",
        order: 0,
      },
      {
        question: "Co można zakodować w QR na tabliczce?",
        answer:
          "Najczęściej zakodowywany jest link do wystawienia recenzji Google — to najskuteczniejszy sposób na zbieranie ocen od zadowolonych pacjentów.",
        order: 1,
      },
      {
        question: "Jaki rozmiar ma tabliczka QR ząb?",
        answer:
          "Tabliczka ma rozmiar 18×20 cm, co jest dobrze widoczne na blacie przy recepcji lub na ścianie gabinetu.",
        order: 2,
      },
    ],
  },

  "tabliczka-wi-fi": {
    metaTitle: "Tabliczka Wi-Fi z plexi dla salonu beauty | Lumine Concept",
    metaDescription:
      "Elegancka tabliczka z kodem Wi-Fi z plexi dla salonu beauty i kawiarni. Udostępniaj sieć gościom w estetyczny sposób. Wysyłka 5 dni.",
    faq: [
      {
        question: "Jak działa tabliczka Wi-Fi?",
        answer:
          "Tabliczka zawiera kod QR do automatycznego połączenia z Wi-Fi oraz widoczne hasło do sieci. Klient skanuje kod lub wpisuje hasło ręcznie.",
        order: 0,
      },
      {
        question: "Co wpisać podczas konfiguracji tabliczki Wi-Fi?",
        answer:
          "Podajesz nazwę sieci (SSID) i hasło. Generujemy odpowiedni kod QR i przygotowujemy projekt graficzny do akceptacji.",
        order: 1,
      },
      {
        question: "Czy tabliczka Wi-Fi jest elegancka do salonu?",
        answer:
          "Tak — plexi to materiał klasy premium, który wygląda znacznie lepiej niż standardowe karteczki z hasłem. Dostępna w wielu kolorach i wzorach.",
        order: 2,
      },
    ],
  },

  "tabliczka-wi-fi-z-logo": {
    metaTitle: "Tabliczka Wi-Fi z logo z plexi | Lumine Concept",
    metaDescription:
      "Tabliczka Wi-Fi z logo salonu z plexi — branding i wygoda w jednym. Personalizowana z Twoim logotypem i nazwą sieci. Wysyłka 5 dni.",
    faq: [
      {
        question: "Jak dodać logo do tabliczki Wi-Fi?",
        answer:
          "Podczas konfiguracji możesz wgrać plik z logo (PNG z tłem przezroczystym, min. 300 dpi). Nasze studio dopasowuje logo do projektu tabliczki.",
        order: 0,
      },
      {
        question: "Czy tabliczka Wi-Fi z logo to dobry element brandingu?",
        answer:
          "Zdecydowanie tak — każdy klient widzi Twoje logo, gdy szuka hasła Wi-Fi. To subtelne, ale skuteczne wzmocnienie wizerunku marki.",
        order: 1,
      },
    ],
  },

  "tabliczka-wi-fi-zab": {
    metaTitle: "Tabliczka Wi-Fi ząb z plexi dla dentysty | Lumine Concept",
    metaDescription:
      "Tabliczka Wi-Fi w kształcie zęba z plexi dla gabinetu dentystycznego. Elegancki dostęp do sieci dla pacjentów. Personalizacja, wysyłka 5 dni.",
    faq: [
      {
        question: "Dlaczego kształt zęba na tabliczce Wi-Fi?",
        answer:
          "Kształt zęba to symbol rozpoznawalny w branży stomatologicznej. Tabliczka Wi-Fi w tym kształcie to spójny element brandingu gabinetu dentystycznego.",
        order: 0,
      },
      {
        question: "Czy tabliczka Wi-Fi ząb pasuje też do ortodontów?",
        answer:
          "Tak — tabliczka sprawdza się w każdym gabinecie stomatologicznym: dentyście, ortodoncie i protetyce. Pacjenci w poczekalni chętnie korzystają z Wi-Fi.",
        order: 1,
      },
    ],
  },

  "tabliczka-z-4-kodami-qr": {
    metaTitle: "Tabliczka z 4 kodami QR z plexi | Lumine Concept",
    metaDescription:
      "Tabliczka z 4 kodami QR z plexi — Google, Instagram, Booksy, Facebook w jednym. Idealna dla salonu beauty. Personalizacja, wysyłka 5 dni.",
    faq: [
      {
        question: "Dlaczego warto mieć 4 kody QR na jednej tabliczce?",
        answer:
          "Jeden element obsługuje wszystkie ważne platformy — klient jednym spojrzeniem widzi, gdzie może ocenić lub obserwować Twój salon. Oszczędzasz miejsce na blacie.",
        order: 0,
      },
      {
        question: "Jakie platformy można umieścić na tabliczce z 4 QR?",
        answer:
          "Najczęściej: Google Maps (recenzje), Instagram, Booksy i Facebook. Możesz wybrać dowolną kombinację platform — podajesz linki w konfiguratorze.",
        order: 1,
      },
      {
        question: "Czy tabliczka z 4 QR jest czytelna?",
        answer:
          "Tak — kody QR mają odpowiedni rozmiar (min. 3×3 cm), by skanery w smartfonach odczytywały je bezbłędnie. Ikony platform są wyraźnie podpisane.",
        order: 2,
      },
    ],
  },

  "tabliczka-z-4-kodami-qr-2": {
    metaTitle: "Tabliczka z 4 kodami QR wariant 2 z plexi | Lumine Concept",
    metaDescription:
      "Drugi wzór tabliczki z 4 kodami QR z plexi — elegancki design dla salonu beauty. Personalizacja platform, trwałość, wysyłka 5 dni.",
    faq: [
      {
        question: "Czym różni się wariant 2 od wariantu 1?",
        answer:
          "Wariant 2 ma inny układ graficzny kodów QR — inne proporcje i styl ikon. Funkcja jest identyczna, ale design pasuje do innych stylów wnętrz.",
        order: 0,
      },
      {
        question: "Czy oba warianty tabliczki są tej samej jakości?",
        answer:
          "Tak — oba wykonane są z tej samej wysokiej jakości plexi z nadrukiem UV. Różnią się jedynie stylistyką projektu graficznego.",
        order: 1,
      },
    ],
  },

  "tabliczka-z-dwoma-kodami-qr": {
    metaTitle: "Tabliczka z 2 kodami QR z plexi | Lumine Concept",
    metaDescription:
      "Tabliczka z dwoma kodami QR z plexi — kieruj klientów do recenzji Google i obserwowania Instagrama. Elegancka dla salonu. Wysyłka 5 dni.",
    faq: [
      {
        question: "Które platformy warto umieścić na tabliczce z 2 QR?",
        answer:
          "Najczęściej wybierane kombinacje: Google + Instagram, Google + Booksy, Facebook + Google. Dobieraj platformy, które przynoszą Ci największy ruch.",
        order: 0,
      },
      {
        question: "Jaki rozmiar ma tabliczka z 2 kodami QR?",
        answer:
          "Standardowy rozmiar to ok. 15×20 cm lub 12×18 cm — poręczny format na blat, idealny przy stanowisku recepcji.",
        order: 1,
      },
    ],
  },

  "tabliczka-z-kodami-qr": {
    metaTitle: "Tabliczka z kodami QR STONE z plexi | Lumine Concept",
    metaDescription:
      "Tabliczka z kodami QR w stylu STONE z plexi — elegancka dla salonu beauty. Personalizacja platform, trwałość, szybka realizacja. Wysyłka 5 dni.",
    faq: [
      {
        question: "Czym jest styl STONE w tabliczkach z plexi?",
        answer:
          "Styl STONE to kolekcja z teksturą imitującą kamień lub beton — nowoczesna estetyka industrialna. Doskonale pasuje do salonów w stylu loft i minimal.",
        order: 0,
      },
      {
        question: "Czy tabliczka STONE jest odporna na zarysowania?",
        answer:
          "Tak — nadruk UV na plexi jest odporny na zarysowania i ścieranie. Trwałość materiału sprawia, że tabliczka służy przez wiele lat.",
        order: 1,
      },
    ],
  },

  "tabliczka-z-kodami-qr-2": {
    metaTitle: "Tabliczka z kodami QR wariant 2 z plexi | Lumine Concept",
    metaDescription:
      "Drugi wzór tabliczki z kodami QR z plexi dla salonu beauty. Nowoczesny design, personalizacja, kierowanie do Google i social media. Wysyłka 5 dni.",
    faq: [
      {
        question: "Czym różni się wariant 2?",
        answer:
          "Wariant 2 prezentuje inny układ graficzny — inną ramkę, krój czcionki lub kolor tła. To idealna opcja dla salonów szukających bardziej oryginalnego wyglądu.",
        order: 0,
      },
    ],
  },

  "tabliczka-z-kodami-qr-3": {
    metaTitle: "Tabliczka z kodami QR wariant 3 z plexi | Lumine Concept",
    metaDescription:
      "Trzecia wersja tabliczki z kodami QR z plexi dla salonu beauty — personalizacja z Twoimi kodami QR. Trwały materiał, wysyłka 5 dni.",
    faq: [
      {
        question: "Czym wyróżnia się wariant 3?",
        answer:
          "Wariant 3 to najbardziej zdobny projekt — bogatsza ramka i ozdobne elementy graficzne. Pasuje do salonów w stylu glamour i boho.",
        order: 0,
      },
    ],
  },

  "tabliczka-z-kodami-qr-fala": {
    metaTitle: "Tabliczka z kodami QR Fala z plexi | Lumine Concept",
    metaDescription:
      "Tabliczka z kodami QR w kształcie fali z plexi — nowoczesna dekoracja salonu beauty. Personalizacja platform, trwałość, wysyłka 5 dni.",
    faq: [
      {
        question: "Dlaczego kształt fali?",
        answer:
          "Falisty kształt nadaje tabliczce organiczny, naturalny charakter — idealnie pasuje do salonów spa, wellness i beauty inspirowanych naturą.",
        order: 0,
      },
      {
        question: "Ile kodów QR mieści tabliczka Fala?",
        answer:
          "Standardowa wersja mieści 2–3 kody QR. Kody można przypisać do Google, Instagrama, Booksy lub innej platformy.",
        order: 1,
      },
    ],
  },

  "tabliczka-z-kodami-qr-owalna": {
    metaTitle: "Owalna tabliczka z kodami QR z plexi | Lumine Concept",
    metaDescription:
      "Owalna tabliczka z kodami QR z plexi — elegancki kształt dla salonu beauty premium. Kieruj klientów do recenzji i social media. Wysyłka 5 dni.",
    faq: [
      {
        question: "Czy owalny kształt pasuje do każdego salonu?",
        answer:
          "Owal to miękki, elegancki kształt — pasuje do salonów beauty, spa i masażu, szczególnie tych urządzonych w stylu skandynawskim lub eko.",
        order: 0,
      },
      {
        question: "Ile kodów QR mieści owalna tabliczka?",
        answer:
          "Standardowo 2–3 kody QR. Możliwa jest też wersja z jednym dużym kodem w centrum tabliczki.",
        order: 1,
      },
    ],
  },

  "tabliczka-z-kodami-qr-stone": {
    metaTitle: "Tabliczka z kodami QR kolekcja STONE | Lumine Concept",
    metaDescription:
      "Tabliczka z kodami QR kolekcja STONE z plexi — luksusowy akcent dla premium salonu beauty. Personalizacja, szybka realizacja. Wysyłka 5 dni.",
    faq: [
      {
        question: "Czym jest kolekcja STONE?",
        answer:
          "Kolekcja STONE to seria tabliczek z plexi z teksturą imitującą naturalny kamień (beton, marmur, łupek). Tworzy industrialny, premium wygląd.",
        order: 0,
      },
      {
        question: "Czy kolekcja STONE różni się od innych wariantów?",
        answer:
          "Tak — STONE wyróżnia się specyficzną teksturą tła, która sprawia wrażenie ciężkości i szlachetności. Idealna do salonów w stylu minimalistycznym i premium.",
        order: 1,
      },
    ],
  },

  "tabliczka-z-nazwa-pomieszczenia": {
    metaTitle: "Tabliczka z nazwą pomieszczenia z plexi | Lumine Concept",
    metaDescription:
      "Elegancka tabliczka z nazwą pomieszczenia z plexi dla salonu beauty i biura. Personalizowana, trwała, estetyczna ozdoba drzwi. Wysyłka 5 dni.",
    faq: [
      {
        question: "Jakie nazwy pomieszczeń można umieścić na tabliczce?",
        answer:
          "Możesz umieścić dowolną nazwę: Gabinet, Recepcja, Toaleta, Strefa relaksu, Szatnia — każda treść jest personalizowana według Twoich potrzeb.",
        order: 0,
      },
      {
        question: "Jak montować tabliczkę na drzwiach?",
        answer:
          "Tabliczkę mocuje się za pomocą samoprzylepnych podkładek 3M lub kołków rozporowych do ściany/drzwi. Montaż nie niszczy powierzchni.",
        order: 1,
      },
      {
        question: "Czy tabliczka z nazwą pomieszczenia może zawierać piktogram?",
        answer:
          "Tak — możemy dodać piktogram toalety, wózka inwalidzkiego lub inny symbol. Informacje wpisujesz podczas konfiguracji.",
        order: 2,
      },
    ],
  },

  "wizytownik-3d": {
    metaTitle: "Wizytownik 3D z plexi dla salonu | Lumine Concept",
    metaDescription:
      "Elegancki wizytownik 3D z plexi na blat salonu beauty. Profesjonalna prezentacja wizytówek, efektowny design. Personalizacja, wysyłka 5 dni.",
    faq: [
      {
        question: "Ile wizytówek pomieści wizytownik 3D?",
        answer:
          "Standardowy wizytownik 3D pomieści od 20 do 50 wizytówek standardowego formatu (85×55 mm), zależnie od modelu.",
        order: 0,
      },
      {
        question: "Czy wizytownik można personalizować?",
        answer:
          "Tak — wizytownik może zawierać logo lub nazwę salonu. Elementy 3D mogą nawiązywać do branży beauty (kwiat, liść, serce).",
        order: 1,
      },
      {
        question: "Dlaczego warto mieć wizytownik 3D z plexi?",
        answer:
          "Wizytownik 3D wyróżnia się na blacie recepcji i przyciąga wzrok klientów. Zachęca do wzięcia wizytówki bardziej niż standardowy plastikowy stojak.",
        order: 2,
      },
    ],
  },

  "zakaz-palenia": {
    metaTitle: "Tabliczka zakaz palenia z plexi | Lumine Concept",
    metaDescription:
      "Estetyczna tabliczka 'Zakaz palenia' z plexi dla salonu, biura i gastronomii. Spełnia wymogi prawne w eleganckim designie. Wysyłka 5 dni.",
    faq: [
      {
        question: "Czy tabliczka zakaz palenia spełnia przepisy?",
        answer:
          "Tak — tabliczka zawiera standardowy symbol zakazu palenia zgodny z wymogami ustawy o ochronie zdrowia przed następstwami używania tytoniu.",
        order: 0,
      },
      {
        question: "Gdzie montować tabliczkę zakaz palenia?",
        answer:
          "Tabliczkę montuje się przy wejściu do budynku i w miejscach ogólnodostępnych. Możesz umieścić ją na ścianie lub drzwiach.",
        order: 1,
      },
      {
        question: "Dlaczego zakaz palenia z plexi zamiast naklejki?",
        answer:
          "Tabliczka z plexi jest trwalsza, estetyczniejsza i łatwa do demontażu. Nie brudzi ściany i pasuje do nowoczesnych wnętrz.",
        order: 2,
      },
    ],
  },

  "zalecenia-pielegnacyjna": {
    metaTitle: "Zalecenia po laminacji brwi z plexi | Lumine Concept",
    metaDescription:
      "Tabliczka z zaleceniami po laminacji brwi z plexi 23×25 cm. Profesjonalne informacje dla klientek salonu beauty. Personalizacja, wysyłka 5 dni.",
    faq: [
      {
        question: "Co zawiera tabliczka zaleceń po laminacji brwi?",
        answer:
          "Tabliczka zawiera kompletne zalecenia pozabiegowe: czego unikać w ciągu 24–48h, jak pielęgnować brwi i kiedy wrócić na kolejny zabieg.",
        order: 0,
      },
      {
        question: "Czy mogę dostosować treść zaleceń do mojego salonu?",
        answer:
          "Tak — treść jest personalizowana pod Twoje zalecenia. Możesz dodać logo salonu i kontakt.",
        order: 1,
      },
      {
        question: "Do jakich zabiegów pasuje ta tabliczka?",
        answer:
          "Tabliczka przeznaczona jest do zaleceń po laminacji brwi, ale treść możesz dostosować do innych zabiegów: keratynowego prostowania, henny czy liftingu rzęs.",
        order: 2,
      },
    ],
  },

  "zalecenia-pielegnacyjne": {
    metaTitle: "Zalecenia pielęgnacyjne z plexi 30×40 cm | Lumine Concept",
    metaDescription:
      "Duża tabliczka z zaleceniami pielęgnacyjnymi 30×40 cm z plexi dla salonu beauty. Elegancka i czytelna informacja dla klientek. Wysyłka 5 dni.",
    faq: [
      {
        question: "Do jakich zabiegów stosuje się tabliczkę 30×40 cm?",
        answer:
          "Duży format (30×40 cm) jest czytelny z większej odległości — idealny do ekspozycji na ścianie gabinetu. Doskonały do zaleceń po każdym zabiegu kosmetycznym.",
        order: 0,
      },
      {
        question: "Czy mogę mieć własny projekt graficzny tabliczki?",
        answer:
          "Tak — możesz dostarczyć własny plik graficzny lub skorzystać z naszego kreatora w konfiguratorze. Przygotowujemy wizualizację przed drukiem.",
        order: 1,
      },
      {
        question: "Jak zamontować dużą tabliczkę 30×40 cm?",
        answer:
          "Do zestawu dołączamy śruby dystansowe do montażu na ścianie. Tabliczkę można też oprzeć na podstawce lub zawiesić na haczyku.",
        order: 2,
      },
    ],
  },

  "zalecenia-pielegnacyjne-3d": {
    metaTitle: "Zalecenia pielęgnacyjne 3D z plexi 20×30 cm | Lumine Concept",
    metaDescription:
      "Tabliczka zaleceń pielęgnacyjnych 3D z plexi 20×30 cm dla salonu beauty. Nowoczesny design, personalizacja treści. Wysyłka 5 dni roboczych.",
    faq: [
      {
        question: "Czym różnią się zalecenia 3D od standardowych?",
        answer:
          "Wersja 3D ma warstwową budowę — elementy graficzne (logo, ikony) są wypukłe i unoszą się nad tłem, co nadaje tabliczce głębię i efekt premium.",
        order: 0,
      },
      {
        question: "Czy tabliczka 3D jest bezpieczna w gabinecie kosmetycznym?",
        answer:
          "Tak — elementy 3D są trwale przyklejone i nie mają ostrych krawędzi. Tabliczka spełnia wszelkie normy bezpieczeństwa produktów.",
        order: 1,
      },
      {
        question: "Jaki jest czas realizacji zaleceń pielęgnacyjnych 3D?",
        answer:
          "Standardowy czas realizacji wynosi 5–7 dni roboczych ze względu na bardziej złożony proces produkcji elementów 3D.",
        order: 2,
      },
    ],
  },

  "zawieszka-na-drzwi": {
    metaTitle: "Zawieszka na drzwi 'Trwa zabieg' z plexi | Lumine Concept",
    metaDescription:
      "Elegancka zawieszka na drzwi 'Trwa zabieg — prosimy nie wchodzić' z plexi dla salonu beauty. Profesjonalny wygląd gabinetu. Wysyłka 5 dni.",
    faq: [
      {
        question: "Czy zawieszka pasuje do standardowych drzwi?",
        answer:
          "Tak — zawieszka dopasowana jest do standardowych klamek drzwiowych (okrągłych i prostokątnych). Otworek lub haczyk dopasowujemy do rozmiaru klamki.",
        order: 0,
      },
      {
        question: "Czy mogę mieć własny tekst na zawieszce?",
        answer:
          "Standardowy napis to 'Trwa zabieg — prosimy nie wchodzić', ale możesz zamówić inny tekst, np. 'Sesja zdjęciowa' lub 'Zapraszamy za chwilę'.",
        order: 1,
      },
      {
        question: "Z jakiego materiału wykonana jest zawieszka?",
        answer:
          "Zawieszka wykonana jest z plexi o grubości 3 mm. Jest lekka, elegancka i bardzo trwała — nie pęka jak tanie plastikowe zawieszki.",
        order: 2,
      },
    ],
  },

  "drewniane-pudelko-na-koperty": {
    metaTitle: "Drewniane pudełko na koperty ślubne | Lumine Concept",
    metaDescription:
      "Eleganckie drewniane pudełko na koperty weselne — personalizowane z imionami pary młodej. Naturalny materiał, piękna dekoracja sali. Wysyłka 5 dni.",
    faq: [
      {
        question: "Ile kopert mieści drewniane pudełko?",
        answer:
          "Pudełko mieści od 30 do 80 kopert standardowego formatu, w zależności od modelu. Wystarczy na większość wesel.",
        order: 0,
      },
      {
        question: "Czy pudełko drewniane można personalizować?",
        answer:
          "Tak — grawerujemy imiona pary młodej, datę ślubu lub własny napis. Personalizacja dostępna w konfiguratorze.",
        order: 1,
      },
      {
        question: "Czym różni się od pudełka mlecznego z plexi?",
        answer:
          "Drewniane pudełko ma ciepły, naturalny charakter i pasuje do wesel w stylu rustykalnym, boho i eko. Pudełko mleczne z plexi to wariant nowoczesny i minimalistyczny.",
        order: 2,
      },
    ],
  },

  "tabliczka-z-kodami-qr-prosta": {
    metaTitle: "Prosta tabliczka z kodami QR z plexi | Lumine Concept",
    metaDescription:
      "Minimalistyczna tabliczka z kodami QR z plexi dla salonu beauty. Czytelny design, personalizacja linków. Kieruj klientów do Google i social media. Wysyłka 5 dni.",
    faq: [
      {
        question: "Czym różni się wersja prosta od innych tabliczek QR?",
        answer:
          "Wersja prosta ma minimalistyczny układ bez ozdobników — czyste kody QR z krótkimi podpisami platform. Idealna do nowoczesnych, oszczędnych wnętrz.",
        order: 0,
      },
      {
        question: "Ile kodów QR mieści prosta tabliczka?",
        answer:
          "Standardowo 2–3 kody QR. Każdy przypisujesz do wybranej platformy podczas konfiguracji zamówienia.",
        order: 1,
      },
    ],
  },

  "tabliczka-z-3-kodami-qr": {
    metaTitle: "Tabliczka z 3 kodami QR z plexi | Lumine Concept",
    metaDescription:
      "Tabliczka z trzema kodami QR z plexi — Google, Instagram i Booksy w jednym. Elegancka dla salonu beauty. Personalizacja, wysyłka 5 dni.",
    faq: [
      {
        question: "Które platformy warto umieścić na tabliczce z 3 QR?",
        answer:
          "Najpopularniejszy zestaw: Google Maps (recenzje), Instagram i Booksy. Możesz wybrać dowolną kombinację trzech platform.",
        order: 0,
      },
      {
        question: "Czy tabliczka z 3 kodami QR jest czytelna na blacie?",
        answer:
          "Tak — kody mają optymalny rozmiar do skanowania smartfonem, a ikony platform są wyraźnie opisane pod każdym kodem.",
        order: 1,
      },
    ],
  },

  "tabliczka-informacyjna": {
    metaTitle: "Tabliczka informacyjna z plexi dla salonu | Lumine Concept",
    metaDescription:
      "Uniwersalna tabliczka informacyjna z plexi dla salonu beauty i gabinetu. Personalizowana treść, elegancki design, trwały materiał. Wysyłka 5 dni.",
    faq: [
      {
        question: "Jaką treść można umieścić na tabliczce informacyjnej?",
        answer:
          "Dowolną — regulamin salonu, godziny otwarcia, informacje o zabiegach, zasady rezerwacji. Treść wpisujesz podczas konfiguracji.",
        order: 0,
      },
      {
        question: "Gdzie najlepiej umieścić tabliczkę informacyjną?",
        answer:
          "Przy recepcji, w poczekalni lub w gabinecie — wszędzie tam, gdzie klienci potrzebują szybkiej informacji przed lub po zabiegu.",
        order: 1,
      },
      {
        question: "Czy tabliczka informacyjna może zawierać logo salonu?",
        answer:
          "Tak — logo i kolorystyka salonu mogą być częścią projektu graficznego tabliczki.",
        order: 2,
      },
    ],
  },

  "wizytownik-z-logo": {
    metaTitle: "Wizytownik z logo z plexi dla salonu | Lumine Concept",
    metaDescription:
      "Elegancki wizytownik z logo salonu z plexi na blat recepcji. Profesjonalna prezentacja wizytówek z brandingiem. Personalizacja, wysyłka 5 dni.",
    faq: [
      {
        question: "Czy wizytownik z logo zawiera moje logo salonu?",
        answer:
          "Tak — podczas konfiguracji wgrywasz plik z logo, a my integrujemy je w projekcie wizytownika. Efekt spójny z identyfikacją wizualną salonu.",
        order: 0,
      },
      {
        question: "Ile wizytówek pomieści wizytownik z logo?",
        answer:
          "Standardowy wizytownik pomieści 20–40 wizytówek formatu 85×55 mm. Dokładna pojemność zależy od modelu.",
        order: 1,
      },
      {
        question: "Czym różni się od wizytownika 3D?",
        answer:
          "Wizytownik z logo ma płaski front z nadrukowanym logotypem. Wizytownik 3D ma wypukłe, warstwowe elementy dekoracyjne — efekt bardziej premium.",
        order: 2,
      },
    ],
  },

  test: {
    metaTitle: "Test | Lumine Concept",
    metaDescription: "Produkt testowy — niedostępny w sklepie.",
    faq: [],
    noIndex: true,
  },
};

// ---------------------------------------------------------------------------
// Helpers API
// ---------------------------------------------------------------------------

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${BACKEND_URL.replace(/\/$/, "")}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { token: string };
  return data.token;
}

async function adminFetch(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const res = await fetch(`${BACKEND_URL.replace(/\/$/, "")}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...((options.headers as Record<string, string>) ?? {}),
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(
      `Admin API ${options.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`,
    );
  }
  return res.json();
}

interface MedusaProductListItem {
  id: string;
  title: string;
  handle: string;
  metadata: Record<string, unknown> | null;
}

function serializeProductFaq(
  faq: Omit<FaqItem, "id">[],
  handleSlug: string,
): string {
  const items: FaqItem[] = faq.map((item, i) => ({
    id: `pfaq_${handleSlug}_${i}`,
    question: item.question,
    answer: item.answer,
    order: item.order,
  }));
  return JSON.stringify(items);
}

function hasSeoSet(meta: Record<string, unknown> | null): boolean {
  if (!meta) return false;
  return (
    typeof meta.seo_meta_title === "string" && meta.seo_meta_title.trim().length > 0
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Brak MEDUSA_ADMIN_EMAIL lub MEDUSA_ADMIN_PASSWORD.");
    console.error("Stwórz plik scripts/fill-product-seo.env (patrz fill-product-seo.env.example).");
    process.exit(1);
  }

  console.log(`Backend: ${BACKEND_URL}`);
  console.log(
    `Tryb: ${DRY_RUN ? "DRY RUN (bez zapisu)" : "ZAPIS"} | FORCE=${FORCE}${HANDLE_FILTER ? ` | HANDLE=${HANDLE_FILTER}` : ""}\n`,
  );

  const token = await getAuthToken();
  let offset = 0;
  const limit = 50;
  let updated = 0;
  let skipped = 0;
  let notInDb = 0;
  let failed = 0;

  while (true) {
    const data = (await adminFetch(
      token,
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle,metadata`,
    )) as { products: MedusaProductListItem[]; count: number };

    if (data.products.length === 0) break;

    for (const product of data.products) {
      if (HANDLE_FILTER && product.handle !== HANDLE_FILTER) continue;

      const seoData = SEO_DATABASE[product.handle];
      if (!seoData) {
        console.log(`[BRAK W BAZIE SEO] ${product.title} (${product.handle})`);
        notInDb++;
        continue;
      }

      const meta = (product.metadata ?? {}) as Record<string, unknown>;
      if (!FORCE && hasSeoSet(meta)) {
        console.log(`[SKIP ma SEO] ${product.title} (${product.handle})`);
        skipped++;
        continue;
      }

      const newMeta: Record<string, string> = {
        seo_meta_title: seoData.metaTitle,
        seo_meta_description: seoData.metaDescription,
        product_faq: serializeProductFaq(seoData.faq, product.handle),
      };
      if (seoData.noIndex) newMeta.seo_no_index = "true";

      console.log(`[${DRY_RUN ? "DRY" : "UPDATE"}] ${product.title} (${product.handle})`);
      console.log(`  meta title:  ${seoData.metaTitle}`);
      console.log(`  meta desc:   ${seoData.metaDescription}`);
      console.log(`  faq:         ${seoData.faq.length} pytań`);

      if (!DRY_RUN) {
        try {
          await adminFetch(token, `/admin/products/${product.id}`, {
            method: "POST",
            body: JSON.stringify({ metadata: { ...meta, ...newMeta } }),
          });
          updated++;
        } catch (e) {
          console.error(`  ✗ Błąd: ${e}`);
          failed++;
        }
      } else {
        updated++;
      }
    }

    offset += limit;
    if (data.products.length < limit) break;
    if (typeof data.count === "number" && offset >= data.count) break;
  }

  console.log("\n---");
  console.log(
    `Zakończono: ${DRY_RUN ? "symulacja" : "zaktualizowano"}: ${updated} | pominięto (ma SEO): ${skipped} | brak w bazie SEO: ${notInDb} | błędy: ${failed}`,
  );
  if (notInDb > 0) {
    console.log(
      `\nWskazówka: Produkty 'BRAK W BAZIE SEO' mają handle nieujęty w SEO_DATABASE.\nDodaj je ręcznie do skryptu lub uzupełnij przez panel Magazyn.`,
    );
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
