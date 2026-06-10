import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignore: [".agents/**/*", ".cursor/**/*"],
  workspaces: {
    "skills/*": {
      entry: ["scripts/**/*.ts"],
    },
  },
  ignoreDependencies: [
    "@instrument-org/agent-hooks", // Used in .codex/hooks.json and .claude/settings.json hook commands
    "jscodeshift",
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
