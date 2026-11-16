// Drives the wireframe skill's enlarged view in headless Chromium through
// fixture pages, and prints one FAIL line per broken promise: no script
// errors; bands that keep one height from frame to frame; a title block
// and strip that follow the open frame; a frame that fits as wide with
// callouts as without; a spotlight that fades, held by A, which also draws
// the callouts as tags over the frame, all hidden by Cmd+.; and frames drawn from a snapshot,
// edited by name, with the callouts their edits ask for and a missed target
// that names what came close. Each fixture is a page new.mjs
// writes, so the check runs the main.html an agent would get.
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
const addSnapshot = resolve(here, "../../skills/wireframe/add-snapshot.mjs");

// A snapshot as snapshot.js writes one, small enough to read: a pricing page
// with two plans.
const PRICING = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="wireframe-snapshot" content="1280x800" data-url="https://example.com/pricing"><title>Pricing</title>
<style>body{margin:0;padding:48px;font:16px/1.5 system-ui,sans-serif;color:#18181b}.card{display:inline-block;width:320px;margin-right:24px;padding:24px;border:1px solid #e4e4e7;border-radius:12px;vertical-align:top}.btn{display:inline-block;padding:8px 16px;border-radius:8px;background:#064e3b;color:#fff;text-decoration:none}</style>
</head><body><h1>Pricing</h1><div class="card"><h2>Basic</h2><p><b>$10</b> / month</p><a class="btn" href="#">Choose Basic</a></div><div class="card"><h2>Pro</h2><p><b>$40</b> / month</p><a class="btn" href="#">Choose Pro</a></div></body></html>`;
const SNAP_EDITS = `($) => {
  $({ role: "heading", text: "Pricing" }).text("Plans").fresh();
  $({ contains: "/ month", nth: 2 }).after("<p>or $384 a year</p>");
  $("or $384 a year").note("billed once");
  $("Choose Pro").note("starts a trial");
}`;
const SNAP_WORDS = ["New", "billed once", "starts a trial"];

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
  tall: {
    groups: `{ A: { mark: "A", name: "Long page", note: "Tall." }, B: { mark: "B", name: "Other page", note: "Tall too." } }`,
    states: [
      withGroup("A", frame("Home", 1280, 3200)),
      withGroup("A", frame("Pricing", 1280, 1800)),
      withGroup("B", frame("Home", 1280, 3000)),
      withGroup("B", frame("Pricing", 1280, 1600)),
    ],
  },
  snapshots: {
    groups: "{}",
    snapshots: { pricing: PRICING },
    states: [
      `{ title: "Pricing", note: ${JSON.stringify(SHORT)}, ...snap.size("pricing"), body: snap("pricing") }`,
      `{ title: "Plans", note: ${JSON.stringify(LONG)}, ...snap.size("pricing"), body: snap("pricing", ${SNAP_EDITS}) }`,
      frame("Drawn", 1280, 800),
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
  // A page that declares its own W and H, which once redeclared the
  // viewer's and blanked the page; a frame with no size takes the page's.
  // It also raises the kind of error event a ResizeObserver loop does, with
  // the page's own address and no thrown value, which must draw no notice.
  "own-size": {
    prelude:
      'const W = 1280, H = 300; dispatchEvent(new ErrorEvent("error", { message: "ResizeObserver loop completed with undelivered notifications.", filename: location.href }));',
    groups: "{}",
    states: [
      frame("Strip", "W", "H"),
      `{ title: "Unsized", note: ${JSON.stringify(SHORT)}, body: \`<div class="h-full bg-card p-8">Unsized</div>\` }`,
    ],
  },
};

const build = (dir, name, { prelude = "", groups, states, snapshots = {} }) => {
  const path = join(dir, `${name.replace(/\W+/g, "-")}.html`);
  execFileSync("node", [newPage, path, `Check: ${name}`], {
    cwd: dir,
    stdio: "ignore",
  });
  const page = readFileSync(path, "utf8");
  const a = page.indexOf("        // ---- the frames");
  const b = page.indexOf("        // ---- render");
  const frames = `        // ---- the frames\n${prelude ? `        ${prelude}\n` : ""}        const groups = ${groups};\n        const states = [\n${states.map((s) => `          ${s},`).join("\n")}\n        ];\n\n`;
  writeFileSync(path, page.slice(0, a) + frames + page.slice(b));
  const files = Object.entries(snapshots).map(([snap, html]) => {
    const file = join(dir, `${snap}.html`);
    writeFileSync(file, html);
    return file;
  });
  if (files.length)
    execFileSync("node", [addSnapshot, path, ...files], { stdio: "ignore" });
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
    alerts: document.querySelectorAll("body > [role=alert]").length,
    frameParam: new URLSearchParams(location.search).get("frame"),
  };
})())`;

// The callouts over the open frame and the spotlight on it: where the
// frame sits, the tags' words, outlines and leaders the reader can see, the
// spotlight's opacity and its holes.
const CALLOUTS = `JSON.stringify((() => {
  const f = document.querySelector("#stage .frame").getBoundingClientRect();
  const spot = document.querySelector("#spot");
  const seen = (el) => getComputedStyle(el).visibility !== "hidden" && el.getBoundingClientRect().width > 0;
  const count = (sel) => [...document.querySelectorAll(sel)].filter(seen).length;
  return {
    box: [f.left, f.top, f.width, f.height].map(Math.round).join(),
    words: [...document.querySelectorAll("#tags .tg")].filter(seen).map((w) => [...w.querySelectorAll("[data-chrome-text]")].map((t) => t.dataset.chromeText).join(" ")),
    outlines: count("#tags .tg-box"),
    leads: count("#tags .tg-lead"),
    spot: seen(spot) ? Number(getComputedStyle(spot).opacity) * Number(spot.querySelector(".spot-body")?.getAttribute("opacity") ?? 0) : 0,
    holes: spot.querySelectorAll(".spot-holes")[0]?.children.length ?? 0,
  };
})())`;
// A bare NEW reads New, and a bare click draws its outline with no tag.
const WORDS = ["Says when, not what", "New"];

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
      // A snapshot frame lays out in its own document after the page.
      await wait(fixture.snapshots ? 1200 : 400);
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

      if (name === "own-size") {
        const sizes = await P.evaluate(
          `[...document.querySelectorAll("#rack .frame")].map((f) => f.dataset.w + "x" + f.dataset.h).join()`,
        );
        if (sizes !== "1280x300,1280x300")
          fail(`frames take sizes ${sizes}, not the page's own W and H`);
      }

      if (name === "tall") {
        // A frame far taller than the screen opens at its true width, from
        // its top, between the bands, and scrolls; zooming out reaches the
        // whole of it, and 0 brings it back to its width.
        const at = async () =>
          JSON.parse(
            await P.evaluate(`JSON.stringify((() => {
              const v = document.querySelector("#viewer");
              const f = document.querySelector("#stage .frame").getBoundingClientRect();
              return {
                w: Math.round(f.width), h: Math.round(f.height), top: Math.round(f.top), bottom: Math.round(f.bottom),
                bandTop: document.querySelector("#viewer-top").offsetHeight,
                bandBottom: innerHeight - document.querySelector("#viewer-bottom").offsetHeight,
                scrolls: v.hasAttribute("data-scrolls"), zoomed: v.hasAttribute("data-zoomed"),
                map: !document.querySelector("#viewer-map").hidden,
              };
            })())`),
          );
        const settle = () => wait(400);
        await go(0);
        await settle();
        let t = await at();
        if (t.w !== 1280 || t.top !== t.bandTop)
          fail(
            `a tall frame opens ${t.w}px wide at y=${t.top}, not 1280px at the top band (${t.bandTop})`,
          );
        if (!t.scrolls || t.zoomed || !t.map)
          fail(
            `a tall frame at fit reads scrolls=${t.scrolls} zoomed=${t.zoomed} map=${t.map}`,
          );
        await P.evaluate(
          `document.querySelector("#stage").dispatchEvent(new WheelEvent("wheel", { deltaY: 500, bubbles: true, cancelable: true }))`,
        );
        await settle();
        const wheeled = await at();
        if (wheeled.top !== t.top - 500)
          fail(
            `a wheel of 500 moves a tall frame from y=${t.top} to y=${wheeled.top}`,
          );
        await key("End");
        await settle();
        t = await at();
        if (Math.abs(t.bottom - t.bandBottom) > 1)
          fail(
            `End leaves a tall frame's foot at y=${t.bottom}, not the bottom band (${t.bandBottom})`,
          );
        await key("Home");
        await settle();
        t = await at();
        if (t.top !== t.bandTop) fail(`Home leaves a tall frame at y=${t.top}`);
        for (let k = 0; k < 12; k++) await key("-");
        await settle();
        t = await at();
        if (t.h > t.bandBottom - t.bandTop || !t.zoomed)
          fail(
            `zoomed all the way out, a tall frame is ${t.h}px tall in ${t.bandBottom - t.bandTop}px (zoomed=${t.zoomed})`,
          );
        await key("0");
        await settle();
        t = await at();
        if (t.w !== 1280 || t.zoomed || !t.scrolls)
          fail(`0 brings a tall frame back ${t.w}px wide, zoomed=${t.zoomed}`);
        await go(1);
        await settle();
        t = await at();
        if (t.top !== t.bandTop)
          fail(
            `the next tall frame of another size opens at y=${t.top}, not its top`,
          );
      }

      if (name === "snapshots") {
        // The edits' callouts as tags, measured inside the frame's own
        // document, and none on the unedited frame.
        await go(1);
        await wait(600);
        await key("a");
        await wait(300);
        const edited = await callouts();
        await key("a");
        if (edited.words.sort().join("|") !== [...SNAP_WORDS].sort().join("|"))
          fail(`the edited snapshot's tags read [${edited.words.join(" | ")}]`);
        if (edited.holes !== 3)
          fail(
            `the edited snapshot's spotlight has ${edited.holes} holes, not 3`,
          );
        await go(0);
        await wait(300);
        await key("a");
        await wait(300);
        if ((await callouts()).outlines)
          fail("the unedited snapshot has callouts");
        await key("a");
        const drawn = await P.evaluate(
          `[...document.querySelectorAll("#rack .snap > iframe")].map((f) => f.contentDocument?.querySelector("h1")?.textContent ?? "").join()`,
        );
        if (drawn !== "Pricing,Plans")
          fail(`the grid's snapshot frames read [${drawn}]`);
        // A missed target draws its frame as the error and throws once the
        // page has drawn, so a person sees why and a check still fails.
        const missedBy = (edit) =>
          P.evaluate(`new Promise((done) => {
            let html = "";
            const on = (e) => {
              removeEventListener("error", on);
              e.preventDefault();
              done({ thrown: e.message, shown: html.includes("data-snap-broken") ? html.replace(/<[^>]+>/g, " ") : "" });
            };
            addEventListener("error", on);
            html = snap("pricing", ${edit});
            setTimeout(() => done({ thrown: "no error", shown: "" }), 1000);
          })`);
        const missed = await missedBy(`($) => $("Choose Plus")`);
        if (!/nothing matches.*Close: .*Choose Pro/.test(missed.thrown))
          fail(`a missed target throws "${missed.thrown}"`);
        if (!/can't be drawn.*nothing matches/.test(missed.shown))
          fail(`a missed target's frame reads "${missed.shown.slice(0, 120)}"`);
        // The Share button publishes the page as the shell's last script
        // kept it, so the snapshots and their script must be in that copy.
        const shared = await P.evaluate(
          `["wireframe-snapshots", "wireframe-snapshot-frames"].filter((id) => !(window.__instrumentSource ?? "").includes(\`id="\${id}"\`))`,
        );
        if (shared.length)
          fail(
            `the copy the Share button publishes lacks ${shared.join(" and ")}`,
          );
        const several = await missedBy(`($) => $({ contains: "/ month" })`);
        if (!/matches 2 elements.*nth/.test(several.thrown))
          fail(`a target matching two throws "${several.thrown}"`);
      }

      if (name === "callouts") {
        // At rest the spotlight alone, no words; and a frame that sits
        // where a frame of its size without callouts does.
        await go(0);
        const first = await callouts();
        if (first.words.length || first.outlines || first.leads)
          fail(
            `with A off a frame shows ${first.words.length} tags, ${first.outlines} outlines and ${first.leads} leaders`,
          );
        // The spotlight waits until the reader rests on the frame.
        if (first.spot > 0.05)
          fail(
            `a frame arrives with the spotlight already at ${first.spot.toFixed(2)}`,
          );
        await wait(400);
        const rested = await callouts();
        if (rested.spot < 0.9 || rested.holes !== 3)
          fail(
            `a frame rested on shows the spotlight at ${rested.spot.toFixed(2)} and ${rested.holes} holes`,
          );
        for (const i of [1, 2]) {
          await go(i);
          const next = await callouts();
          if (next.box !== first.box)
            fail(`frame ${i + 1} sits at ${next.box}, frame 1 at ${first.box}`);
        }
        // The spotlight fades once the reader stops.
        await go(0);
        await wait(2400);
        const faded = await callouts();
        if (faded.spot > 0.05)
          fail(`the spotlight is still at ${faded.spot.toFixed(2)} after 2.4s`);
        // Cmd+. takes the tags and the spotlight with the controls, with
        // A off and on.
        const bare = async (when) => {
          await hideChrome();
          const c = await callouts();
          if (c.words.length || c.outlines || c.leads || c.spot)
            fail(
              `Cmd+. ${when} leaves ${c.words.length} tags, ${c.outlines} outlines, ${c.leads} leaders and the spotlight at ${c.spot.toFixed(2)}`,
            );
          await hideChrome();
        };
        await bare("with A off");
        // A holds the spotlight and draws the tags and an outline round
        // every named element.
        await key("a");
        await wait(300);
        const held = await callouts();
        if (held.words.sort().join("|") !== [...WORDS].sort().join("|"))
          fail(`A's tags read [${held.words.join(" | ")}]`);
        if (held.spot < 0.9 || held.outlines !== 3)
          fail(
            `A shows the spotlight at ${held.spot.toFixed(2)} and ${held.outlines} outlines`,
          );
        await bare("with A on");
        await go(3);
        if ((await callouts()).words.length !== WORDS.length)
          fail("a frame of another size loses its tags");
        await key("a");
      }

      await P.evaluate(`document.querySelector("#viewer").close()`);
      await wait(100);
      const v = await read();
      if (v.open || v.stageFrames !== 0 || v.frameParam !== null)
        fail("closing leaves the viewer or ?frame= behind");

      if (name === "callouts") {
        // In the grid, A draws the same tags over the tiles without moving
        // one: words where a tile is wide enough, outlines everywhere.
        const tiles = `JSON.stringify([...document.querySelectorAll("#rack .frame")].map((f) => Object.values(f.getBoundingClientRect().toJSON()).map(Math.round).join()))`;
        const before = await P.evaluate(tiles);
        await key("a");
        await wait(300);
        const grid = JSON.parse(
          await P.evaluate(
            `JSON.stringify({ tags: document.querySelectorAll("#rack > .tags .tg").length, outlines: document.querySelectorAll("#rack > .tags .tg-box").length })`,
          ),
        );
        if (grid.outlines !== 9 || grid.tags < 2)
          fail(
            `A in the grid draws ${grid.tags} tags and ${grid.outlines} outlines`,
          );
        if ((await P.evaluate(tiles)) !== before)
          fail("A in the grid moves the tiles");
        await key("a");
      }

      for (const e of new Set(errors)) fail(`script error: ${e}`);
    }

    // A page that redeclares a kit helper fails to parse, and says so in a
    // chip over the empty grid rather than showing a quiet page.
    const broken = build(dir, "broken", {
      prelude: "const win = 1;",
      groups: "{}",
      states: [frame("Window", 1280, 800)],
    });
    await P.navigate(pathToFileURL(broken).href);
    await wait(400);
    const notice = await P.evaluate(
      `document.querySelector("body > [role=alert]")?.textContent ?? ""`,
    );
    if (
      !/line \d+: SyntaxError: .*'win' has already been declared/.test(notice)
    )
      fails.push(
        `FAIL broken: a page that fails to parse shows "${notice}", not the error and its line`,
      );
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
