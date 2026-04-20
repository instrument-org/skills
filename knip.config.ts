import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    "skills/*": {
      entry: ["scripts/**/*.ts"],
    },
    "templates/basic": {
      entry: [
        "src/server/index.ts",
        "src/client/main.tsx",
        "src/client/components/demo/*.tsx",
      ],
    },
  },
  ignoreDependencies: [
    "jscodeshift",
    "eslint-config-next",
    "postcss",
    "vue",
    "vue-router",
    "@angular/forms",
  ],
  compilers: {
    css: (text: string) =>
      [...text.matchAll(/(?<=@)(import|plugin)[^;]+/g)]
        .join("\n")
        .replace("plugin", "import"),
  },
  treatConfigHintsAsErrors: false,
};

export default config;
