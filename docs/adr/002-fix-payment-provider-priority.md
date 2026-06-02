# ADR 002: Naprawa priorytetu payment providerów

**Data**: 2026-06-02  
**Status**: Zaakceptowane  
**Kontekst**: Krytyczny bug w checkout — zamówienie finalizowało się BEZ płatności

## Problem

User zgłosił: "zakupilem testowo produkt przez Przelewy24 i zamiast odpalić płatność to od razu wysłało zamówienie i jest zaakceptowane bez bramki płatniczej".

### Root cause

Funkcja `pickPreferredProvider()` w `apps/storefront/lib/medusa/checkout.ts` **zawsze wybierała `pp_system_default` (tryb testowy) jako domyślną metodę płatności**, nawet gdy Przelewy24 było skonfigurowane:

```typescript
// PRZED (błędny priorytet):
function pickPreferredProvider(list: Array<{ id: string }>): string | undefined {
  return (
    list.find((p) => p.id === SYSTEM_PAYMENT_PROVIDER_ID)?.id ?? list[0]?.id
  );
}
```

### Flow błędu

1. **Step 2 → 3**: `prepareCheckout()` wywoływało `pickPreferredProvider()` która zwracała `pp_system_default`
2. Backend tworzył payment session dla **system providera** (testowego, bez bramki)
3. `CheckoutForm` ustawiało `formData.paymentProviderId = "pp_system_default"`
4. **User widział w UI obie opcje płatności** (P24 + system), myślał że wybiera P24
5. **Ale `formData` już miało `pp_system_default`** z Step 2
6. Submit: warunek `if (formData.paymentProviderId === PRZELEWY24_PROVIDER_ID)` **NIE pasował**
7. Kod pomijał przekierowanie na P24 i szedł od razu do `completeCart()`
8. System provider akceptował natychmiast (bez bramki) → **zamówienie gotowe BEZ płatności**

## Rozwiązanie

### 1. Poprawiony priorytet w `pickPreferredProvider()`

```typescript
// PO (prawidłowy priorytet):
function pickPreferredProvider(list: Array<{ id: string }>): string | undefined {
  // Priorytet: P24 (produkcyjny) > system default (testowy) > pierwszy z listy
  const p24 = list.find((p) => p.id === PRZELEWY24_PROVIDER_ID);
  if (p24) return p24.id;
  
  const system = list.find((p) => p.id === SYSTEM_PAYMENT_PROVIDER_ID);
  if (system) return system.id;
  
  return list[0]?.id;
}
```

**Zmiana**: Przelewy24 ma teraz priorytet nad system providerem. System provider jest tylko fallbackiem dla testów/dev.

### 2. Poprawione typy w `packages/types/cart.ts`

**PRZED** (błędne, skrócone ID):
```typescript
export interface PaymentSession {
  provider_id: "przelewy24" | "paypo";
}
```

**PO** (prawidłowe, pełne ID Medusy):
```typescript
export interface PaymentSession {
  provider_id: "pp_przelewy24_przelewy24" | "pp_system_default" | "paypo";
}
```

## Weryfikacja

Po zmianach:
1. `pnpm type-check` ✅ (0 błędów TypeScript)
2. Flow checkout:
   - Step 2 → 3: `formData.paymentProviderId` ustawia się na `pp_przelewy24_przelewy24` (domyślnie)
   - User w Step 3 widzi P24 jako zaznaczoną opcję
   - Submit: warunek dla P24 **pasuje** → przekierowanie na bramkę → płatność → webhook → finalizacja

## Konsekwencje

### Pozytywne
- ✅ P24 jest teraz domyślną metodą płatności (gdy skonfigurowana)
- ✅ System provider tylko dla testów lokalnych
- ✅ Niemożliwe jest przypadkowe ominięcie bramki płatniczej
- ✅ Zgodność z regułami: "Płatność BLIK to must-have w PL" (45-commerce.mdc)

### Negatywne
- ⚠️ W dev environment bez konfiguracji P24, domyślnie będzie fallback na system provider (akceptowalne dla lokalnych testów)

## Monitoring

Po wdrożeniu na produkcję monitorować:
- PostHog: `checkout_step` event (Step 3) — `paymentMethod` powinno być `pp_przelewy24_przelewy24` w >95% przypadków
- Sentry: alert jeśli pojawi się `completeCart` dla `pp_system_default` na produkcji (nie powinno się zdarzyć)
- Webhook P24: logi `/hooks/payment/pp_przelewy24_przelewy24` — każdy checkout powinien mieć notyfikację

## Rollback plan

Jeśli pojawią się problemy:
```bash
git revert <commit-hash>
pnpm type-check && pnpm build
```

Zmiany są backward-compatible — jeśli P24 nie jest skonfigurowane, automatycznie wybierze `pp_system_default`.
