#!/usr/bin/env node
// node <skill>/build.mjs <part.frames.html> <page.html> [<name.json>...]
// Builds a wireframe page from a part of frames (SKILL.md, "The part") with this skill's
// neutral kit and pieces. Runs every script of the part in Node first, the way the page
// will, and prints one FAIL line per problem with the part's line number; the page is
// written either way, with an error tile where a frame failed, and the exit code is 1
// when anything did. Snapshots named after the page (snapshots.md) go into it, and a
// rebuild keeps the ones the page it replaces already has. A project with its own kit
// builds with that kit's build instead.
import fs from "node:fs";
import path from "node:path";

import { addSnapshots, readSnapshot, readStore } from "./add-snapshot.mjs";
import { SKILL, assemble, evaluate, frameList, neutralKits, runtimeSource, snapStub } from "./frames.mjs";

const [partPath, outPath, ...snapFiles] = process.argv.slice(2);
if (!partPath || !outPath) {
  console.log("usage: node <skill>/build.mjs <part.frames.html> <page.html> [<name.json>...]");
  process.exit(2);
}
const part = fs.readFileSync(partPath, "utf8");
const runtime = runtimeSource(neutralKits());

const added = {};
for (const file of snapFiles) added[path.basename(file, path.extname(file))] = readSnapshot(fs.readFileSync(file, "utf8"));
const store = addSnapshots(fs.existsSync(outPath) ? readStore(fs.readFileSync(outPath, "utf8")) : { sheets: {}, pages: {} }, added);
const { snap, used } = snapStub(store);
const result = evaluate(part, { runtime, file: path.basename(partPath), lend: { snap } });
let head = "";
if (Object.keys(store.pages).length) {
  // Before the runtime, since a frame's snap() runs while the page is read.
  const json = JSON.stringify(store).replace(/</g, "\\u003c");
  head = `<script type="application/json" id="wireframe-snapshots">${json}</script>\n<script id="wireframe-snapshot-frames">${fs.readFileSync(path.join(SKILL, "snapshot-frames.js"), "utf8")}</script>\n`;
}
fs.writeFileSync(outPath, assemble({ part, runtime, meta: result.meta, head, repoDir: process.cwd() }));
// The frames by label, so a frame the reader names is a block to go to.
for (const line of frameList(result.index)) console.log(line);
for (const f of result.fails) console.log(`FAIL ${partPath}: ${f}`);
for (const n of result.notes) console.log(`${partPath}: ${n}`);
for (const [name, s] of Object.entries(added)) for (const note of s.notes) console.log(`snap("${name}"): ${note}`);
const unused = Object.keys(store.pages).filter((n) => !used.has(n));
const drawn = result.states.filter((s) => !s.error).length;
const snaps = Object.keys(store.pages).length;
console.log(
  `${outPath}: ${drawn} of ${result.states.length} frames drawn${result.fails.length ? `, ${result.fails.length} problems` : ""}, ${Math.round(fs.statSync(outPath).size / 1024)} KB` +
    (snaps ? `; ${snaps} snapshots${unused.length ? `, ${unused.join(", ")} drawn by no frame (add-snapshot.mjs --remove drops one)` : ""}` : ""),
);
process.exit(result.fails.length ? 1 : 0);
