import { defineConfig } from "orval";

export default defineConfig({
  loreforge: {
    input: "../backend/openapi.json",
    output: {
      mode: "tags-split",
      target: "src/api/endpoints",
      schemas: "src/api/model",
      client: "react-query",
      override: {
        mutator: {
          path: "src/api/mutator/customFetch.ts",
          name: "customFetch",
        },
        header: () => "/* eslint-disable */\n// @ts-nocheck\n",
      },
    },
  },
});
