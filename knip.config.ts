import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    "skills/*": {
      entry: ["scripts/**/*.ts"],
    },
  },
  // Read by scripts/ideas.ts as a file, not imported.
  ignore: ["skin/theme.css"],
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
