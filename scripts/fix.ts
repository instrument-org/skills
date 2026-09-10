// Applies the automatic fixes that reach every file rather than only the ones a
// session edited.
//
// The editor-agent format hook rewrites what it sees go through an edit tool, so
// anything written another way -- a heredoc, `sed -i`, a generator -- reaches a
// commit unformatted. Formatting is also the one check CI does not gate on, so
// nothing downstream catches it either. This closes that gap in a couple of
// seconds over the whole tree.

import { spawnSync } from "node:child_process";

const PASSES = [
  // Spelling first, so the format pass below sees corrected text.
  { command: "pnpm fix:spelling", label: "spelling" },
  { command: "pnpm fix:format", label: "format" },
];

// pnpm resolves through a shim on Windows, so these go through a shell.
function run({ command, label }: { command: string; label: string }): boolean {
  console.log(`\n> ${label}: ${command}`);
  const { status } = spawnSync(command, { shell: true, stdio: "inherit" });
  return status === 0;
}

const unresolved = PASSES.filter((pass) => !run(pass)).map(
  (pass) => pass.label,
);

if (unresolved.length > 0) {
  console.error(
    `\nStill reporting problems after fixing: ${unresolved.join(", ")}. Resolve what is printed above by hand.`,
  );
  process.exit(1);
}

console.log("\nEverything fixable is fixed.");
