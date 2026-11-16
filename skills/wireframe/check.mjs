#!/usr/bin/env node
// node <skill>/check.mjs <page.html> [more.html]
// Checks a wireframe page without a browser, in two steps, and prints one
// FAIL line per problem with the page's own line number.
//
// 1. Parse: every script written into the page is parsed the way the browser
//    parses it. A script that fails to parse, such as one declaring a name
//    twice, runs none of itself, and the page draws nothing.
// 2. Draw: the frames (everything above "// ---- render") run in Node, and
//    each frame's drawing must come out as HTML, without the text
//    `undefined`, `NaN` or `[object Object]` where a value went missing. A
//    page whose frames reach for the browser (document, window) or for a name
//    another script on the page defines is skipped here with a line saying
//    so: open that page in a browser tool instead.
//
// Neither step sees layout, styles or how a frame looks; a screenshot does.
// Exit 0 when nothing failed, 1 when something did, 2 for a bad command.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

// Names a browser defines and Node's bare context does not. A frame that
// reaches one is drawing with the page, which only a browser can run.
const BROWSER =
  /^(document|window|self|globalThis|navigator|location|history|screen|visualViewport|localStorage|sessionStorage|indexedDB|matchMedia|getComputedStyle|getSelection|requestAnimationFrame|cancelAnimationFrame|requestIdleCallback|addEventListener|removeEventListener|dispatchEvent|scrollTo|scrollBy|innerWidth|innerHeight|outerWidth|outerHeight|devicePixelRatio|scrollX|scrollY|alert|confirm|prompt|open|fetch|XML\w*|WebSocket|Image|Audio|Option|FontFace|DOMParser|Blob|File|FileReader|FormData|Headers|Request|Response|Worker|BroadcastChannel|MessageChannel|AbortController|IntersectionObserver|ResizeObserver|MutationObserver|PerformanceObserver|performance|crypto|customElements|Node|NodeList|Element|Document|DocumentFragment|Range|Selection|Path2D|ImageData|ImageBitmap|createImageBitmap|AudioContext|MediaRecorder|MediaStream|speechSynthesis|CSS|Intl\w*|(HTML|SVG|CSS|DOM|Web|Media|Canvas|Offscreen|Shadow|Text)\w*|\w+(Event|Element|Observer|List|Map|Collection))$/;

// Web APIs Node has too, handed to the frames so they need no browser.
const LENT = {
  URL,
  URLSearchParams,
  TextEncoder,
  TextDecoder,
  atob,
  btoa,
  structuredClone,
  queueMicrotask,
  console: { log() {}, info() {}, warn() {}, error() {}, debug() {} },
  setTimeout: () => 0,
  setInterval: () => 0,
  clearTimeout() {},
  clearInterval() {},
};

// Where a value went missing on its way into a frame.
const MISSING = [
  [/>\s*(undefined|NaN|null)\s*</, (m) => `the text "${m[1]}"`],
  [/\[object Object\]/, () => '"[object Object]"'],
  [
    /\b(class|style|src|href|width|height)="[^"]*\b(undefined|NaN)\b/,
    (m) => `"${m[2]}" in a ${m[1]} attribute`,
  ],
];

const lineAt = (text, index) => text.slice(0, index).split("\n").length;

// Every script written into the page: its code, whether it is a module,
// and the page line its first line of code sits on.
function scriptsOf(html) {
  const scripts = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    if (/\bsrc\s*=/.test(attrs)) continue;
    const type = attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i)?.[1];
    if (type && type !== "module" && !/javascript/i.test(type)) continue;
    const code = m[2];
    const at = m.index + m[0].indexOf(">") + 1;
    scripts.push({ code, module: type === "module", line: lineAt(html, at) });
  }
  return scripts;
}

// A module's imports and exports blanked line for line, so the rest parses
// as a function body and keeps its line numbers.
const asBody = (code) =>
  code
    .replace(/^\s*import\s[^;]*?from\s*["'][^"']+["'];?/gm, (s) =>
      s.replace(/[^\n]/g, " "),
    )
    .replace(/^\s*import\s*["'][^"']+["'];?/gm, (s) => s.replace(/[^\n]/g, " "))
    .replace(/^(\s*)export\s+(default\s+)?/gm, "$1")
    .replace(/\bimport\.meta\b/g, "({})");

// The line, in the page, of an error thrown from code compiled as `name`.
function errorLine(error, name, first, shift) {
  const m = String(error?.stack ?? "").match(
    new RegExp(`${name.replace(/\W/g, "\\$&")}:(\\d+)`),
  );
  return m ? first + Number(m[1]) - 1 - shift : null;
}

// Step 1. A module's early errors are reported by parsing it as the body of
// an async function, which takes the same strict, await-able grammar.
function parse(script) {
  const name = "page-script";
  try {
    if (script.module)
      new vm.Script(
        `(async function () {"use strict";\n${asBody(script.code)}\n})`,
        { filename: name },
      );
    else new vm.Script(script.code, { filename: name });
    return null;
  } catch (error) {
    const line = errorLine(error, name, script.line, script.module ? 1 : 0);
    return `${error.name}: ${error.message}${line ? ` (line ${line})` : ""}`;
  }
}

const declares = (scripts, name) =>
  scripts.some((s) =>
    new RegExp(
      `(\\b(const|let|var|function|class)\\s+${name}\\b|\\bwindow\\.${name}\\s*=)`,
    ).test(s.code),
  );

// Step 2. Runs the frames and reads what they draw. Returns problems, or a
// reason the page can't be drawn without a browser.
function draw(scripts) {
  const frames = scripts.find(
    (s) => s.module && /\/\/ ---- render/.test(s.code),
  );
  if (!frames) return { skip: "it has no frames script with a render line" };
  const cut = frames.code.indexOf("// ---- render");
  const top = asBody(frames.code.slice(0, cut));
  const others = scripts.filter((s) => s !== frames);
  const name = "page-frames";
  const context = vm.createContext({ ...LENT });
  const where = (error) => {
    const line = errorLine(error, name, frames.line, 0);
    return line ? ` (line ${line})` : "";
  };
  try {
    vm.runInContext(top, context, { filename: name, timeout: 5000 });
  } catch (error) {
    const missing = String(error?.message).match(/^(\S+) is not defined$/)?.[1];
    if (missing && BROWSER.test(missing))
      return { skip: `its frames use \`${missing}\`, which needs a browser` };
    if (missing && declares(others, missing))
      return {
        skip: `its frames use \`${missing}\` from another script on the page`,
      };
    return {
      fails: [
        `${error?.name ?? "Error"} while drawing the frames: ${error?.message}${where(error)}`,
      ],
    };
  }
  const read = (expr) => vm.runInContext(expr, context, { timeout: 5000 });
  const kind = read(
    `typeof states !== "undefined" ? "states" : typeof SCREEN !== "undefined" ? "screen" : ""`,
  );
  if (!kind)
    return {
      fails: ["the frames script defines no `states` array or `SCREEN`"],
    };
  const drawings = [];
  if (kind === "states") {
    const states = read("states");
    if (!Array.isArray(states)) return { fails: ["`states` is not an array"] };
    if (!states.length)
      return { fails: ["`states` is empty, so the page draws no frames"] };
    states.forEach((s, i) => {
      const label = `frame ${i + 1}${s?.title ? ` ("${s.title}")` : ""}`;
      drawings.push([label, s?.body]);
    });
  } else {
    const screen = read("SCREEN");
    if (typeof screen?.draw !== "function")
      return { fails: ["`SCREEN` has no draw()"] };
    for (const part of ["draw", "controls"]) {
      if (typeof screen[part] !== "function") continue;
      try {
        drawings.push([`SCREEN.${part}()`, read(`SCREEN.${part}()`)]);
      } catch (error) {
        const missing = String(error?.message).match(
          /^(\S+) is not defined$/,
        )?.[1];
        if (missing && (BROWSER.test(missing) || declares(others, missing)))
          return {
            skip: `SCREEN.${part}() uses \`${missing}\`, which needs the page`,
          };
        return {
          fails: [
            `${error?.name ?? "Error"} in SCREEN.${part}(): ${error?.message}${where(error)}`,
          ],
        };
      }
    }
  }
  const fails = [];
  let checked = 0;
  for (const [label, body] of drawings) {
    if (body === undefined || body === null) {
      fails.push(`${label} has no body`);
      continue;
    }
    if (typeof body !== "string") {
      // A snapshot frame or another object the viewer turns into text.
      if (String(body) === "[object Object]")
        fails.push(
          `${label}'s body is an object, which draws as "[object Object]"`,
        );
      continue;
    }
    checked++;
    for (const [re, say] of MISSING) {
      const m = body.match(re);
      if (m) fails.push(`${label} draws ${say(m)}`);
    }
  }
  return { fails, checked, total: drawings.length };
}

/**
 * Checks one page's HTML. `fails` is empty when nothing failed; `skip` says
 * why the frames weren't drawn, and `checked` of `total` drawings were read.
 * @param {string} html
 * @returns {{ fails: string[], skip: string, checked: number, total: number }}
 */
export function check(html) {
  const scripts = scriptsOf(html);
  const fails = scripts.flatMap((s) => parse(s) ?? []);
  if (fails.length) return { fails, skip: "", checked: 0, total: 0 };
  const drawn = draw(scripts);
  return {
    fails: drawn.fails ?? [],
    skip: drawn.skip ?? "",
    checked: drawn.checked ?? 0,
    total: drawn.total ?? 0,
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.log("usage: node <skill>/check.mjs <page.html> [more.html]");
    process.exit(2);
  }
  let failed = false;
  for (const file of files) {
    let html;
    try {
      html = readFileSync(file, "utf8");
    } catch (error) {
      console.log(`FAIL ${file}: ${error.message}`);
      failed = true;
      continue;
    }
    const result = check(html);
    for (const f of result.fails) console.log(`FAIL ${file}: ${f}`);
    if (result.fails.length) failed = true;
    else if (result.skip)
      console.log(
        `${file}: parses; not drawn here, as ${result.skip}. Check it in your browser tool.`,
      );
    else
      console.log(
        `${file}: parses, and ${result.checked} of ${result.total} drawings come out whole.`,
      );
  }
  process.exit(failed ? 1 : 0);
}
