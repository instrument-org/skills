import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignore: [".agents/**/*", ".cursor/**/*"],
  workspaces: {
    "skills/*": {
      entry: ["scripts/**/*.ts"],
    },
  },
  ignoreDependencies: ["jscodeshift"],
  compilers: {
    css: (text: string) =>
      [...text.matchAll(/(?<=@)(import|plugin)[^;]+/g)]
        .join("\n")
        .replace("plugin", "import"),
  },
  treatConfigHintsAsErrors: false,
};

export default config;
