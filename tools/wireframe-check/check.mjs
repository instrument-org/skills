// Drives the wireframe skill's enlarged view in headless Chromium through
// fixture pages, and prints one FAIL line per broken promise: no script
// errors; bands that keep one height from frame to frame; a title block
// and strip that follow the open frame; callouts in the margin and a
// spotlight that fades, held by A and hidden by Cmd+.; and a frame still carrying a `compare` field, which pages written
// before Compare was removed have, ignored without a word. Each fixture is a page
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
// frame laid over the stage. `extra` adds fields, such as pick. `marked`
// adds callouts: a note, a NEW and a bare click, written with the page's
// own helpers.
// Notes alternate between one line and two in the caption, since a band
// that fits its note changes height between them.
let notes = 0;
const SHORT = "We check this frame.";
const LONG =
  "We check this frame with a note long enough to run onto a second line of the caption under the frame, the way most notes do in practice.";
const MARKED =
  '${noted(`<p class="w-64 p-2">Saved an hour ago</p>`, "Says when, not what")}${fresh(`<p class="w-40 p-2">Undo</p>`)}${noted(`<p class="ml-auto w-24 p-2">Send</p>`, "click")}';
const frame = (
  title,
  w,
  h,
  { leak = false, marked = false, extra = "" } = {},
) =>
  `{ title: ${JSON.stringify(title)},${extra ? ` ${extra},` : ""} note: ${JSON.stringify(notes++ % 2 ? LONG : SHORT)}, w: ${w}, h: ${h}, body: \`<div class="h-full bg-card p-8"><p class="text-2xl font-semibold">${title}</p>${leak ? '<div style="visibility: visible">kept visible</div>' : ""}${marked ? MARKED : ""}</div>\` }`;
const withGroup = (g, f) => f.replace("{ title:", `{ group: "${g}", title:`);

export const FIXTURES = {
  plain: {
    groups: "{}",
    states: [
      frame("Window", 1280, 800, { leak: true }),
      frame("Phone", 390, 844),
      frame("Panel", 640, 360, { extra: "dark: true" }),
      frame("Window again", 1280, 800),
    ],
  },
  grouped: {
    groups: `{ now: { mark: "Now", tone: "gray", note: "As it ships." }, A: { mark: "A", name: "First option", note: "One way." }, B: { mark: "B", name: "Second option", note: "Another way." } }`,
    states: [
      withGroup("now", frame("Home", 1280, 800)),
      withGroup("now", frame("Settings", 1280, 800)),
      withGroup("A", frame("Home", 1280, 800, { leak: true })),
      withGroup("A", frame("Settings", 1280, 800)),
      withGroup("A", frame("Done", 1280, 800, { extra: "pick: true" })),
      withGroup("B", frame("Home", 1280, 800)),
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
  "old compare": {
    groups: "{}",
    states: [
      frame("One", 1280, 800, {
        extra: `compare: { with: "Two", as: "the other" }`,
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
  callouts: {
    groups: "{}",
    states: [
      frame("Draft", 1280, 800, { marked: true }),
      frame("Sent", 1280, 800, { marked: true }),
      frame("Empty", 1280, 800),
      frame("Phone", 390, 844, { marked: true }),
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
  const strip = document.querySelector("#viewer-strip");
  const shown = (b) => b.offsetWidth > 0;
  const current = [...strip.querySelectorAll("[aria-current]")].map((b) => Number(b.dataset.go));
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
    current,
    barsShown: [...strip.querySelectorAll("[data-go]")].filter(shown).map((b) => Number(b.dataset.go)),
    pickBars: [...strip.querySelectorAll(".pick")].map((b) => Number(b.dataset.go)),
    stageFrames: document.querySelectorAll("#stage .frame").length,
    scheme: getComputedStyle(document.querySelector("#stage .frame") ?? document.body).colorScheme,
    compareLeft: document.querySelectorAll("#pair, #viewer [data-compare]").length,
    alerts: document.querySelectorAll("#rack [role=alert]").length,
    frameParam: new URLSearchParams(location.search).get("frame"),
  };
})())`;

// The callouts beside the open frame and the spotlight over it: where the
// frame sits, the margin's words, ticks and leaders the reader can see, the
// spotlight's opacity and its holes, and any ring drawn over the drawing.
const CALLOUTS = `JSON.stringify((() => {
  const f = document.querySelector("#stage .frame").getBoundingClientRect();
  const spot = document.querySelector("#spot");
  const seen = (el) => getComputedStyle(el).visibility !== "hidden" && el.getBoundingClientRect().width > 0;
  const count = (sel) => [...document.querySelectorAll(sel)].filter(seen).length;
  return {
    box: [f.left, f.top, f.width, f.height].map(Math.round).join(),
    words: [...document.querySelectorAll("#margin .mw")].filter(seen).map((w) => [...w.querySelectorAll("[data-chrome-text]")].map((t) => t.dataset.chromeText).join(" ")),
    ticks: count("#margin .tick"),
    leads: count("#margin .lead path"),
    rings: count("#stage .mark-ring"),
    spot: seen(spot) ? Number(getComputedStyle(spot).opacity) * Number(spot.querySelector(".spot-body")?.getAttribute("opacity") ?? 0) : 0,
    holes: spot.querySelectorAll(".spot-holes")[0]?.children.length ?? 0,
  };
})())`;
const WORDS = ["Says when, not what", "New Undo", "Click Send"];

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
  const callouts = async () => JSON.parse(await P.evaluate(CALLOUTS));
  const hideChrome = async () => {
    await P.evaluate(
      `document.dispatchEvent(new KeyboardEvent("keydown", { key: ".", metaKey: true, bubbles: true }))`,
    );
    await wait(120);
  };
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
      const picks = fixture.states.flatMap((s, i) =>
        /pick: true/.test(s) ? [i] : [],
      );
      const path = build(dir, name, fixture);
      errors.length = 0;
      await P.viewport(1440, 900);
      await P.navigate(pathToFileURL(path).href);
      await wait(400);
      // Dark, so the frames' own scheme shows: light unless they ask.
      await P.evaluate(`document.documentElement.dataset.theme = "dark"`);
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
        if (v.compareLeft) fail(`frame ${i + 1} still has Compare's parts`);
        if (!v.stripShown) fail(`frame ${i + 1} hides the strip`);
        if (v.current.length !== 1 || v.current[0] !== i)
          fail(`frame ${i + 1} lights strip bars [${v.current}]`);
        if (!v.nameInside)
          fail(`frame ${i + 1} runs the group's name out of the strip`);
        if (grouped && v.pickBars.join() !== picks.join())
          fail(
            `frame ${i + 1} stars strip bars [${v.pickBars}], not [${picks}]`,
          );
        if (v.frameParam !== String(i + 1))
          fail(`frame ${i + 1} leaves ?frame=${v.frameParam}`);
        const dark = /dark: true/.test(fixture.states[i]);
        if (v.scheme !== (dark ? "dark" : "light"))
          fail(`frame ${i + 1} draws in the ${v.scheme} scheme on a dark page`);
        await key("ArrowRight");
      }
      if (tops.size !== 1)
        fail(`the title block changes height: ${[...tops].join(", ")}px`);
      if (bands.size !== 1)
        fail(`the bottom band changes height: ${[...bands].join(", ")}px`);
      if ((await read()).alerts)
        fail("the page lists a problem above the frames");

      // C and R do nothing now, on any frame.
      await go(0);
      await key("c");
      await key("r");
      const still = await read();
      if (still.stageFrames !== 1 || still.counter !== `1/${n}`)
        fail("C or R changes what the stage shows");
      if (still.barsShown.length !== n)
        fail(`the strip shows ${still.barsShown.length} of ${n} bars`);

      if (name === "callouts") {
        // The words beside the frame on every frame that has callouts, and
        // a frame that stays put from one frame of its size to the next,
        // callouts or none.
        await go(0);
        const first = await callouts();
        if (first.words.sort().join("|") !== [...WORDS].sort().join("|"))
          fail(`the margin reads [${first.words.join(" | ")}]`);
        if (first.ticks !== 3)
          fail(`the margin shows ${first.ticks} ticks, not 3`);
        if (first.leads || first.rings)
          fail("leaders or rings show with the callouts off");
        if (first.spot < 0.9 || first.holes !== 3)
          fail(
            `a frame arrives with the spotlight at ${first.spot.toFixed(2)} and ${first.holes} holes`,
          );
        for (const i of [1, 2]) {
          await go(i);
          const next = await callouts();
          if (next.box !== first.box)
            fail(`frame ${i + 1} sits at ${next.box}, frame 1 at ${first.box}`);
        }
        await go(3);
        if ((await callouts()).words.length !== 3)
          fail("a frame of another size loses its margin words");
        // The spotlight fades once the reader stops; A holds it and draws
        // leaders in place of the ticks.
        await go(0);
        await wait(2000);
        const faded = await callouts();
        if (faded.spot > 0.05)
          fail(`the spotlight is still at ${faded.spot.toFixed(2)} after 2s`);
        // Cmd+. takes the margin and the spotlight with the controls, with
        // A off and on.
        const bare = async (when) => {
          await hideChrome();
          const c = await callouts();
          if (c.words.length || c.ticks || c.leads || c.spot)
            fail(
              `Cmd+. ${when} leaves ${c.words.length} words, ${c.ticks} ticks, ${c.leads} leaders and the spotlight at ${c.spot.toFixed(2)}`,
            );
          await hideChrome();
        };
        await bare("with A off");
        await key("a");
        await wait(300);
        const held = await callouts();
        if (held.spot < 0.9 || held.leads !== 3 || held.ticks || held.rings)
          fail(
            `A shows the spotlight at ${held.spot.toFixed(2)}, ${held.leads} leaders, ${held.ticks} ticks and ${held.rings} rings`,
          );
        await bare("with A on");
        await key("a");
      }

      await P.evaluate(`document.querySelector("#viewer").close()`);
      await wait(100);
      const v = await read();
      if (v.open || v.stageFrames !== 0 || v.frameParam !== null)
        fail("closing leaves the viewer or ?frame= behind");

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
