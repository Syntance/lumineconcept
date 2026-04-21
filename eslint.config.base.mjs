// Wspólna baza flat-config dla wewnętrznych paczek (@lumine/types, @lumine/ui).
// Storefront i backend mają własne configi — trzymamy je osobno, bo tam
// dochodzą reguły React/Next.js i specyfika Medusy.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/**", ".turbo/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
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
