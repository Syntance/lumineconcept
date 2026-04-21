// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";

/**
 * Flat config dla storefrontu. Next.js 16 usunął `next lint`, więc sami
 * składamy preset z pluginów: recommended TS + hooks + core-web-vitals.
 * Minimum wiedzy potrzebnej w CI — reszta wyłapie to type-check.
 */
export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      ".turbo/**",
      "next-env.d.ts",
      "tsconfig.tsbuildinfo",
      // Raporty Playwrighta — generowane artefakty, nic do lintowania.
      "playwright-report/**",
      "test-results/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    plugins: {
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Zestawy z pluginów — przepisane ręcznie, bo w flat config nie da się
      // ich wziąć przez `extends`.
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // Nasze własne decyzje: w produkcyjnym kodzie nie tolerujemy console,
      // ale `warn`/`error` są ok (często używamy jako logger).
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // `no-explicit-any` jest w bazie `@typescript-eslint/recommended` jako warn —
      // mamy jeszcze parę `as any`, a głównym stróżem typowania jest tsc,
      // więc zostawiamy jako ostrzeżenie.
      "@typescript-eslint/no-explicit-any": "warn",

      // Wzorzec: `_x` sygnalizuje celowo nieużywany parametr.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Next 16 czasem pod `<Link>` oczekuje `passHref`, czasem nie —
      // ogólnie wolimy nie walczyć z tą regułą.
      "@next/next/no-html-link-for-pages": "off",

      /**
       * React Hooks v7 doniósł „agresywne" reguły, które w zastanym kodzie
       * generują lawinę błędów (setState w efekcie, ref w renderze, itd.).
       * Nie stać nas na refactor wszystkiego na raz — degradujemy je do
       * ostrzeżeń, żeby nie blokowały CI, ale nadal widać je w IDE.
       */
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/rules-of-hooks": "error",

      // `<img>` zamiast `next/image` — raportujemy, ale nie blokujemy
      // (mamy lokalne svg, watermarki i inne miejsca, gdzie `next/image`
      // nie ma sensu).
      "@next/next/no-img-element": "warn",

      // Escapy w regexach nie robią krzywdy — dopóki kod działa, nie bawimy
      // się w ich wygładzanie.
      "no-useless-escape": "off",
    },
  },

  // Configi (next.config.ts, sentry configi) mają własny język — nie
  // wymagamy od nich pełnego typowania.
  {
    files: ["next.config.ts", "instrumentation*.ts", "lib/sentry/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Testy — luźniejsze reguły: console w diagnostyce, `any` w mockach,
  // reguły React Hooks nie mają sensu poza komponentami runtime'u.
  {
    files: ["tests/**/*.{ts,tsx}", "tests-e2e/**/*.ts"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/rules-of-hooks": "off",
    },
  },
];
