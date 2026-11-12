// Drives the wireframe skill's enlarged view in headless Chromium through
// fixture pages, and prints one FAIL line per broken promise: no script
// errors; bands that keep one height from frame to frame; a title block
// and strip that follow the open frame; Compare showing the paired frame
// and the open one inside the window, with nothing behind them, through a
// resize, and the ways out of it; Recommended walking only the stars; and
// a pairing that names no frame listed on the page. Each fixture is a page
// new.mjs writes, so the check runs the main.html an agent would get.
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
// it that sets its own visibility, which once showed through a second
// frame laid over the stage. `extra` adds fields, such as pick or compare.
// Notes alternate between one line and two in the caption, since a band
// that fits its note changes height between them.
let notes = 0;
const SHORT = "We check this frame.";
const LONG =
  "We check this frame with a note long enough to run onto a second line of the caption under the frame, the way most notes do in practice.";
const frame = (title, w, h, { leak = false, extra = "" } = {}) =>
  `{ title: ${JSON.stringify(title)},${extra ? ` ${extra},` : ""} note: ${JSON.stringify(notes++ % 2 ? LONG : SHORT)}, w: ${w}, h: ${h}, body: \`<div class="h-full bg-card p-8"><p class="text-2xl font-semibold">${title}</p>${leak ? '<div style="visibility: visible">kept visible</div>' : ""}</div>\` }`;
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
    groups: `{ now: { mark: "Now", tone: "gray", note: "As it ships." }, A: { mark: "A", name: "First option", note: "One way." }, B: { mark: "B", name: "Second option", note: "Another way." } }`,
    states: [
      withGroup("now", frame("Home", 1280, 800)),
      withGroup("now", frame("Settings", 1280, 800)),
      withGroup(
        "A",
        frame("Home", 1280, 800, {
          leak: true,
          extra: `compare: { with: "Now 1", as: "today's home" }`,
        }),
      ),
      withGroup("A", frame("Settings", 1280, 800)),
      withGroup("A", frame("Done", 1280, 800, { extra: "pick: true" })),
      withGroup(
        "B",
        frame("Home", 1280, 800, {
          extra: `compare: { with: "Done", as: "option A" }`,
        }),
      ),
      withGroup("B", frame("Settings", 1280, 800, { extra: "pick: true" })),
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
  "bad pair": {
    groups: "{}",
    problems: 1,
    states: [
      frame("One", 1280, 800, {
        extra: `compare: { with: "Nothing", as: "nothing" }`,
      }),
      frame("Two", 1280, 800),
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
  const strip = document.querySelector("#viewer-strip");
  const shown = (b) => b.offsetWidth > 0;
  const current = [...strip.querySelectorAll("[aria-current]")].map((b) => Number(b.dataset.go));
  const partner = [...strip.querySelectorAll(".partner")].map((b) => Number(b.dataset.go));
  const panes = [...pair.querySelectorAll(".pane")];
  const compare = document.querySelector("#viewer [data-compare]");
  const picks = document.querySelector("#viewer [data-picks]");
  const name = strip.querySelector(".name");
  const sr = strip.getBoundingClientRect();
  const nr = name?.getBoundingClientRect();
  return {
    open: viewer.open,
    counter: document.querySelector("#viewer-counter").textContent,
    title: document.querySelector("#viewer-title").textContent,
    top: document.querySelector("#viewer-top").offsetHeight,
    band: document.querySelector("#viewer-bottom").offsetHeight,
    stripShown: !strip.hidden,
    nameInside: !nr || (nr.left >= sr.left - 1 && nr.right <= sr.right + 1),
    current, partner,
    barsShown: [...strip.querySelectorAll("[data-go]")].filter(shown).map((b) => Number(b.dataset.go)),
    stageFrames: document.querySelectorAll("#stage .frame").length,
    pairShown: !pair.hidden,
    panes: panes.map((p) => Number(p.dataset.index)),
    panesInside: panes.every((p) => inside(p.querySelector(".frame"))),
    compareShown: !compare.hidden && compare.offsetWidth > 0,
    compareWords: compare.querySelector(".word").textContent,
    comparePressed: compare.getAttribute("aria-pressed"),
    picksShown: !picks.hidden,
    picksPressed: picks.getAttribute("aria-pressed"),
    problems: document.querySelectorAll("#rack [role=alert] p").length,
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
  const go = async (i) => {
    await P.evaluate(
      `(() => { const b = document.querySelector('#viewer-strip [data-go="${i}"]'); if (b) b.click(); else document.querySelectorAll("#rack .frame")[${i}].click(); })()`,
    );
    await wait(150);
  };

  try {
    for (const [name, fixture] of Object.entries(FIXTURES)) {
      const fail = (msg) => fails.push(`FAIL ${name}: ${msg}`);
      const n = fixture.states.length;
      const grouped = !/^\{\s*\}$/.test(fixture.groups);
      const paired = fixture.states.flatMap((s, i) =>
        /compare:/.test(s) && !fixture.problems ? [i] : [],
      );
      const picks = fixture.states.flatMap((s, i) =>
        /pick: true/.test(s) ? [i] : [],
      );
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
      const tops = new Set();
      const bands = new Set();
      for (let i = 0; i < n; i++) {
        const v = await read();
        tops.add(v.top);
        bands.add(v.band);
        if (v.counter !== `${i + 1}/${n}`)
          fail(`frame ${i + 1} shows the counter "${v.counter}"`);
        if (v.stageFrames !== 1)
          fail(`frame ${i + 1} has ${v.stageFrames} frames on the stage`);
        if (v.pairShown) fail(`frame ${i + 1} compares unasked`);
        if (v.stripShown !== grouped)
          fail(`frame ${i + 1} ${grouped ? "hides" : "shows"} the strip`);
        if (grouped && (v.current.length !== 1 || v.current[0] !== i))
          fail(`frame ${i + 1} lights strip bars [${v.current}]`);
        if (!v.nameInside)
          fail(`frame ${i + 1} runs the group's name out of the strip`);
        if (v.compareShown !== paired.includes(i))
          fail(`frame ${i + 1} ${v.compareShown ? "shows" : "hides"} Compare`);
        if (v.compareShown && !v.compareWords.startsWith("Compare with "))
          fail(`frame ${i + 1} labels Compare "${v.compareWords}"`);
        if (v.picksShown !== picks.length > 0)
          fail(
            `frame ${i + 1} ${v.picksShown ? "shows" : "hides"} Recommended`,
          );
        if (v.frameParam !== String(i + 1))
          fail(`frame ${i + 1} leaves ?frame=${v.frameParam}`);
        await key("ArrowRight");
      }
      if (tops.size !== 1)
        fail(`the title block changes height: ${[...tops].join(", ")}px`);
      if (bands.size !== 1)
        fail(`the bottom band changes height: ${[...bands].join(", ")}px`);
      if ((await read()).problems !== (fixture.problems ?? 0))
        fail(
          `the page lists ${(await read()).problems} pairing problems, not ${fixture.problems ?? 0}`,
        );

      // Compare, on every paired frame: the partner at the left, the open
      // frame at the right, nothing behind them, both inside the window.
      for (const i of paired) {
        await go(i);
        await key("c");
        const v = await read();
        if (!v.pairShown || v.panes.length !== 2)
          fail(`compare on frame ${i + 1} shows ${v.panes.length} panes`);
        else if (v.panes[1] !== i || v.panes[0] === i)
          fail(`compare on frame ${i + 1} shows panes [${v.panes}]`);
        if (v.stageFrames !== 0)
          fail(
            `compare on frame ${i + 1} keeps ${v.stageFrames} frame behind the panes`,
          );
        if (!v.panesInside)
          fail(`compare on frame ${i + 1} runs a pane out of the window`);
        if (v.comparePressed !== "true")
          fail(`compare on frame ${i + 1} leaves the button unpressed`);
        if (grouped && (v.partner.length !== 1 || v.partner[0] !== v.panes[0]))
          fail(
            `compare on frame ${i + 1} rings strip bars [${v.partner}] for pane ${v.panes[0]}`,
          );
        if (v.band !== [...bands][0] || v.top !== [...tops][0])
          fail(`compare on frame ${i + 1} changes a band's height`);
        await key("c");
        const off = await read();
        if (off.pairShown || off.stageFrames !== 1)
          fail(`C again on frame ${i + 1} doesn't go back to one frame`);
      }
      if (paired.length) {
        const i = paired[0];
        await go(i);
        await key("c");
        // A resize keeps both panes inside the window, and a phone's width
        // goes back to one frame.
        for (const [w, h] of [
          [960, 700],
          [1600, 1000],
        ]) {
          await P.viewport(w, h);
          await wait(250);
          if (!(await read()).panesInside)
            fail(`compare runs a pane out of a ${w}px window`);
        }
        await P.viewport(600, 900);
        await wait(250);
        let v = await read();
        if (v.pairShown || v.compareShown) fail("a 600px window keeps Compare");
        await P.viewport(1440, 900);
        await wait(200);
        // The ways out: a zoom key and a tap on a pane.
        await key("c");
        await key("1");
        v = await read();
        if (v.pairShown || v.stageFrames !== 1)
          fail("a zoom key in compare doesn't go back to one frame");
        await key("0");
        await key("c");
        const left = (await read()).panes[0];
        await P.evaluate(`document.querySelectorAll("#pair .pane")[0].click()`);
        await wait(150);
        v = await read();
        if (v.pairShown || v.counter !== `${left + 1}/${n}`)
          fail("a tap on the left pane doesn't open it alone");
      }
      // C on a frame with no pair does nothing.
      const lone = [...Array(n).keys()].find((i) => !paired.includes(i));
      if (lone !== undefined) {
        await go(lone);
        await key("c");
        if ((await read()).pairShown)
          fail(`C on frame ${lone + 1}, which has no pair, compares`);
      }

      // Recommended: R from a frame without a star opens its group's star,
      // the arrows walk only the stars, and R again shows every frame.
      if (picks.length) {
        await go(0);
        await key("r");
        let v = await read();
        if (v.picksPressed !== "true")
          fail("R leaves the Recommended button unpressed");
        if (
          !picks.includes(v.current[0] ?? Number(v.counter.split("/")[0]) - 1)
        )
          fail(`R opens frame ${v.counter}, which has no star`);
        if (grouped && v.barsShown.join() !== picks.join())
          fail(`R shows strip bars [${v.barsShown}], not the stars [${picks}]`);
        const seen = [];
        for (let k = 0; k < picks.length; k++) {
          seen.push(Number((await read()).counter.split("/")[0]) - 1);
          await key("ArrowRight");
        }
        if ([...seen].sort((a, b) => a - b).join() !== picks.join())
          fail(`the arrows under R visit [${seen}], not [${picks}]`);
        await key("r");
        v = await read();
        if (v.picksPressed !== "false" || (grouped && v.barsShown.length !== n))
          fail("R again doesn't bring every frame back");
      }

      await P.evaluate(`document.querySelector("#viewer").close()`);
      await wait(100);
      const v = await read();
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
