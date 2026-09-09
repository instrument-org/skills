// Rewrites the /* skin:start */ … /* skin:end */ block in every starter and
// example from skin/theme.css, which check-ideas.ts fails the build over when
// a copy has drifted. Run by `pnpm fix:skin` after editing the skin, then
// `pnpm capture` and `pnpm fix:format`, since the HTML each example was
// captured from has changed.

import { readFileSync, writeFileSync } from "node:fs";
import { listIdeas, normalizedSkin, skinBlockOf } from "./ideas.ts";

const START = "/* skin:start */";
const END = "/* skin:end */";

const skin = readFileSync("skin/theme.css", "utf-8").trimEnd();
const wanted = normalizedSkin();
const files = listIdeas().flatMap((idea) => [
  idea.starterPath,
  ...idea.examples.map((example) => example.htmlPath),
]);

let changed = 0;
for (const file of files) {
  const html = readFileSync(file, "utf-8");
  const start = html.indexOf(START);
  const end = html.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    console.error(`no skin block: ${file}`);
    process.exitCode = 1;
    continue;
  }
  // Drift is what check-ideas.ts calls drift, so a formatter having rewrapped a
  // block that already says the right thing is left alone and this stays a
  // no-op on a clean tree.
  if (skinBlockOf(html) === wanted) continue;
  // The indentation the block already sits at, so the diff stays inside it.
  const indent = html.slice(html.lastIndexOf("\n", start) + 1, start);
  const body = skin
    .split("\n")
    .map((line) => (line.trim() ? indent + line : ""))
    .join("\n");
  const next = `${html.slice(0, start)}${START}\n${body}\n${indent}${html.slice(end)}`;
  if (next !== html) {
    writeFileSync(file, next);
    changed += 1;
  }
}

console.log(`${changed} of ${files.length} files updated`);
