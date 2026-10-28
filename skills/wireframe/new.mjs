#!/usr/bin/env node
// node <skill>/new.mjs <out.html> "Part: what this take tries" [--prototype]
// Writes a new wireframe page: this skill's shell.html with main.html inside
// <main>, the name in the title and the h1. Then edit the `states` array
// between "// ---- the frames" and "// ---- render" in the page, and delete
// the helpers you do not call. With --prototype it writes one live screen
// from prototype.html instead: edit `SCREEN` under "// ---- the screen". Run from inside a git repository, it names the
// repository in an `instrument:repo` meta. Refuses to overwrite an existing file.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { repoName, tagRepo } from "./repo.mjs";

const args = process.argv.slice(2);
const prototype = args.includes("--prototype");
const [out, name = "TITLE"] = args.filter((a) => a !== "--prototype");
if (!out) {
  console.log(
    'usage: node <skill>/new.mjs <out.html> "Part: what this take tries" [--prototype]',
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
const main = readFileSync(join(here, prototype ? "prototype.html" : "main.html"), "utf8").replace(
  ">TITLE</h1>",
  () => `>${esc(name)}</h1>`,
);
const page = shell
  .replace("<title>TITLE</title>", () => `<title>${esc(name)}</title>`)
  .replace('content="TEMPLATE@1"', () => 'content="wireframe@1"')
  .replace(
    /<main class="[^"]*">[\s\S]*?<\/main>/,
    () =>
      prototype
        ? `<main class="flex h-dvh flex-col">\n${main}\n    </main>`
        : `<main class="flex min-h-dvh flex-col px-4 pb-8">\n${main}\n    </main>`,
  );
const repo = repoName(process.cwd());
writeFileSync(out, tagRepo(page, repo));
console.log(
  prototype
    ? `${out}: written. Draw the screen in its \`SCREEN\`, then open it in your browser tool and check its errors and a screenshot.`
    : `${out}: written. Draw the frames in its \`states\` array, then open it in your browser tool and check its errors and a screenshot.`,
);
if (!repo)
  console.warn("No repository found here, so this page has no repo tag.");
