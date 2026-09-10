// Carries the starter's shared regions out to every example, and the skin into
// the starter on the way. The starter owns everything a page does not choose
// for itself: the icon, the share widget, the type, the framework, the skin,
// the page behavior, the link-icon script.
//
//   pnpm fix:shell                  # every template
//   pnpm fix:shell comparison-matrix
//
// The loop for any change that reaches every page is: edit starter.html, run
// this, run `pnpm capture`, since the HTML each example was shot from moved.
// `pnpm check:ideas` fails when an example has drifted from the starter, which
// is what makes this the way to change a page rather than one way of several.

import { readFileSync, writeFileSync } from "node:fs";
import {
  listIdeas,
  normalizedSkin,
  pageShell,
  readIdea,
  SHELL_END,
  SHELL_START,
  shellBlocksOf,
  skinBlockOf,
  STARTER_PATH,
} from "./ideas.ts";

const SKIN_START = "/* skin:start */";
const SKIN_END = "/* skin:end */";

/** The skin block in the starter, refreshed from skin/theme.css. */
function refreshStarterSkin(): boolean {
  const html = readFileSync(STARTER_PATH, "utf-8");
  if (skinBlockOf(html) === normalizedSkin()) return false;

  const start = html.indexOf(SKIN_START);
  const end = html.indexOf(SKIN_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`starter.html has no ${SKIN_START} … ${SKIN_END} block`);
  }
  // The indentation the block already sits at, so the diff stays inside it.
  const indent = html.slice(html.lastIndexOf("\n", start) + 1, start);
  const body = readFileSync("skin/theme.css", "utf-8")
    .trimEnd()
    .split("\n")
    .map((line) => (line.trim() ? indent + line : ""))
    .join("\n");
  writeFileSync(
    STARTER_PATH,
    `${html.slice(0, start)}${SKIN_START}\n${body}\n${indent}${html.slice(end)}`,
  );
  return true;
}

/** An example rewritten with the starter's regions in place of its own. */
function withShell(html: string, shell: string[]): string {
  const found = shellBlocksOf(html);
  if (found.length !== shell.length) {
    throw new Error(
      `has ${found.length} ${SHELL_START} … ${SHELL_END} pair(s) where the starter has ${shell.length}. Markers are how a region is found, so add or remove pairs by hand before running this.`,
    );
  }

  let out = "";
  let from = 0;
  for (const block of shell) {
    const start = html.indexOf(SHELL_START, from);
    const end = html.indexOf(SHELL_END, start);
    out += html.slice(from, start + SHELL_START.length) + block;
    from = end;
  }
  return out + html.slice(from);
}

function main() {
  const only = process.argv[2];
  const ideas = only ? [readIdea(only)] : listIdeas();
  if (ideas.length === 0) {
    console.error(`No template named "${only}"`);
    process.exit(1);
  }

  // Before the copy, so a skin edit reaches the examples in the same run.
  if (refreshStarterSkin()) console.log("starter.html: skin refreshed");
  const shell = pageShell();

  let changed = 0;
  let total = 0;
  const failed: string[] = [];
  for (const idea of ideas) {
    for (const example of idea.examples) {
      total += 1;
      const label = `${idea.name}/${example.name}`;
      const html = readFileSync(example.htmlPath, "utf-8");
      let next: string;
      try {
        next = withShell(html, shell);
      } catch (error) {
        failed.push(`${label}: ${(error as Error).message}`);
        continue;
      }
      if (next === html) continue;
      writeFileSync(example.htmlPath, next);
      changed += 1;
      console.log(`updated ${label}`);
    }
  }

  console.log(
    `\n${changed} of ${total} example(s) updated from ${shell.length} shared region(s)`,
  );
  if (changed > 0) {
    console.log("Run `pnpm capture` so the captures match the HTML again.");
  }
  if (failed.length > 0) {
    console.error(`\n${failed.length} could not be updated:`);
    for (const line of failed) console.error(`  ${line}`);
    process.exit(1);
  }
}

main();
