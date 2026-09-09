// Renders every example of an idea with headless Chrome and writes the PNG the
// website shows on its tiles, plus the HTML's hash into the example's sidecar
// so check-ideas.ts can tell when a capture is stale.
//
//   pnpm capture                    # every idea
//   pnpm capture recommendation-guide
//
// Chrome is found at CHROME_PATH, then the usual locations. Captures are the
// top of the page at a laptop's content width, portrait.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { listIdeas, readIdea, sha256, type ExampleMeta } from "./ideas.ts";

// Portrait, two by three: the pages read at a narrow measure and carry their
// interest down the fold, so a tall crop shows more of them than a wide one.
const WIDTH = 1024;
const HEIGHT = 1536;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter((path): path is string => Boolean(path));

function findChrome(): string {
  const found = CHROME_CANDIDATES.find((path) => existsSync(path));
  if (!found) {
    throw new Error(
      `No Chrome found. Set CHROME_PATH or install Google Chrome (tried ${CHROME_CANDIDATES.join(", ")}).`,
    );
  }
  return found;
}

function capture(chrome: string, htmlPath: string, pngPath: string) {
  mkdirSync(dirname(pngPath), { recursive: true });
  const result = spawnSync(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      `--window-size=${WIDTH},${HEIGHT}`,
      "--virtual-time-budget=15000",
      `--screenshot=${pngPath}`,
      `file://${htmlPath}`,
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  if (result.status !== 0 || !existsSync(pngPath)) {
    throw new Error(
      `Chrome failed on ${htmlPath}: ${result.stderr?.toString() ?? "no output"}`,
    );
  }
}

function main() {
  const only = process.argv[2];
  const ideas = only ? [readIdea(only)] : listIdeas();
  const chrome = findChrome();
  for (const idea of ideas) {
    for (const example of idea.examples) {
      capture(chrome, example.htmlPath, example.capturePath);
      const html = readFileSync(example.htmlPath, "utf-8");
      const meta: ExampleMeta = example.meta ?? {
        title: example.name,
        variant: "",
        prompt: "",
        model: "",
        note: "",
      };
      meta.html_sha256 = sha256(html);
      writeFileSync(example.metaPath, `${JSON.stringify(meta, null, 2)}\n`);
      console.log(`captured ${idea.name}/${example.name}`);
    }
  }
}

main();
