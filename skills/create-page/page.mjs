#!/usr/bin/env node
// node <skill>/page.mjs page.html [more.html] --inputs <input files> request.md
// Builds each page in place (stylesheet, fonts, behaviors), checks it in
// Chrome, writes <name>.desktop.png, <name>.preview.png, <name>.phone.png.
// Prints only FAIL lines and one closing line. Internals live in lib/.
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { main } from "./lib/check.mjs";

const typed = resolve(process.argv[1] || fileURLToPath(import.meta.url));
let self = relative(process.cwd(), typed) || "page.mjs";
if (self.startsWith(`..${sep}..${sep}..`)) self = typed;
const cmd = `node ${/\s/.test(self) ? `"${self}"` : self}`;
process.env.PAGE_CMD = cmd;
process.exit(await main(process.argv.slice(2), { cmd }));
