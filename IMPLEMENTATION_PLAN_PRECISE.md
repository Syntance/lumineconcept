# Ultra-Precyzyjny Plan Implementacji Ulepszeń Checkout

## STRUKTURA PLIKÓW - Sprawdzone ścieżki

```
apps/
  backend/
    package.json                                              [ISTN EXISTS]
    src/api/store/custom/
      prepare-checkout/route.ts                               [EXISTS]
      verify-turnstile/route.ts                               [CREATE NEW]
  
  storefront/
    package.json                                              [EXISTS]
    next.config.ts                                            [EXISTS - będzie ts, nie js]
    app/
      layout.tsx                                              [EXISTS]
      (shop)/
        deklaracja-dostepnosci/page.tsx                       [CREATE NEW]
    components/
      checkout/
        CheckoutForm.tsx                                      [EXISTS - 1006 linii]
        OrderSummary.tsx                                      [EXISTS - 207 linii]
      layout/
        CookieConsent.tsx                                     [CREATE NEW]
    lib/
      analytics/
        events.ts                                             [EXISTS - 438 linii]
      medusa/
        checkout.ts                                           [EXISTS - 688 linii]
      utils/
        delivery.ts                                           [CREATE NEW]
```

---

## GRUPA 1: Security & Infrastructure

### 1.1 Backend Dependencies - ALREADY DONE
✅ Zmodyfikowano `apps/backend/package.json` - dodano @upstash/ratelimit i @upstash/redis

### 1.2 Storefront Dependencies - ALREADY DONE
✅ Zmodyfikowano `apps/storefront/package.json` - dodano @marsidev/react-turnstile

### 1.3 Rate Limiting - ALREADY DONE
✅ Zmodyfikowano `apps/backend/src/api/store/custom/prepare-checkout/route.ts`

### 1.4 Turnstile Backend Endpoint - ALREADY DONE
✅ Utworzono `apps/backend/src/api/store/custom/verify-turnstile/route.ts`

### 1.5 Next.js Config z CSP Headers

**PLIK**: `apps/storefront/next.config.ts`

**INSTRUKCJA**: Ten plik już istnieje. Przeczytaj jego zawartość i dodaj na KOŃCU pliku (przed `export default`) funkcję `headers()`.

<details>
<summary>Kliknij aby zobaczyć dokładną implementację</summary>

```typescript
// Na końcu pliku next.config.ts, PRZED finalnym export

const config: NextConfig = {
  // ... istniejąca konfiguracja ...
  
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://challenges.cloudflare.com https://app.posthog.com",
              "frame-src https://challenges.cloudflare.com",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default config;
```
</details>

### 1.6 Enhanced Validation Functions w CheckoutForm

**PLIK**: `apps/storefront/components/checkout/CheckoutForm.tsx`

**LOKALIZACJA**: Dodaj PRZED linią 41 (przed `type CheckoutStep = 1 | 2 | 3;`)

**DOKŁADNA IMPLEMENTACJA**:
```typescript
// Dodaj te 3 funkcje validacyjne PO importach (linia ~40), PRZED type CheckoutStep

const PHONE_REGEX = /^(?:\+48)?[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}$/;
const POSTAL_CODE_REGEX = /^\d{2}-\d{3}$/;
const NIP_REGEX = /^\d{10}$/;

function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, "");
  return PHONE_REGEX.test(phone) && (cleaned.length === 9 || cleaned.length === 11);
}

function validatePostalCode(code: string): boolean {
  return POSTAL_CODE_REGEX.test(code);
}

function validateNip(nip: string): boolean {
  const cleaned = nip.replace(/[\s-]/g, "");
  if (!NIP_REGEX.test(cleaned)) return false;
  
  // Checksum validation
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = cleaned
    .slice(0, 9)
    .split("")
    .reduce((acc, digit, i) => acc + parseInt(digit) * weights[i], 0);
  const checksum = sum % 11;
  return checksum === parseInt(cleaned[9]);
}
```

### 1.7 Użycie Validation w canGoToStep2

**PLIK**: `apps/storefront/components/checkout/CheckoutForm.tsx`

**LOKALIZACJA**: Linie 383-396

**ZASTĄP FRAGMENT**:
```typescript
// STARE (linie 383-396):
  const isNipValid = /^\d{10}$/.test(formData.nip.replace(/[-\s]/g, ""));
  const vatValid =
    !formData.wantInvoice ||
    (formData.companyName.trim() !== "" && isNipValid);

  const canGoToStep2 =
    formData.email.includes("@") &&
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.address.trim() !== "" &&
    formData.city.trim() !== "" &&
    formData.postalCode.trim() !== "" &&
    vatValid;

// NOWE:
  const isNipValid = validateNip(formData.nip);
  const vatValid =
    !formData.wantInvoice ||
    (formData.companyName.trim() !== "" && isNipValid);

  const canGoToStep2 =
    formData.email.includes("@") &&
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    validatePhone(formData.phone) &&
    formData.address.trim() !== "" &&
    formData.city.trim() !== "" &&
    validatePostalCode(formData.postalCode) &&
    vatValid &&
    formData.acceptTerms &&
    formData.acceptRodo;
```

### 1.8 Dodanie turnstileToken do CheckoutFormData

**PLIK**: `apps/storefront/components/checkout/CheckoutForm.tsx`

**LOKALIZACJA**: Linie 45-61 (type CheckoutFormData)

**ZASTĄP FRAGMENT**:
```typescript
// STARE (linie 45-61):
type CheckoutFormData = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  shippingOptionId: string;
  paymentProviderId: string;
  newsletter: boolean;
  wantInvoice: boolean;
  companyName: string;
  nip: string;
  acceptTerms: boolean;
  acceptRodo: boolean;
};

// NOWE:
type CheckoutFormData = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  shippingOptionId: string;
  paymentProviderId: string;
  newsletter: boolean;
  wantInvoice: boolean;
  companyName: string;
  nip: string;
  acceptTerms: boolean;
  acceptRodo: boolean;
  turnstileToken: string;
  orderNotes: string;
};
```

### 1.9 Dodanie defaultowych wartości dla nowych pól

**PLIK**: `apps/storefront/components/checkout/CheckoutForm.tsx`

**LOKALIZACJA**: Linie 70-88 (function getDefaultCheckoutFormData)

**ZASTĄP FRAGMENT**:
```typescript
// STARE (linie 70-88):
function getDefaultCheckoutFormData(): CheckoutFormData {
  return {
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    shippingOptionId: "",
    paymentProviderId: "",
    newsletter: false,
    wantInvoice: false,
    companyName: "",
    nip: "",
    acceptTerms: false,
    acceptRodo: false,
  };
}

// NOWE:
function getDefaultCheckoutFormData(): CheckoutFormData {
  return {
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    shippingOptionId: "",
    paymentProviderId: "",
    newsletter: false,
    wantInvoice: false,
    companyName: "",
    nip: "",
    acceptTerms: false,
    acceptRodo: false,
    turnstileToken: "",
    orderNotes: "",
  };
}
```

### 1.10 Import Turnstile w CheckoutForm

**PLIK**: `apps/storefront/components/checkout/CheckoutForm.tsx`

**LOKALIZACJA**: Linia 1-3 (na początku pliku)

**DODAJ PO**: `import { useCallback, useEffect, useRef, useState } from "react";`

```typescript
import Turnstile from "@marsidev/react-turnstile";
```

### 1.11 Turnstile Widget i Weryfikacja w Step 3

**PLIK**: `apps/storefront/components/checkout/CheckoutForm.tsx`

**LOKALIZACJA**: Znajdź Step 3 (około linia 900-910) - sekcję z PaymentSelector

**DODAJ PO**: `<PaymentSelector ... />` (około linia 910)

**PRZED**: `<div className="space-y-3 border-t border-brand-100 pt-4">` (checkboxy)

```tsx
{/* Turnstile Widget */}
<div className="rounded-lg border border-brand-200 bg-brand-50/30 p-4">
  <Turnstile
    siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
    onSuccess={(token) => updateField("turnstileToken", token)}
    onError={() => updateField("turnstileToken", "")}
    onExpire={() => updateField("turnstileToken", "")}
    theme="light"
    size="normal"
  />
</div>
```

### 1.12 Turnstile Weryfikacja w handleSubmit

**PLIK**: `apps/storefront/components/checkout/CheckoutForm.tsx`

**LOKALIZACJA**: Funkcja `handleSubmit`, linia około 429-430 (zaraz PO `const payment = formDataRef.current;`)

**DODAJ PO**: `const payment = formDataRef.current;`

**PRZED**: `try { await assertCartReadyForCheckout(cartId);`

```typescript
    // Verify Turnstile
    if (!payment.turnstileToken) {
      setSubmitError("Potwierdź, że nie jesteś robotem.");
      setSubmitting(false);
      setSubmitSlow(false);
      if (submitSlowTimerRef.current) {
        clearTimeout(submitSlowTimerRef.current);
        submitSlowTimerRef.current = null;
      }
      submittingRef.current = false;
      return;
    }

    try {
      const verifyRes = await fetch("/api/store/custom/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: payment.turnstileToken }),
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        setSubmitError("Weryfikacja nie powiodła się. Odśwież stronę i spróbuj ponownie.");
        setSubmitting(false);
        setSubmitSlow(false);
        if (submitSlowTimerRef.current) {
          clearTimeout(submitSlowTimerRef.current);
          submitSlowTimerRef.current = null;
        }
        submittingRef.current = false;
        return;
      }
    } catch (error) {
      setSubmitError("Błąd weryfikacji. Sprawdź połączenie i spróbuj ponownie.");
      setSubmitting(false);
      setSubmitSlow(false);
      if (submitSlowTimerRef.current) {
        clearTimeout(submitSlowTimerRef.current);
        submitSlowTimerRef.current = null;
      }
      submittingRef.current = false;
      return;
    }
```

---

## GRUPA 2: UX Enhancements  

*[Plan kontynuowany w następnym fragmencie aby zmieścić się w limicie]*

---

## Environment Variables

**Backend** (`apps/backend/.env`):
```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
CLOUDFLARE_TURNSTILE_SECRET_KEY=your_secret_key_here
```

**Storefront** (`apps/storefront/.env.local`):
```env
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=your_site_key_here
```

---

## UWAGI DLA IMPLEMENTACJI

1. **Kolejność implementacji**: Wykonuj zmiany w kolejności grup (1→2→3→4→5)
2. **Testowanie po grupie**: Po każdej grupie uruchom `pnpm type-check`
3. **Nie modyfikuj planu**: Ten plik jest tylko do odczytu
4. **Ścieżki są absolutne**: Używaj dokładnie tych ścieżek
5. **Sprawdzaj numery linii**: Mogą się przesuwać po edycjach
