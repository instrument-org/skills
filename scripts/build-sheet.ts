// Compiles the floor stylesheet into the starter, so a page paints without
// running a script.
//
//   pnpm build:sheet          # write the block
//   pnpm build:sheet --check  # fail when it has drifted
//
// A page carries its Tailwind as source: the skin in a
// <style type="text/tailwindcss">, and the browser build that compiles it
// against the classes on the page once it has downloaded. Where that script
// cannot run, nothing paints: a chat viewer that strips scripts, an artifact
// host whose policy refuses the CDN, a mail preview, a file opened offline.
// The reader gets the markup in the browser's default serif, which is the one
// outcome every other rule in this skill is written to avoid.
//
// So the sheet is built here too, once, over the starter and every template's
// slots and finished examples, and inlined ahead of the script tag. That is
// both what an agent starts from and what it reads before writing, so a page
// keeps its look with scripts off; a class the agent invents past that
// vocabulary is still the browser build's to resolve, and the script stays for
// exactly that. The two are the same compiler on the same input, so the later
// sheet lands on the earlier one rather than fighting it, and a page whose
// scripts do run computes identically either way.
//
// The loop for any change that reaches every page: edit starter.html, a
// template's main.html or an example, run this, then `pnpm fix:shell` and
// `pnpm capture`.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "tailwindcss";

import { listIdeas, STARTER_PATH } from "./ideas.ts";

const SHEET_START = "<!-- sheet:start -->";
const SHEET_END = "<!-- sheet:end -->";

/** The blocks the browser build reads its input from, in document order. */
const SOURCE_SHEETS =
  /<style\s[^>]*type\s*=\s*["']text\/tailwindcss["'][^>]*>([\s\S]*?)<\/style>/gi;

/**
 * The core stylesheets `@import "tailwindcss"` and its parts resolve to, read
 * out of the installed package. The version there is the one the starter pins
 * its browser build to, so the sheet built here is the sheet a reader whose
 * scripts do run would have been handed.
 */
const TAILWIND_DIR = join(
  fileURLToPath(import.meta.resolve("tailwindcss/package.json")),
  "..",
);
const part = (file: string) => readFileSync(join(TAILWIND_DIR, file), "utf-8");
const CORE: Record<string, string> = {
  "./preflight.css": part("preflight.css"),
  "./theme.css": part("theme.css"),
  "./utilities.css": part("utilities.css"),
  tailwindcss: part("index.css"),
};

/**
 * Every token in the sources that might be a class. Class attributes are read
 * exactly, split on whitespace alone, so an arbitrary value carrying a quote
 * survives. The rest is split on quotes as well, which finds a class a script
 * writes into markup it builds. The compiler discards whatever is not a class,
 * so being generous here costs time and not correctness.
 */
function candidatesIn(html: string): string[] {
  const found = new Set<string>();
  for (const match of html.matchAll(/\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    for (const token of (match[1] ?? match[2] ?? "").split(/\s+/)) {
      if (token) found.add(token);
    }
  }
  for (const token of html.split(/[\s"'`]+/)) if (token) found.add(token);
  return [...found];
}

/** What the browser build would have built for the starter and the templates. */
async function buildSheet(starter: string): Promise<string> {
  let input = "";
  for (const match of starter.matchAll(SOURCE_SHEETS)) input += `${match[1] ?? ""}\n`;
  // The browser build's default for a page that does not import for itself.
  if (!input.includes("@import")) input = `@import "tailwindcss";${input}`;
  const compiler = await compile(input, {
    base: "/",
    loadModule: () =>
      Promise.reject(new Error("plugins and config files are not supported")),
    loadStylesheet: (id, base) => {
      const content = CORE[id];
      return content === undefined
        ? Promise.reject(new Error(`no stylesheet for @import "${id}"`))
        : Promise.resolve({ base, content, path: `virtual:${id}` });
    },
  });
  // The examples as well as the slots. A template's main.html is a skeleton,
  // and the classes that place a timeline's spine live in the finished pages
  // rather than in it: over the skeletons alone, 34 of the 120 classes on one
  // example were absent, among them every one that positions the spine, which
  // is what broke when the framework was refused. They are also the pages an
  // agent reads two of before writing, so this is the vocabulary it imitates.
  const sources = listIdeas().flatMap((idea) => [
    readFileSync(join(idea.dir, "main.html"), "utf-8"),
    ...idea.examples.map((example) => readFileSync(example.htmlPath, "utf-8")),
  ]);
  return compiler.build(candidatesIn([starter, ...sources].join("\n")));
}

const starter = readFileSync(STARTER_PATH, "utf-8");
const start = starter.indexOf(SHEET_START);
const end = starter.indexOf(SHEET_END);
if (start === -1 || end === -1 || end < start) {
  throw new Error(`starter.html has no ${SHEET_START} … ${SHEET_END} pair`);
}

const css = await buildSheet(starter);
// The sheet is raw text to the parser, ended by nothing but its own close tag,
// so a sheet that carries one cannot be inlined.
if (/<\/style/i.test(css)) throw new Error("compiled sheet carries a close tag");

const indent = starter.slice(starter.lastIndexOf("\n", start) + 1, start);
const block = `${SHEET_START}\n${indent}<style data-tailwind="floor">\n${css}${indent}</style>\n${indent}`;
const next = starter.slice(0, start) + block + starter.slice(end);

if (next === starter) process.exit(0);
if (process.argv.includes("--check")) {
  console.error("starter.html floor sheet has drifted; run `pnpm build:sheet`");
  process.exit(1);
}
writeFileSync(STARTER_PATH, next);
console.log(`floor sheet: ${(css.length / 1024).toFixed(1)} KB`);
