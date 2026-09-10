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
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
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

/**
 * Shoot the page in its light theme, minus the share widget's own affordance.
 *
 * The widget draws nothing when it is told a viewer is already wrapping the
 * page, and a capture is a tile on the website rather than a page someone is
 * reading, so its pill has no business in one. Chrome takes a file and no
 * injection point, so the flag rides in on a copy: the committed file keeps the
 * bytes the widget hashes, and only the throwaway differs. These pages are
 * self-contained by rule, so moving one to a temporary directory cannot break a
 * relative path -- there are none to break.
 *
 * The scheme rides in the same way. A page follows the reader's setting, and a
 * capture has no reader: it is a tile on a website that is light, shot on
 * whatever machine happens to run it. Pinning the scheme is what makes the PNG
 * the same on a dark laptop and on a CI runner, rather than trusting a default
 * that neither of them promises.
 */
function capture(chrome: string, htmlPath: string, pngPath: string) {
  mkdirSync(dirname(pngPath), { recursive: true });
  const scratch = mkdtempSync(join(tmpdir(), "capture-"));
  // As early in the head as possible: the widget's tag is async and may run as
  // soon as it lands, so a flag set after it is a flag set too late. The style
  // is unlayered, so it wins over the skin's `color-scheme` however late the
  // skin's own block is parsed.
  const shot = join(scratch, "page.html");
  writeFileSync(
    shot,
    readFileSync(htmlPath, "utf-8").replace(
      "<head>",
      "<head>\n    <script>window.__instrumentViewer = true;</script>\n    <style>:root { color-scheme: only light }</style>",
    ),
  );
  const result = spawnSync(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      `--window-size=${WIDTH},${HEIGHT}`,
      "--virtual-time-budget=15000",
      `--screenshot=${pngPath}`,
      `file://${shot}`,
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  rmSync(scratch, { force: true, recursive: true });
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
      // Writing a blank one here would hand the checker metadata that passes
      // while saying nothing, so an example without a design note stops.
      if (!example.meta) {
        throw new Error(
          `${idea.name}/${example.name}.json is missing or not valid JSON; write the design note before capturing`,
        );
      }
      capture(chrome, example.htmlPath, example.capturePath);
      const html = readFileSync(example.htmlPath, "utf-8");
      const meta: ExampleMeta = example.meta;
      meta.html_sha256 = sha256(html);
      writeFileSync(example.metaPath, `${JSON.stringify(meta, null, 2)}\n`);
      console.log(`captured ${idea.name}/${example.name}`);
    }
  }
}

// Imported by its tests, so only run as a command.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
