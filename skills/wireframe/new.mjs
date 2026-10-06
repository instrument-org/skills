#!/usr/bin/env node
// node <skill>/new.mjs <out.html> "Part: what this take tries"
// Writes a new wireframe page: this skill's shell.html with main.html inside
// <main>, the name in the title and the h1. Then edit the `states` array
// between "// ---- the frames" and "// ---- render" in the page, and delete
// the helpers you do not call. Run from inside a git repository, it names the
// repository in an `instrument:repo` meta. Refuses to overwrite an existing file.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { repoName, tagRepo } from "./repo.mjs";

const [out, name = "TITLE"] = process.argv.slice(2);
if (!out) {
  console.log(
    'usage: node <skill>/new.mjs <out.html> "Part: what this take tries"',
  );
  process.exit(2);
}
if (existsSync(out)) {
  console.log(`${out} already exists; edit it, or pick another name`);
  process.exit(2);
}
const here = dirname(fileURLToPath(import.meta.url));
const shell = readFileSync(join(here, "shell.html"), "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
// A function, never a string, as the replacement: main.html's own script holds
// `$&` and `$$`, which a replacement string reads as patterns.
const main = readFileSync(join(here, "main.html"), "utf8").replace(
  ">TITLE</h1>",
  () => `>${esc(name)}</h1>`,
);
const page = shell
  .replace("<title>TITLE</title>", () => `<title>${esc(name)}</title>`)
  .replace('content="TEMPLATE@1"', () => 'content="wireframe@1"')
  .replace(
    /<main class="[^"]*">[\s\S]*?<\/main>/,
    () =>
      `<main class="flex min-h-dvh flex-col px-4 pb-8 sm:px-6">\n${main}\n    </main>`,
  );
writeFileSync(out, tagRepo(page, repoName(process.cwd())));
console.log(
  `${out}: written. Draw the frames in its \`states\` array, then: node <skill>/look.mjs ${out}`,
);
