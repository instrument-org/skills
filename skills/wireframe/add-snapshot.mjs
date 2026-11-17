#!/usr/bin/env node
// node <skill>/add-snapshot.mjs <page.html> <name.json>... [--remove <name>]
// Puts snapshots from snapshot.js into a wireframe page made by new.mjs, so
// its frames can draw them with snap("<name>", edit). Each file's name is its
// snapshot's name: pricing.json becomes snap("pricing"). It takes what
// `agent-browser eval --stdin < <skill>/snapshot.js` printed, or a snapshot's
// HTML on its own. A snapshot added again under the same name replaces the
// last one. Each stylesheet is stored once however many snapshots share it,
// and the frames' script, snapshot-frames.js, goes in once. The page is
// rewritten in place and nothing else is written.
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SHARE_LIMIT = 8 * 1024 * 1024;
const DATA =
  /<script type="application\/json" id="wireframe-snapshots">([\s\S]*?)<\/script>\n?/;
const RUNTIME = /<script id="wireframe-snapshot-frames">[\s\S]*?<\/script>\n?/;

/** A snapshot from what snapshot.js returned, as printed JSON or as its HTML alone. */
export function readSnapshot(text) {
  const t = text.trimStart();
  let snap = {};
  if (t.startsWith("{") || t.startsWith('"')) {
    const v = JSON.parse(t);
    snap = typeof v === "string" ? { html: v } : v;
  } else snap = { html: text };
  if (typeof snap.html !== "string" || !/<html[\s>]/i.test(snap.html))
    throw new Error(
      "not a snapshot: expected snapshot.js's output, or an HTML document",
    );
  const meta = /<meta name="wireframe-snapshot" content="(\d+)x(\d+)/.exec(
    snap.html,
  );
  return {
    w: snap.w ?? Number(meta?.[1] ?? 1280),
    h: snap.h ?? Number(meta?.[2] ?? 800),
    url: snap.url ?? /data-url="([^"]*)"/.exec(snap.html)?.[1] ?? "",
    title: snap.title ?? "",
    bg: snap.bg ?? "",
    notes: snap.notes ?? [],
    html: snap.html,
  };
}

/** The page's snapshots with the new ones in, each large stylesheet stored once and none left unused. */
export function addSnapshots(store, added) {
  const out = { sheets: { ...store.sheets }, pages: { ...store.pages } };
  for (const [name, s] of Object.entries(added)) {
    const html = s.html.replace(/<style>([\s\S]*?)<\/style>/g, (all, css) => {
      if (css.length < 2000) return all;
      const h = createHash("sha1").update(css).digest("hex").slice(0, 12);
      out.sheets[h] = css;
      return `<style data-sheet="${h}"></style>`;
    });
    out.pages[name] = {
      w: s.w,
      h: s.h,
      url: s.url,
      title: s.title,
      ...(s.bg ? { bg: s.bg } : {}),
      html,
    };
  }
  const used = new Set(
    Object.values(out.pages).flatMap((p) =>
      [...p.html.matchAll(/<style data-sheet="(\w+)">/g)].map((m) => m[1]),
    ),
  );
  for (const h of Object.keys(out.sheets))
    if (!used.has(h)) delete out.sheets[h];
  return out;
}

/**
 * The page with its snapshot data and the frames' script in place just before
 * the shell's last block. That block keeps the page as written for the share
 * widget and only sees what comes before it, so anything after it would be
 * missing from a published copy.
 */
export function writeInto(page, store, runtime) {
  // Every < written as \u003c, so nothing in a snapshot can end the script early.
  const json = JSON.stringify(store).replace(/</g, "\\u003c");
  const blocks = `<script type="application/json" id="wireframe-snapshots">${json}</script>\n<script id="wireframe-snapshot-frames">${runtime}</script>\n`;
  const rest = page.replace(DATA, "").replace(RUNTIME, "");
  // A page built from a part of frames draws them while it is read, so they go before
  // its runtime, which counts the part's lines from where it starts in the page.
  const frames = rest.indexOf('<script id="wf-runtime">');
  if (frames >= 0) {
    const out = rest.slice(0, frames) + blocks + rest.slice(frames);
    const partLine = out.slice(0, out.indexOf("<!-- the part -->\n")).split("\n").length + 1;
    return out.replace(/partLine: \d+/, `partLine: ${partLine}`);
  }
  const end = rest.lastIndexOf("</body>");
  const at = rest.lastIndexOf("<!-- shell:start -->", end);
  if (end < 0 || at < rest.indexOf("<body"))
    throw new Error(
      "no shell block at the end of the page's body; is it a wireframe page from new.mjs?",
    );
  return rest.slice(0, at) + blocks + "    " + rest.slice(at);
}

export function readStore(page) {
  const m = DATA.exec(page);
  return m ? JSON.parse(m[1]) : { sheets: {}, pages: {} };
}

const main = () => {
  const args = process.argv.slice(2);
  const remove = [];
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--remove") remove.push(args[++i]);
    else files.push(args[i]);
  }
  const [pagePath, ...inputs] = files;
  if (!pagePath || (inputs.length === 0 && remove.length === 0)) {
    console.log(
      "usage: node <skill>/add-snapshot.mjs <page.html> <name.json>... [--remove <name>]",
    );
    process.exit(2);
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const page = readFileSync(pagePath, "utf8");
  if (!page.includes('id="rack"')) {
    console.log(
      `${pagePath} is not a wireframe page with frames; make one with new.mjs first`,
    );
    process.exit(2);
  }
  const added = {};
  for (const file of inputs) {
    const name = basename(file, extname(file));
    if (!/^[\w-]+$/.test(name)) {
      console.log(
        `${file}: name the file for the snapshot, in letters, digits, - and _ (pricing.json is snap("pricing"))`,
      );
      process.exit(2);
    }
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      console.log(
        `${file}: no such file. Pass each snapshot's file, and nothing else: its name is the file's (pricing.json is snap("pricing")).`,
      );
      process.exit(2);
    }
    added[name] = readSnapshot(text);
  }
  let store = addSnapshots(readStore(page), added);
  for (const name of remove) delete store.pages[name];
  store = addSnapshots(store, {});
  const out = writeInto(
    page,
    store,
    readFileSync(join(here, "snapshot-frames.js"), "utf8"),
  );
  writeFileSync(pagePath, out);
  for (const [name, s] of Object.entries(added)) {
    const size =
      s.w === 1280 && s.h === 800
        ? ""
        : `; give its frames w: ${s.w}, h: ${s.h} (or ...snap.size("${name}"))`;
    console.log(
      `snap("${name}"): ${s.w}x${s.h}, ${Math.round(s.html.length / 1024)} KB${s.url ? `, from ${s.url}` : ""}${size}`,
    );
    for (const note of s.notes) console.log(`  ${note}`);
  }
  for (const name of remove) console.log(`removed snap("${name}")`);
  const bytes = Buffer.byteLength(out);
  console.log(
    `${pagePath}: ${Object.keys(store.pages).length} snapshots, ${Object.keys(store.sheets).length} shared stylesheets, ${(bytes / 1024 / 1024).toFixed(1)} MB` +
      (bytes > SHARE_LIMIT
        ? `; over the 8 MB a shared link takes, so remove a snapshot you don't draw from`
        : ""),
  );
};

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === realpathSync(process.argv[1])
)
  main();
