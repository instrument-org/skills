import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    "skills/*": {
      entry: ["scripts/**/*.ts"],
    },
  },
  ignore: [
    // Scripts instrument-page and wireframe ship for an agent to run, or import
    // from a script of its own, in the consuming project: the page builder and
    // its internals, the kits' drawing libraries, and the share scripts.
    // Nothing in this repo imports most of them, which is the point of them,
    // and neither skill carries a package.json for the workspace entry
    // patterns above to hang off.
    "skills/instrument-page/**/*.mjs",
    // The stylesheet and behaviors page.mjs reads as files and writes into a
    // page, and the layout probe an agent's browser tool evaluates.
    "skills/instrument-page/lib/foundation.*",
    "skills/instrument-page/lib/probe.js",
    "skills/wireframe/*.mjs",
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
