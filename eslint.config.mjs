import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // This app's client components consistently use the standard
      // "fetch on mount, setState with the result" pattern (a plain
      // useEffect calling an async loader function), which is safe here —
      // every list/detail page owns its own data and there's no
      // React Compiler in use. `react-hooks/set-state-in-effect` is a very
      // new/strict rule (part of the React Compiler-aligned eslint-plugin
      // rules) that flags this idiom project-wide even when the setState
      // calls happen after an await, not synchronously during render.
      // Rewriting every data-fetching effect in the app to dodge this
      // heuristic wouldn't fix a real bug, so it's turned off deliberately
      // rather than silenced call-by-call.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
