#!/usr/bin/env node
// node tools/page-lab/build.mjs [name ...]   (pnpm page-lab:build)
// Turns each lab sample into the page an agent would actually ship: drops the
// lab's live links, runs the repo's page.mjs (which embeds foundation.css and
// foundation.js and checks the page), and writes it to tools/page-lab/built/.
// Run it after a stylesheet change to see whether the samples still pass.
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  existsSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const pageMjs = join(here, "../../skills/instrument-page/page.mjs");
const samples = join(here, "samples");
const built = join(here, "built");
mkdirSync(built, { recursive: true });

const names = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(samples)
      .filter((f) => f.endsWith(".html"))
      .map((f) => f.replace(/\.html$/, ""));

let failed = 0;
for (const name of names) {
  const html = readFileSync(join(samples, `${name}.html`), "utf8");
  const out = join(built, `${name}.html`);
  writeFileSync(out, html.replace(/<!-- lab -->[\s\S]*?<!-- \/lab -->\n?/, ""));
  const inputs = join(samples, "inputs", `${name}.md`);
  const args = [
    pageMjs,
    out,
    ...(existsSync(inputs) ? ["--inputs", inputs] : []),
  ];
  const run = spawnSync(process.execPath, args, {
    cwd: built,
    encoding: "utf8",
  });
  if (run.status !== 0) failed++;
  console.log(`\n${name}\n${(run.stdout + run.stderr).trim()}`);
}
process.exit(failed ? 1 : 0);
