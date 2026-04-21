// Minimal flat config dla backendu Medusy. Trzymamy to celowo łagodnie —
// Medusa w paru miejscach wymusza `any` (typy modułów, IoC container),
// a migracje generuje CLI. Chcemy wychwytywać realne bugi: unused vars,
// nieprawidłowe importy, literówki.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      ".medusa/**",
      ".turbo/**",
      "node_modules/**",
      // Pliki generowane przez Medusa CLI — nie edytujemy ich ręcznie.
      "src/migrations/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];
