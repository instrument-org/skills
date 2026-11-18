// Builds and checks a page written as a part of frames: an HTML file of <script> blocks,
// one meta({...}) call, helpers placed above the first frame that uses them, and one
// frame({...}) call per frame. The page reads the part as written, so each frame is
// drawn in its own script: one that throws or fails to parse becomes an error tile in
// its place and the rest still draw. build.mjs uses this with the neutral kit and the
// pieces; a project's kit passes its own source in.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { readStore } from "./add-snapshot.mjs";
import { emptyMarks } from "./check.mjs";
import { repoName, tagRepo } from "./repo.mjs";

export const SKILL = path.dirname(fileURLToPath(import.meta.url));
const read = (/** @type {string} */ f) => fs.readFileSync(path.join(SKILL, f), "utf8");

/** Whether a page carries the frames runtime, so it was built from a part of frames. */
export const isFramesPage = (/** @type {string} */ html) => html.includes('<script id="wf-runtime">');

/** Globals a part may use that the browser and Node both define, lent to the Node run. */
const PAGE_GLOBALS = ["URL", "URLSearchParams", "TextEncoder", "TextDecoder", "structuredClone", "atob", "btoa", "queueMicrotask"];
// Names a browser defines and Node doesn't: a frame reaching one is checked in a browser.
const BROWSER = /^(document|window|self|navigator|location|history|localStorage|sessionStorage|matchMedia|getComputedStyle|requestAnimationFrame|fetch|Image|DOMParser|customElements|Node|Element|HTML\w*|SVG\w*|CSS)$/;

/** A declaration at the start of a line: `const x`, `let x`, `var x`, `function x`, `class x`. */
const DECLARATION = /^(?:(?:const|let|var|class)\s+|(?:async\s+)?function(?:\s*\*\s*|\s+))([A-Za-z_$][\w$]*)/;

/** The names a source declares at its top level (the column `indent` puts it at), each with its line. */
export function topNames(/** @type {string} */ src, indent = "") {
  /** @type {Map<string, number>} */
  const out = new Map();
  src.split("\n").forEach((line, i) => {
    const m = line.startsWith(indent) && DECLARATION.exec(line.slice(indent.length));
    if (m && !out.has(m[1])) out.set(m[1], i + 1);
  });
  return out;
}

/**
 * Source run in a scope of its own whose top-level names are then put on the page's global
 * object, where a part's own declaration of the same name shadows them instead of failing.
 */
export const shared = (/** @type {string} */ src, indent = "") =>
  `(() => {\n${src}\n;Object.assign(globalThis, { ${[...topNames(src, indent).keys()].join(", ")} });\n})();`;

/** The skill's template, cut into what a page of frames reuses. */
export function template() {
  const main = read("main.html");
  const open = '<script type="module">';
  const at = main.indexOf(open);
  const end = main.indexOf("</script>", at);
  const mod = main.slice(at + open.length, end);
  const cut = (/** @type {string} */ a, /** @type {string} */ b) => mod.slice(mod.indexOf(a), mod.indexOf(b));
  const indent = /^\s*/.exec(mod.slice(mod.lastIndexOf("\n", mod.indexOf("// ---- the kit")) + 1))?.[0] ?? "";
  return {
    before: main.slice(0, at),
    after: main.slice(end + "</script>".length),
    kit: cut("// ---- the kit", "// ---- annotations"),
    marks: cut("// ---- annotations", "// ---- the frames"),
    render: mod.slice(mod.indexOf("// ---- render")),
    indent,
  };
}

/**
 * The script every page of frames carries before its part: the kit's pieces and the marks,
 * each set of names shadowable, then the runtime that meta() and frame() belong to.
 * `kits` are sources in the order they load; a later one's names replace an earlier one's.
 */
export function runtimeSource(/** @type {{ src: string, indent?: string }[]} */ kits) {
  const t = template();
  return [
    "globalThis.W = 1280;\nglobalThis.H = 800;",
    ...kits.map((k) => shared(k.src, k.indent ?? "")),
    shared(t.marks, t.indent),
    read("runtime.js"),
  ].join("\n");
}

/** The neutral kit and the pieces, for a page drawn without a project's kit. */
export const neutralKits = () => {
  const t = template();
  return [{ src: t.kit, indent: t.indent }, { src: read("pieces.js") }];
};

/** The part's <script> blocks, each with the line its code starts on, and anything else it holds. */
export function blocksOf(/** @type {string} */ part) {
  const lineAt = (/** @type {number} */ i) => part.slice(0, i).split("\n").length;
  const blocks = [];
  for (const m of part.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const open = m.index + m[0].indexOf(">") + 1;
    blocks.push({ code: m[2], line: lineAt(open), attrs: m[1] });
  }
  const stray = part
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (s) => s.replace(/[^\n]/g, " "))
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (s) => s.replace(/[^\n]/g, " "))
    .replace(/<!--[\s\S]*?-->/g, (s) => s.replace(/[^\n]/g, " "));
  const loose = /\S/.exec(stray);
  return { blocks, loose: loose ? lineAt(loose.index) : 0 };
}

// Where a value went missing on its way into a frame. Only the bare word counts: inside a
// longer one it is copy or base64.
const LEAK = /\b(?:undefined|NaN)(?:px|em|rem|vh|vw|ch|deg|ms|s|fr)?\b|\[object Object\]/;

/**
 * Runs a part's blocks in Node the way the page runs them: the runtime first, then each
 * block in order in one global scope, so a failing block is reported and the next still
 * runs. Hands back the page's meta, groups and frames, and one line per problem.
 * @param {string} part
 * @param {{ runtime: string, file?: string, lend?: Record<string, unknown> }} o
 */
export function evaluate(part, { runtime, file = "part", lend = {} }) {
  const ctx = vm.createContext({
    ...Object.fromEntries(PAGE_GLOBALS.map((n) => [n, Reflect.get(globalThis, n)])),
    console: { log() {}, info() {}, warn() {}, error() {}, debug() {} },
    ...lend,
  });
  vm.runInContext(runtime, ctx, { filename: "runtime" });
  /** @type {{ meta: any, groups: Record<string, any>, states: any[], errors: any[], line: number, fail: Function }} */
  const wf = vm.runInContext("__wf", ctx);
  const fails = [];
  const notes = [];
  const { blocks, loose } = blocksOf(part);
  /** The lines of the block that drew each frame. */
  const spans = new Map();
  if (loose) fails.push(`line ${loose}: the part has HTML outside its <script> blocks, which would show on the page; put it in a frame's body`);
  const where = (/** @type {any} */ e, /** @type {number} */ fallback) => Number(new RegExp(`${file.replace(/\W/g, "\\$&")}:(\\d+)`).exec(String(e?.stack))?.[1] ?? fallback);
  for (const b of blocks) {
    if (/\bsrc\s*=/.test(b.attrs) || /type\s*=\s*["']?(?!text\/javascript)/i.test(b.attrs)) continue;
    wf.line = b.line;
    const before = wf.states.length;
    let script;
    try {
      script = new vm.Script(b.code, { filename: file, lineOffset: b.line - 1 });
    } catch (e) {
      const line = where(e, b.line);
      fails.push(`line ${line}: ${hint(e)}`);
      wf.fail("Script error", `${e?.name}: ${e?.message}`, { line });
      continue;
    }
    try {
      script.runInContext(ctx, { timeout: 5000 });
    } catch (e) {
      const line = where(e, b.line);
      const missing = /^(\S+) is not defined$/.exec(String(e?.message))?.[1];
      if (missing && BROWSER.test(missing)) {
        notes.push(`line ${line}: uses \`${missing}\`, which needs a browser; the Node check skips it, so look at it in the browser`);
        continue;
      }
      fails.push(`line ${line}: ${hint(e)}`);
      wf.fail("Script error", `${e?.name}: ${e?.message}`, { line });
    }
    for (const s of wf.states.slice(before)) spans.set(s, [b.line, b.line + b.code.split("\n").length - 1]);
    for (const s of wf.states.slice(before)) {
      const n = wf.states.indexOf(s) + 1;
      if (s.error) continue;
      for (const field of ["title", "note", "body"]) {
        const hit = LEAK.exec(s[field]);
        if (hit) fails.push(`line ${b.line}: frame ${n} "${s.title}" draws "${hit[0]}" in its ${field}: …${s[field].slice(Math.max(0, hit.index - 70), hit.index + hit[0].length + 70).replace(/\s+/g, " ")}…`);
      }
      for (const words of emptyMarks(s.body)) fails.push(`line ${b.line}: frame ${n} "${s.title}" puts the callout "${words}" on an element that draws nothing; mark something the frame draws, or put the words in its note`);
    }
  }
  // What meta() and frame() turned down; a script error is already in `fails` with its hint.
  for (const e of wf.errors)
    if (e.title !== "Script error") fails.push(`line ${e.line}: ${e.title === "Page" ? "meta()" : `frame "${e.title}"`} didn't draw: ${e.why}`);
  fails.sort((a, b) => Number(/^line (\d+)/.exec(a)?.[1] ?? 0) - Number(/^line (\d+)/.exec(b)?.[1] ?? 0));
  if (!wf.meta) fails.push("the part never calls meta({ title, line, source }), so the page has no name");
  if (!wf.states.some((s) => !s.error)) fails.push("no frame drew");
  const index = labels(wf.states, wf.groups).map((label, i) => ({ label, title: wf.states[i].title, lines: spans.get(wf.states[i]) }));
  return { meta: wf.meta ?? {}, groups: wf.groups, states: wf.states, fails, notes, index };
}

/** The frames as a build lists them, one line each: `A2  Payment  lines 47-55`. */
export function frameList(/** @type {{ label: string, title: string, lines?: number[] }[]} */ index) {
  const width = Math.max(0, ...index.map((f) => f.label.length));
  return index.map((f) => `${f.label.padEnd(width)}  ${f.title}${!f.lines ? "" : f.lines[0] === f.lines[1] ? `  line ${f.lines[0]}` : `  lines ${f.lines[0]}-${f.lines[1]}`}`);
}

/**
 * Each frame's label as the page shows it: its group's mark and place, A2 or "Now 2",
 * a plain number outside any group, and nothing in a group whose mark is "". Keep in
 * step with `label` in main.html.
 * @param {{ group?: string }[]} states
 * @param {Record<string, { mark?: string }>} groups
 */
export function labels(states, groups) {
  const seen = new Map();
  return states.map((s) => {
    const key = s.group !== undefined && Object.hasOwn(groups, s.group) ? s.group : undefined;
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    if (key === undefined) return String(n);
    const mark = groups[key].mark ?? "";
    if (!mark) return "";
    return mark.length === 1 ? `${mark}${n}` : `${mark} ${n}`;
  });
}

/** The error's message, with what to do about the usual ones. */
function hint(/** @type {any} */ e) {
  const msg = `${e?.name ?? "Error"}: ${e?.message}`;
  const twice = /Identifier '([\w$]+)' has already been declared/.exec(msg)?.[1];
  if (twice === "frame" || twice === "meta") return `${msg}. \`${twice}\` is the page's own; rename your helper`;
  if (twice) return `${msg}. An earlier script in the part declares \`${twice}\` too; reuse it or rename one`;
  if (/is not defined$/.test(msg)) return `${msg}. Define it in a script above the first frame that uses it, or check the kit's name for it`;
  return msg;
}

const esc = (/** @type {string} */ s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

/**
 * The page: the skill's shell around its template, with the runtime, the part as written
 * and the viewer. `head` goes before the runtime (a snapshot store and its frames script).
 * @param {{ part: string, runtime: string, meta: any, tileMin?: number, head?: string, repoDir?: string }} o
 */
export function assemble({ part, runtime, meta, tileMin = 330, head = "", repoDir }) {
  const t = template();
  const shell = read("shell.html");
  const drop = (/** @type {string} */ s) => s.replace(/<!--(?!\s*Keep type)[\s\S]*?-->\s*/g, "");
  const before = drop(t.before)
    .replace(">TITLE</h1>", () => `>${esc(meta.title ?? "")}</h1>`)
    .replace(/>ONE LINE:[^<]*<\/p>/, () => `>${esc(meta.line ?? "")}</p>`)
    .replace(/(<p id="source"[^>]*>)[\s\S]*?(<\/p>)/, (_, a, b) => `${a}${esc(meta.source ?? "")}${b}`);
  const viewer = `\n        const states = window.__wf.states;\n        const groups = window.__wf.groups;\n        ${t.render.replace(/const TILE_MIN = \d+;/, `const TILE_MIN = ${meta.tileMin || tileMin};`)}`;
  // The page's line the part starts on, so an error tile in the page names the part's line.
  const init = "globalThis.__wf = { meta: null, groups: {}, states: [], errors: [], partLine: PART_LINE, line: 0 };";
  const inner = `${before}${head}<script id="wf-runtime">\n${init}\n${runtime}\n</script>\n<!-- the part -->\n${part.trim()}\n<!-- end of the part -->\n<script type="module">${viewer}</script>${drop(t.after)}`;
  let html = shell
    .replace("<title>TITLE</title>", () => `<title>${esc(meta.title ?? "")}</title>`)
    .replace('content="TEMPLATE@1"', () => 'content="wireframe@1"')
    .replace(/<main class="[^"]*">[\s\S]*?<\/main>/, () => `<main class="flex min-h-dvh flex-col px-4 pb-8 sm:px-6">\n${inner}\n    </main>`);
  if (repoDir) html = tagRepo(html, repoName(repoDir));
  const partLine = html.slice(0, html.indexOf("<!-- the part -->\n")).split("\n").length + 1;
  return html.replace("partLine: PART_LINE", () => `partLine: ${partLine}`);
}

/** The part a built page carries, cut back out of it. */
export const partOf = (/** @type {string} */ html) => {
  const a = html.indexOf("<!-- the part -->\n");
  const b = html.indexOf("\n<!-- end of the part -->");
  return a < 0 || b < 0 ? "" : html.slice(a + "<!-- the part -->\n".length, b);
};

/** The runtime a built page carries, for checking the page on its own. */
export const runtimeOf = (/** @type {string} */ html) => {
  const m = /<script id="wf-runtime">\n([\s\S]*?)\n<\/script>/.exec(html);
  return m ? m[1] : "";
};

/**
 * snap() for the Node run, over a page's snapshots: it names a snapshot and takes its
 * size, and the page draws it. `used` collects the names frames drew.
 * @param {{ pages: Record<string, { w: number, h: number, url?: string }> }} store
 */
export function snapStub(store) {
  const used = new Set();
  const page = (/** @type {string} */ name) => {
    const p = store.pages[name];
    if (!p) throw new Error(`no snapshot named "${name}"; pass ${name}.json to build.mjs`);
    used.add(name);
    return p;
  };
  const snap = (/** @type {string} */ name) => {
    const p = page(name);
    return `<div class="snap" data-snap="${name}" style="width:${p.w}px;height:${p.h}px"></div>`;
  };
  snap.size = (/** @type {string} */ name) => ({ w: page(name).w, h: page(name).h });
  snap.url = (/** @type {string} */ name) => page(name).url ?? "";
  return { snap, used };
}

/**
 * Checks a built page of frames without a browser: the viewer's script parses, and the
 * part runs as the page runs it. Lines are the part's own.
 */
export function checkFramesPage(/** @type {string} */ html, file = "page") {
  const fails = [];
  const mod = /<script type="module">([\s\S]*?)<\/script>/.exec(html.slice(html.indexOf("<!-- end of the part -->")));
  try {
    if (mod) new vm.Script(`(async function () {\n${mod[1]}\n})`);
  } catch (e) {
    fails.push(`the viewer's script doesn't parse: ${/** @type {Error} */ (e).message}`);
  }
  const r = evaluate(partOf(html), { runtime: runtimeOf(html), file, lend: { snap: snapStub(readStore(html)).snap } });
  return { fails: [...fails, ...r.fails], notes: r.notes, frames: r.states.filter((s) => !s.error).length, total: r.states.length };
}
