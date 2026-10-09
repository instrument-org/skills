#!/usr/bin/env node
// node tools/page-check/check.mjs page.html [more.html] [--inputs <files>] [--no-build] [--out <dir>]
//
// The full instrument-page check, for evals and development: page.mjs's build
// and static check (skipped with --no-build), then the skill's own
// lib/probe.js run in headless Chromium, the same script an agent runs in its
// browser tool, then screenshots at 1280 (full page), the 1104x590 link
// preview and a 390 phone, written beside each page or into --out.
// Exit 0 pass, 1 FAIL, 2 bad command, 3 Chromium could not run.
//
// Never installed with a skill: skills/ starts no process and opens no
// browser, and nothing there imports this folder.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { main as build } from "../../skills/instrument-page/lib/check.mjs";
import { ChromeError, launch } from "./chrome.mjs";

const PROBE = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../skills/instrument-page/lib/probe.js",
  ),
  "utf8",
);

const argv = process.argv.slice(2);
const files = [];
const rest = [];
let out = null,
  doBuild = true;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--no-build") doBuild = false;
  else if (a === "--out") out = resolve(argv[++i] ?? ".");
  else if (a === "--inputs") {
    rest.push(a);
    while (argv[i + 1] && !argv[i + 1].startsWith("--")) rest.push(argv[++i]);
  } else if (a.startsWith("--")) {
    console.log(`unknown flag ${a}`);
    process.exit(2);
  } else files.push(a);
}
if (!files.length) {
  console.log(
    "usage: node tools/page-check/check.mjs page.html [more.html] [--inputs <files>] [--no-build] [--out <dir>]",
  );
  process.exit(2);
}

let exit = 0;
if (doBuild) {
  const code = await build([...files, ...rest], {
    cmd: "node skills/instrument-page/page.mjs",
  });
  if (code === 2) process.exit(2);
  if (code) exit = 1;
}

let chrome;
try {
  chrome = await launch();
} catch (e) {
  console.log(
    `FAIL chromium: ${e instanceof ChromeError ? "" : "unexpected error: "}${e.message}`,
  );
  process.exit(3);
}
console.error(`page-check: measuring in ${chrome.bin}`);
try {
  const P = chrome.page;
  for (const f of files) {
    const path = resolve(f);
    const url = pathToFileURL(path).href;
    const stem = join(
      out ?? dirname(path),
      basename(path).replace(/\.html?$/i, ""),
    );
    if (out) mkdirSync(out, { recursive: true });
    await P.viewport(1280, 900);
    await P.navigate(url);
    const lines = await P.evaluate(PROBE, 120000);
    console.log(
      `${basename(path)} probe:\n${String(lines)
        .split("\n")
        .map((l) => `  ${l}`)
        .join("\n")}`,
    );
    if (/^FAIL /m.test(lines)) exit = 1;

    const shots = [];
    const docH = await P.evaluate("document.documentElement.scrollHeight");
    const fullH = Math.min(docH, 4000);
    await P.viewport(1280, fullH);
    writeFileSync(
      `${stem}.desktop.png`,
      await P.screenshot({ width: 1280, height: fullH }),
    );
    shots.push(`${stem}.desktop.png`);
    await P.viewport(1104, 590);
    await P.navigate(url);
    writeFileSync(
      `${stem}.preview.png`,
      await P.screenshot({ width: 1104, height: 590 }),
    );
    shots.push(`${stem}.preview.png`);
    await P.viewport(390, 844, { mobile: true });
    await P.navigate(url);
    const ph = Math.min(
      await P.evaluate("document.documentElement.scrollHeight"),
      5000,
    );
    if (ph !== 844) await P.viewport(390, ph, { mobile: true });
    writeFileSync(
      `${stem}.phone.png`,
      await P.screenshot({ width: 390, height: ph }),
    );
    shots.push(`${stem}.phone.png`);
    console.log(`  pictures: ${shots.join(", ")}`);
  }
} catch (e) {
  console.log(`FAIL chromium: ${e.message}`);
  exit = 3;
} finally {
  chrome.close();
}
process.exit(exit);
