#!/usr/bin/env node
// node <skill>/look.mjs page.html [more.html]
// Renders each wireframe page in headless Chrome at 1280 wide and on a 390
// phone, writes <name>.desktop.png and <name>.phone.png beside it, and prints
// a FAIL line for every script error, since a page whose module script throws
// draws no frames. Exit 0 rendered, 1 script errors, 2 bad command, 3 Chrome
// could not render (NOT looked at).
import { existsSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { launch } from "./chrome.mjs";

const files = process.argv.slice(2);
if (!files.length) {
  console.log("usage: node <skill>/look.mjs page.html [more.html]");
  process.exit(2);
}
for (const f of files) {
  if (!existsSync(f)) {
    console.log(
      `FAIL no-file: ${f}: does not exist -> check the path (run from the task folder)`,
    );
    process.exit(2);
  }
}

let chrome;
try {
  chrome = await launch();
} catch (e) {
  console.log(
    `FAIL chrome: ${e.message} -> nothing was rendered. If Chrome is installed elsewhere, set CHROME=/path/to/chrome and rerun; if you cannot, tell the user plainly that the page is unchecked.`,
  );
  process.exit(3);
}
let exit = 0;
try {
  const P = chrome.page;
  const errors = [];
  P.on("Runtime.exceptionThrown", (p) =>
    errors.push(
      p.exceptionDetails.exception?.description?.split("\n")[0] ??
        p.exceptionDetails.text,
    ),
  );
  for (const f of files) {
    const path = resolve(f);
    const stem = path.replace(/\.html?$/i, "");
    const shots = [];
    errors.length = 0;
    for (const [w, h, name, mobile] of [
      [1280, 900, "desktop", false],
      [390, 844, "phone", true],
    ]) {
      await P.viewport(w, h, { mobile });
      await P.navigate(pathToFileURL(path).href);
      // The frames scale once the Tailwind build has painted them.
      await new Promise((r) => setTimeout(r, 800));
      const full = Math.min(
        await P.evaluate("document.documentElement.scrollHeight"),
        mobile ? 5000 : 4000,
      );
      if (full !== h) await P.viewport(w, full, { mobile });
      writeFileSync(
        `${stem}.${name}.png`,
        await P.screenshot({ width: w, height: full }),
      );
      shots.push(`${basename(stem)}.${name}.png`);
    }
    for (const e of new Set(errors))
      console.log(
        `FAIL script: ${basename(path)}: ${e} -> fix the page's script; a module script that throws draws no frames`,
      );
    console.log(
      `${basename(path)}: ${errors.length ? "script errors above" : "rendered"}. Pictures: ${shots.join(", ")}. Look at them before you hand the page over.`,
    );
    if (errors.length) exit = 1;
  }
} catch (e) {
  console.log(
    `FAIL chrome: ${e.message} -> the page was NOT looked at. Run once more; if it fails again, tell the user plainly.`,
  );
  exit = 3;
} finally {
  chrome.close();
}
process.exit(exit);
