import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    "skills/*": {
      entry: ["scripts/**/*.ts"],
    },
  },
  ignore: [
    // Read by scripts/ideas.ts as a file, not imported.
    "skin/theme.css",
    // The kits a create-page template ships for an agent to import from a
    // script of its own, in the consuming project. Nothing in this repo imports
    // them, which is the point of them, and create-page carries no package.json
    // for the workspace entry patterns above to hang off.
    "skills/create-page/templates/*/scripts/**",
  ],
  ignoreBinaries: [
    "actionlint", // Used by scripts/check-actions.ts
    "uv",
    "python3",
    "powershell.exe",
  ],
  // knip 6 reports exports consumed only within their defining file (e.g. the
  // idea types beside the reader that uses them). knip 5 did not; keep that
  // scope.
  ignoreExportsUsedInFile: true,
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
