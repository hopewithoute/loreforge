import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
import tailwindCanonical from "eslint-plugin-tailwind-canonical-classes";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "src/api/**", "orval.config.ts"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "jsx-a11y": jsxA11y,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "tailwind-canonical-classes": tailwindCanonical,
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      ...reactHooks.configs.flat.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports", prefer: "type-imports" },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "tailwind-canonical-classes/tailwind-canonical-classes": [
        "warn",
        { cssPath: "./src/app/styles/global.css" },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*"],
              message: "Use absolute imports (@/...) instead of relative paths (../).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...eslint.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.node,
      sourceType: "module",
    },
  },
  eslintConfigPrettier,
);
