# ADR 003: Naprawa przekazywania emaila do Przelewy24 w prepareCheckout

**Data**: 2026-06-02  
**Status**: Zaakceptowane  
**Kontekst**: Krytyczny bug — P24 API odrzuca rejestrację transakcji z błędem "Invalid email"

## Problem

Po wdrożeniu ADR-002 (priorytet P24 nad system provider), odkryliśmy że **każda próba płatności przez P24 kończy się błędem**:

```
Przelewy24 API POST /transaction/register → 400: {"error":"Invalid email","code":400}
```

User widzi czerwony komunikat błędu na stronie "Sposób dostawy" (Step 2) w checkoucie.

### Root cause

W Step 2→3, endpoint `/store/custom/prepare-checkout` woła `createPaymentSessionsWorkflow` **bez przekazania pola `data`**, więc `Przelewy24PaymentService.initiatePayment` nie ma dostępu do emaila z koszyka.

Flow błędu:

1. **Step 1→2**: User wypełnia dane kontaktowe → `saveContactDetails()` zapisuje email w cart
2. **Step 2→3**: Klik "Przejdź do płatności" → `prepareCheckout()` woła workflow:
   ```typescript
   await createPaymentSessionsWorkflow(scope).run({
     input: {
       payment_collection_id: paymentCollectionId,
       provider_id: "pp_przelewy24_przelewy24",
       // ❌ BRAK `data` z emailem!
     },
   });
   ```
3. `Przelewy24PaymentService.initiatePayment` próbuje pobrać email:
   ```typescript
   const email =
     (ctx.email as string | undefined) ||  // undefined (brak data)
     customerCtx.email ||                  // undefined (brak customer)
     "";                                   // ❌ fallback na pusty string
   ```
4. P24 API `/transaction/register` odrzuca bo `email: ""` jest nieprawidłowy

### Dlaczego ten bug nie był widoczny wcześniej?

Przed ADR-002, `prepareCheckout` używało `pp_system_default` (testowego providera bez bramki), który **nie wymaga emaila**. Dopiero gdy naprawiliśmy priorytet na P24, bug został odkryty.

## Rozwiązanie

Przekazać `email` i `cart_id` do payment providera przez pole `data` w `createPaymentSessionsWorkflow`.

### Zmiana w `/store/custom/prepare-checkout/route.ts`:

**PRZED**:
```typescript
const [cartSnapshot] = await remoteQuery(pcObject);
// ... (brak pobierania emaila)

await createPaymentSessionsWorkflow(scope).run({
  input: {
    payment_collection_id: paymentCollectionId,
    provider_id: providerId,
    // ❌ BRAK data
  },
});
```

**PO**:
```typescript
const [cartSnapshot] = await remoteQuery({
  // ... 
  fields: [
    "id",
    "email",  // ✅ Dodane pobieranie emaila
    // ...
  ],
});

const cartEmail = (cartSnapshot as { email?: string }).email ?? "";

await createPaymentSessionsWorkflow(scope).run({
  input: {
    payment_collection_id: paymentCollectionId,
    provider_id: providerId,
    data: {
      cart_id: cartId,
      email: cartEmail,  // ✅ Przekazane do providera
    },
  },
});
```

Workflow przekazuje to pole do `initiatePayment`:
- `input.data.cart_id` → używane w `urlReturn` dla strony powrotu
- `input.data.email` → używane w rejestracji transakcji P24

## Weryfikacja

Po zmianach:
1. `pnpm type-check` ✅ (0 błędów TypeScript)
2. Flow checkout:
   - Step 1: zapisz email w cart
   - Step 2→3: `prepareCheckout()` przekazuje email do P24
   - P24 API `/transaction/register` **akceptuje** transakcję ✅
   - Submit: przekierowanie na bramkę → płatność

## Konsekwencje

### Pozytywne
- ✅ P24 payment sessions teraz tworzą się poprawnie
- ✅ Email z koszyka jest przekazywany do wszystkich payment providerów (nie tylko P24)
- ✅ Spójność z `initPrzelewy24Redirect` (która też przekazuje email)

### Negatywne
- ⚠️ Jeśli cart nie ma emaila w Step 2, P24 dostanie pusty string (ale to niemożliwe — Step 1 wymaga emaila)

## Monitoring

Po wdrożeniu:
- Backend logs: `[przelewy24] register` powinien pokazywać email (nie pusty string)
- Sentry: brak błędów `"Invalid email"` z P24 API
- Checkout completion rate powinien wzrosnąć (poprzednio 100% P24 transakcji failowało)

## Powiązane ADR

- [ADR-002](./002-fix-payment-provider-priority.md) - odkryło ten bug poprzez zmianę priorytetu na P24
