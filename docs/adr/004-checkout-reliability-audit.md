# ADR 004 — Audyt niezawodności checkoutu i płatności P24 (06.07.2026)

## Status
Wdrożone (commity: `73a01e3a` — naprawa incydentu, oraz commit tego audytu).

## Kontekst — incydent 06.07.2026

Klientka opłaciła 3 transakcje P24 (124,90 + 2× 224,80 zł). W sklepie: zamówienia
#10168/#10169 wisiały jako „Nieopłacone", a w P24 wszystkie transakcje jako
„do wykorzystania" (niezweryfikowane). Klientka zapłaciła 2× za ten sam koszyk,
bo strona powrotu ogłosiła porażkę, zanim bank zaksięgował przelew.

## Zdiagnozowane przyczyny (wszystkie naprawione)

1. **Webhook P24 martwy od początku integracji** — `urlStatus` zawierał segment
   `pp_przelewy24_przelewy24`, a Medusa dokleja `pp_` sama → resolver szukał
   `pp_pp_...` i każda notyfikacja padała (`AwilixResolutionError`). Naprawa:
   segment bez prefiksu (`/hooks/payment/przelewy24_przelewy24`).

2. **Martwe samo-naprawianie osieroconych zamówień** — filtr po
   `order.payment_status`, które w `query.graph` ZAWSZE zwraca `undefined`
   (pole wyliczane tylko w API admina) → recovery nigdy nic nie znajdował.
   Naprawa: klasyfikacja po `payment_collection.status` (realna kolumna).

3. **Przedwczesne „failed" na stronie powrotu** — po ~20 s pollingu status 0
   traktowano jako porażkę, gdy przelewy pay-by-link księgują się 1–3 min po
   powrocie klienta. Mail „ponów płatność" → podwójna wpłata. Naprawa: okno
   łaski `P24_ZERO_FAILED_MIN_AGE_MS` (15 min) — status 0 przy młodej sesji
   zwraca „pending".

4. **Retry kasował sesję z wpłatą w drodze** — `p24-retry-payment` usuwał
   starą sesję bez sprawdzenia, czy na jej transakcję nie weszły środki →
   wpłata osierocona (nic już jej nie widziało). Naprawa: probe statusu w P24
   przed skasowaniem; status 1/2 → `409 payment_in_progress`.

5. **Utracony „ogon" completeCartWorkflow** — workflow (`store: true`) potrafi
   zwrócić sterowanie ZANIM silnik wykona końcowe kroki (w tym autoryzację
   płatności): zamówienie #10169 powstało, `result.id` było `undefined`,
   wpis `workflow_execution` został w stanie `not_started`, sesja pending.
   Obrona: reconcile po `completeCart` domyka płatność JAWNIE
   (`authorizePaymentSession`, idempotentnie) w tym samym przebiegu, a id
   zamówienia bierze z linku `order_cart`.

6. **Kwota pokazana ≠ kwota pobrana (dopłata express)** — dopłata +50% żyła
   tylko w `cart.metadata` i doliczeniu client-side (`total + expressSurcharge`
   w CartProvider/OrderSummary). P24 pobiera wyłącznie zweryfikowany total
   Medusy — klient widział sumę Z dopłatą, płacił BEZ niej (strata przychodu,
   niespójne e-maile, ryzyko konsumenckie). Naprawa: `prepare-checkout`
   rekonsyliuje metodę wysyłki „Dopłata ekspresowa (+50%)" (idempotentnie,
   po `addShippingMethodToCartWorkflow`, bo ten usuwa wszystkie metody),
   odświeża payment_collection i utrwala kwotę w `metadata.express_fee_minor`.
   Storefront zeruje client-side surcharge, gdy dopłata siedzi już w totalu.

7. **Sesja P24 na nieaktualną kwotę** — po zmianie koszyka (dostawa, rabat,
   express) stara sesja/redirect prowadziły do transakcji na starą kwotę;
   `confirmFromP24` słusznie odmawia verify przy niezgodności → wpłata wisi.
   Naprawa: server-side guard w `prepare-checkout`
   (`planP24SessionForCheckout`): pending + rozjazd kwot → przerejestrowanie
   sesji (po probe P24: wpłata w drodze → 409). Niezgodność kwot przy verify
   dodatkowo alarmuje w Sentry (`p24-amount-mismatch`) — to jedyny stan,
   którego nie da się domknąć automatycznie (wymaga decyzji: zwrot/księgowanie).

## Pięć ścieżek domykania płatności (stan po audycie)

| # | Ścieżka | Stan |
|---|---------|------|
| 1 | Strona powrotu `/checkout/przelewy24/return` (poll + completeCart) | ✅ + okno łaski 15 min |
| 2 | Webhook P24 (`urlStatus` → verify → processPayment) | ✅ NAPRAWIONY (pp_pp_) |
| 3 | Scheduled job `reconcile-p24-payments` (co 5 min, shared mode) | ✅ + orphan recovery naprawione + same-run authorize |
| 4 | Endpoint `/store/custom/reconcile-p24` + cron Vercel (co 15 min) | ✅ |
| 5 | Idempotencja sesji + guard kwot + 409 przy wpłacie w drodze | ✅ wzmocnione server-side |

Inwarianty:
- Zamówienie powstaje TYLKO gdy P24 potwierdza środki (guard `validate` w
  `completeCartWorkflow`); wyjątek: utracony ogon workflow — wtedy sieroty
  domyka reconcile ≤ 5 min.
- Kwota płatności pochodzi wyłącznie z `input.amount` (zweryfikowany total);
  żadnych kwot z metadata/URL.
- `paid` ustawiają wyłącznie: verify po stronie providera (pull) lub webhook —
  nigdy sam redirect `?status=`.

## Znane ryzyka rezydualne

- **Wpłata bez sesji** (klient płaci ze STAREGO taba/linka bramki po tym, jak
  sesja została przerejestrowana): pieniądze widać tylko w panelu P24 („do
  wykorzystania"); po upływie terminu weryfikacji P24 zwraca je płatnikowi
  automatycznie. Procedura ręczna: panel P24 → transakcja → Zaksięguj → Zwrot.
- **Niezgodność kwot** (`p24-amount-mismatch` w Sentry): wymaga ręcznej decyzji.
- 5 pre-existing failujących testów CMS/Sanity (poza checkoutem) — osobne zadanie.

## Testy

- `apps/backend/tests/express-fee.test.ts` — plan rekoncyliacji dopłaty.
- `apps/backend/tests/p24-session-reuse.test.ts` — decyzje create/reuse/recreate.
- `apps/backend/tests/p24-return-status.test.ts` — okno łaski (pending vs failed).
- `apps/backend/tests/p24-reconcile.test.ts` — klasyfikacja kolekcji/sesji.
- `apps/backend/tests/przelewy24-service.test.ts` — urlStatus bez `pp_`, podpisy.
- `apps/storefront/tests/lib/express-fee.test.ts` — wykrywanie dopłaty w koszyku.
