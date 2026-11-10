// Drives the wireframe skill's enlarged view in headless Chromium through
// fixture pages, and prints one FAIL line per broken promise: no script
// errors; a bottom band that keeps one height from frame to frame; a strip
// that lights the open frame; two up showing exactly two frames inside the
// window, with nothing behind them, at every step and through a resize;
// and the ways out of two up. Each fixture is a page new.mjs writes, so the
// check runs the main.html an agent would get.
//
// A development tool, like page-check: nothing under skills/ imports it.
//
//   node tools/wireframe-check/check.mjs [--keep <dir>]
//
// Exit 0 pass, 1 FAIL, 3 Chromium could not run.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ChromeError, launch } from "../page-check/chrome.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const newPage = resolve(here, "../../skills/wireframe/new.mjs");

// A frame: a box at its size with a title in it. `leak` puts an element in
// it that sets its own visibility, which once showed through two up.
// Notes alternate between one line and two in the caption, since a band
// that fits its note changes height between them.
let notes = 0;
const SHORT = "We check this frame.";
const LONG =
  "We check this frame with a note long enough to run onto a second line of the caption under the frame, the way most notes do in practice.";
const frame = (title, w, h, { leak = false } = {}) =>
  `{ title: ${JSON.stringify(title)}, note: ${JSON.stringify(notes++ % 2 ? LONG : SHORT)}, w: ${w}, h: ${h}, body: \`<div class="h-full bg-card p-8"><p class="text-2xl font-semibold">${title}</p>${leak ? '<div style="visibility: visible">kept visible</div>' : ""}</div>\` }`;
const withGroup = (g, f) => f.replace("{ title:", `{ group: "${g}", title:`);

export const FIXTURES = {
  plain: {
    groups: "{}",
    states: [
      frame("Window", 1280, 800, { leak: true }),
      frame("Phone", 390, 844),
      frame("Panel", 640, 360),
      frame("Window again", 1280, 800),
    ],
  },
  grouped: {
    groups: `{ now: { mark: "Now", tone: "gray", name: "Current design", note: "As it ships." }, A: { mark: "A", name: "First option", note: "One way." }, B: { mark: "B", name: "Second option", note: "Another way." } }`,
    states: [
      withGroup("now", frame("Home", 1280, 800)),
      withGroup("now", frame("Settings", 1280, 800)),
      withGroup("A", frame("Home", 1280, 800, { leak: true })),
      withGroup("A", frame("Settings", 1280, 800)),
      withGroup("A", frame("Done", 1280, 800)),
      withGroup("B", frame("Home", 1280, 800)),
      withGroup("B", frame("Settings", 1280, 800)),
    ],
  },
  "lead-in": {
    groups: `{ E: { mark: "E", name: "A folder", note: "Saved in a folder." }, F: { mark: "F", name: "Ask", note: "Asked each time." } }`,
    states: [
      frame("Hosted page", 1280, 800),
      withGroup("E", frame("Workspace", 1280, 800)),
      withGroup("E", frame("Saved", 1280, 800)),
      withGroup("F", frame("Sheet", 640, 360)),
    ],
  },
  "one group": {
    groups: `{ A: { mark: "A", name: "Only option", note: "One way." } }`,
    states: [
      withGroup("A", frame("One", 1280, 800)),
      withGroup("A", frame("Two", 1280, 800)),
    ],
  },
  tall: {
    groups: `{ A: { mark: "A", name: "Long page", note: "Tall." }, B: { mark: "B", name: "Other page", note: "Tall too." } }`,
    states: [
      withGroup("A", frame("Home", 1280, 3200)),
      withGroup("A", frame("Pricing", 1280, 1800)),
      withGroup("B", frame("Home", 1280, 3000)),
      withGroup("B", frame("Pricing", 1280, 1600)),
    ],
  },
};

const build = (dir, name, { groups, states }) => {
  const path = join(dir, `${name.replace(/\W+/g, "-")}.html`);
  execFileSync("node", [newPage, path, `Check: ${name}`], {
    cwd: dir,
    stdio: "ignore",
  });
  const page = readFileSync(path, "utf8");
  const a = page.indexOf("        // ---- the frames");
  const b = page.indexOf("        // ---- render");
  const frames = `        // ---- the frames\n        const groups = ${groups};\n        const states = [\n${states.map((s) => `          ${s},`).join("\n")}\n        ];\n\n`;
  writeFileSync(path, page.slice(0, a) + frames + page.slice(b));
  return path;
};

// What the viewer shows right now, read in the page.
const READ = `JSON.stringify((() => {
  const viewer = document.querySelector("#viewer");
  const pair = document.querySelector("#pair");
  const inside = (el) => { const r = el.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1 && r.width > 0; };
  const current = [...document.querySelectorAll("#viewer-strip [aria-current]")].map((b) => Number(b.dataset.go));
  const partner = [...document.querySelectorAll("#viewer-strip .partner")].map((b) => Number(b.dataset.go));
  const panes = [...pair.querySelectorAll(".pane")];
  return {
    open: viewer.open,
    counter: document.querySelector("#viewer-counter").textContent,
    band: document.querySelector("#viewer-bottom").offsetHeight,
    stripShown: !document.querySelector("#viewer-strip").hidden,
    current, partner,
    stageFrames: document.querySelectorAll("#stage .frame").length,
    pairShown: !pair.hidden,
    panes: panes.map((p) => Number(p.dataset.index)),
    panesInside: panes.every((p) => inside(p.querySelector(".frame"))),
    pressed: document.querySelector("#viewer [data-two]").getAttribute("aria-pressed"),
    frameParam: new URLSearchParams(location.search).get("frame"),
  };
})())`;

export async function run({ keep } = {}) {
  const dir = keep
    ? resolve(keep)
    : mkdtempSync(join(tmpdir(), "wireframe-check-"));
  mkdirSync(dir, { recursive: true });
  const fails = [];
  const chrome = await launch();
  const P = chrome.page;
  const errors = [];
  await P.send("Runtime.enable");
  P.on("Runtime.exceptionThrown", (e) =>
    errors.push(
      e.exceptionDetails.exception?.description?.split("\n")[0] ??
        e.exceptionDetails.text,
    ),
  );
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const read = async () => JSON.parse(await P.evaluate(READ));
  const key = async (k) => {
    await P.evaluate(
      `document.dispatchEvent(new KeyboardEvent("keydown", { key: ${JSON.stringify(k)}, bubbles: true }))`,
    );
    await wait(120);
  };

  try {
    for (const [name, fixture] of Object.entries(FIXTURES)) {
      const fail = (msg) => fails.push(`FAIL ${name}: ${msg}`);
      const n = fixture.states.length;
      const grouped = !/^\{\s*\}$/.test(fixture.groups);
      const path = build(dir, name, fixture);
      errors.length = 0;
      await P.viewport(1440, 900);
      await P.navigate(pathToFileURL(path).href);
      await wait(400);
      // One per row, the setting under which a copied tile is widest.
      await P.evaluate(
        `(() => { const r = document.querySelector("#per-row"); r.value = 1; r.dispatchEvent(new Event("input")); document.querySelector("#rack .frame").click(); })()`,
      );
      await wait(200);

      // One frame at a time, all the way round.
      const bands = new Set();
      for (let i = 0; i < n; i++) {
        const v = await read();
        bands.add(v.band);
        if (v.counter !== `${i + 1} / ${n}`)
          fail(`frame ${i + 1} shows the counter "${v.counter}"`);
        if (v.stageFrames !== 1)
          fail(`frame ${i + 1} has ${v.stageFrames} frames on the stage`);
        if (v.pairShown) fail(`frame ${i + 1} shows two up unasked`);
        if (v.stripShown !== grouped)
          fail(`frame ${i + 1} ${grouped ? "hides" : "shows"} the strip`);
        if (grouped && (v.current.length !== 1 || v.current[0] !== i))
          fail(`frame ${i + 1} lights strip bars [${v.current}]`);
        if (v.frameParam !== String(i + 1))
          fail(`frame ${i + 1} leaves ?frame=${v.frameParam}`);
        await key("ArrowRight");
      }

      // Two up, all the way round, and up and down on the right side.
      await key("t");
      for (let i = 0; i < n; i++) {
        const v = await read();
        bands.add(v.band);
        if (!v.pairShown || v.panes.length !== 2)
          fail(`two up on frame ${i + 1} shows ${v.panes.length} panes`);
        else if (v.panes[0] === v.panes[1])
          fail(`two up on frame ${i + 1} shows the same frame twice`);
        if (v.stageFrames !== 0)
          fail(
            `two up on frame ${i + 1} keeps ${v.stageFrames} frame behind the panes`,
          );
        if (!v.panesInside)
          fail(`two up on frame ${i + 1} runs a pane out of the window`);
        if (v.pressed !== "true")
          fail(`two up on frame ${i + 1} leaves the button unpressed`);
        if (grouped && (v.partner.length !== 1 || v.partner[0] !== v.panes[1]))
          fail(
            `two up on frame ${i + 1} rings strip bars [${v.partner}] for pane ${v.panes[1]}`,
          );
        await key("ArrowRight");
      }
      if (grouped) {
        const before = await read();
        await key("ArrowDown");
        const after = await read();
        if (after.panes[0] !== before.panes[0])
          fail("down in two up moved the left frame");
        if (after.panes[0] === after.panes[1])
          fail("down in two up put the left frame on the right");
      }
      if (bands.size !== 1)
        fail(`the bottom band changes height: ${[...bands].join(", ")}px`);

      // A resize keeps both panes inside the window.
      for (const [w, h] of [
        [960, 700],
        [1600, 1000],
      ]) {
        await P.viewport(w, h);
        await wait(250);
        if (!(await read()).panesInside)
          fail(`two up runs a pane out of a ${w}px window`);
      }
      await P.viewport(1440, 900);
      await wait(200);

      // The ways out: a zoom key, a tap on a pane, and closing.
      await key("1");
      let v = await read();
      if (v.pairShown || v.stageFrames !== 1)
        fail("a zoom key in two up doesn't go back to one frame");
      await key("t");
      const right = (await read()).panes[1];
      await P.evaluate(`document.querySelectorAll("#pair .pane")[1].click()`);
      await wait(150);
      v = await read();
      if (v.pairShown || v.counter !== `${right + 1} / ${n}`)
        fail("a tap on the right pane doesn't open it alone");
      await P.evaluate(`document.querySelector("#viewer").close()`);
      await wait(100);
      v = await read();
      if (v.open || v.pairShown || v.stageFrames !== 0 || v.frameParam !== null)
        fail("closing leaves the viewer, its panes or ?frame= behind");

      for (const e of new Set(errors)) fail(`script error: ${e}`);
    }
  } finally {
    chrome.close?.();
  }
  return { fails, dir };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const k = process.argv.indexOf("--keep");
  let result;
  try {
    result = await run({ keep: k > 0 ? process.argv[k + 1] : undefined });
  } catch (e) {
    console.log(
      `FAIL chromium: ${e instanceof ChromeError ? "" : "unexpected error: "}${e.message}`,
    );
    process.exit(3);
  }
  for (const line of result.fails) console.log(line);
  console.log(
    result.fails.length
      ? `${result.fails.length} FAIL. Pages are in ${result.dir}.`
      : `wireframe-check: ${Object.keys(FIXTURES).length} pages pass.`,
  );
  process.exit(result.fails.length ? 1 : 0);
}
