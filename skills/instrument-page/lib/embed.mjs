// Embeds every image a page names by path or URL as a data: URI, and every font
// file a stylesheet names in url(). Called by check.mjs before the page is
// written; not read by the agent.
//
// A page travels as one file and a hosted copy may load images only as data:
// or blob:, so a picture left as a path or a link is a hole wherever the page
// goes. The agent writes the path to a file it saved, or the address of one it
// found, and this puts the bytes in. An image that cannot be read, is not an
// image, or weighs more than an image should stays as written and fails, so
// nothing oversized or broken is embedded where the next run cannot see it.
// Every image it did embed is reported too, with its size, so the agent knows
// what the page now carries without opening it.
//
// An image is judged by its bytes alone, never by its pixels against the box it
// renders in: a screenshot shown small opens full size in the page's viewer, so
// pixels past the box are what the reader zooms into.

import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The size past which an image was saved without care (references/images.md):
// a 1600-wide screenshot as JPEG or WebP, or a 720-wide photo, comes in well under.
const MAX_BYTES = 500 * 1024;
// The long edge past which a picture carries more than even the viewer shows.
const ENOUGH_EDGE = 1600;
// One weight of a Latin font as WOFF2 is 20 to 60 KB; a desktop OTF with every
// script and feature in it can pass this, and subsetting brings it back under.
const MAX_FONT_BYTES = 400 * 1024;
const FETCH_MS = 15_000;

const FONT_RECIPE =
  "subset it to the characters the page uses and save it as WOFF2 beside the page, then name that file (references/loading.md, A font of its own)";

const RECIPE =
  "save it again beside the page as JPEG quality 78 (a screenshot may stay PNG if that is smaller), at most 1600 pixels on the long edge for a screenshot and 720 for a photo, and name that file (references/images.md)";

const ENTITY = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&apos;": "'" };
const decode = (s) => s.replace(/&(amp|quot|#39|apos);/g, (e) => ENTITY[e]);

// What a reference is: embeddable here, or left for check.mjs to judge.
function target(ref, pageDir, allowed) {
  if (/^(data|blob):|^#/i.test(ref) || allowed.some((r) => r.test(ref)))
    return null;
  if (/^https?:\/\//i.test(ref)) return { url: decode(ref) };
  if (/^file:/i.test(ref)) return { path: fileURLToPath(decode(ref)) };
  if (/^[a-z][\w+.-]*:/i.test(ref) || ref.startsWith("//")) return null;
  const path = decode(ref).split(/[?#]/)[0];
  return { path: isAbsolute(path) ? path : resolve(pageDir, path) };
}

// The image type from the bytes themselves, whatever the file is called, so a
// renamed or linked file cannot carry anything else into a page.
function sniff(b) {
  const ascii = (from, to) => b.subarray(from, to).toString("latin1");
  if (b.length > 24 && ascii(1, 4) === "PNG") return "image/png";
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return "image/jpeg";
  if (/^GIF8[79]a/.test(ascii(0, 6))) return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && /avi[fs]/.test(ascii(8, 12)))
    return "image/avif";
  const head = b.subarray(0, 4096).toString("utf8");
  if (
    /^\s*(<\?xml[\s\S]*?\?>\s*)?(<!--[\s\S]*?-->\s*)*(<!doctype svg[^>]*>\s*)?<svg[\s>]/i.test(
      head,
    )
  )
    return "image/svg+xml";
  return null;
}

// The font type from the bytes, for a font file a stylesheet names in url().
function sniffFont(b) {
  const tag = b.subarray(0, 4).toString("latin1");
  if (tag === "wOF2") return "font/woff2";
  if (tag === "wOFF") return "font/woff";
  if (tag === "OTTO") return "font/otf";
  if (tag === "true" || tag === "\0\x01\0\0") return "font/ttf";
  return null;
}
const FONT_FILE = /\.(woff2?|otf|ttf)$/i;

// Pixel size read from the header, for the types a photo arrives as.
function dimensions(b, type) {
  if (type === "image/png") return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (type === "image/gif") return [b.readUInt16LE(6), b.readUInt16LE(8)];
  if (type === "image/webp") {
    const chunk = b.subarray(12, 16).toString("latin1");
    if (chunk === "VP8 ")
      return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (chunk === "VP8L") {
      const v = b.readUInt32LE(21);
      return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1];
    }
    if (chunk === "VP8X")
      return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
  }
  if (type === "image/jpeg")
    for (let i = 2; i + 9 < b.length;) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker)
      )
        return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  return null;
}

async function load(t) {
  if (t.path) return readFile(t.path);
  const response = await fetch(t.url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_MS),
  });
  if (!response.ok)
    throw new Error(
      `the server answered ${response.status} ${response.statusText}`.trim(),
    );
  return Buffer.from(await response.arrayBuffer());
}

// Every image reference in the page's own markup: <img src>, SVG <image href>,
// <video poster>, and CSS url().
const TAG = /<(img|image|video)\b[^>]*>/gi;
const URL_FN = /url\(\s*(["']?)([^"')]+)\1\s*\)/g;
const attrOf = (name) => {
  const tag = name.toLowerCase();
  const attr =
    tag === "img" ? "src" : tag === "video" ? "poster" : "(?:xlink:)?href";
  return new RegExp(`(\\s${attr}\\s*=\\s*)(["'])(.*?)\\2`, "i");
};

function references(html) {
  const found = [];
  for (const m of html.matchAll(TAG)) {
    const tag = m[0];
    const a = attrOf(m[1]).exec(tag);
    if (a) found.push({ where: `<${m[1]}>`, ref: a[3] });
  }
  for (const m of html.matchAll(URL_FN))
    found.push({ where: "CSS url()", ref: m[2].trim() });
  return found;
}

// Why a fetch failed, in the words that tell a blocked network from a bad URL.
const reason = (e) => {
  const cause = e?.cause?.code || e?.cause?.message;
  if (e?.name === "TimeoutError") return `no answer in ${FETCH_MS / 1000}s`;
  return cause ? `${e.message}: ${cause}` : e.message;
};

const kb = (n) => `${Math.max(1, Math.round(n / 1024))} KB`;
const FORMAT = {
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/gif": "GIF",
  "image/webp": "WebP",
  "image/avif": "AVIF",
  "image/svg+xml": "SVG",
  "font/woff2": "WOFF2 font",
  "font/woff": "WOFF font",
  "font/otf": "OTF font",
  "font/ttf": "TTF font",
};

export async function embedImages(html, pageDir, allowed, push) {
  const failed = new Set();
  const uris = new Map();
  const embedded = [];
  for (const { where, ref } of references(html)) {
    if (uris.has(ref) || failed.has(ref)) continue;
    const t = target(ref, pageDir, allowed);
    if (!t) continue;
    const fontName =
      where === "CSS url()" && FONT_FILE.test(ref.split(/[?#]/)[0]);
    const fail = (rule, measure, fix) => {
      failed.add(ref);
      push(rule, `${where} "${ref.slice(0, 80)}"`, measure, fix);
    };
    let bytes;
    try {
      bytes = await load(t);
    } catch (e) {
      fail(
        fontName ? "font-missing" : "image-missing",
        t.url
          ? `could not be downloaded (${reason(e)})`
          : `no file at ${relative(process.cwd(), t.path) || t.path}`,
        fontName
          ? "name the font file itself (an installed font is in the system's font folders, references/loading.md), or use a Google Font"
          : t.url
            ? "if this environment blocks downloads from scripts, save the image another way (your browser tool, curl, a file the user gave you) to a file beside the page and name that file; if the address is wrong, find the image's real address; otherwise draw a stand-in as inline SVG"
            : "name a file that exists, relative to the page, or draw a stand-in as inline SVG",
      );
      continue;
    }
    const font = where === "CSS url()" ? sniffFont(bytes) : null;
    if (font) {
      if (bytes.byteLength > MAX_FONT_BYTES) {
        fail(
          "font-oversize",
          `${kb(bytes.byteLength)} (${FORMAT[font]}), over ${kb(MAX_FONT_BYTES)}`,
          FONT_RECIPE,
        );
        continue;
      }
      const uri = `data:${font};base64,${bytes.toString("base64")}`;
      uris.set(ref, uri);
      embedded.push(
        `${ref.slice(0, 80)}: ${FORMAT[font]}, ${kb(uri.length)} in the page`,
      );
      continue;
    }
    const type = sniff(bytes);
    if (!type && fontName) {
      fail(
        "font-not-font",
        "these bytes are not a WOFF2, WOFF, OTF or TTF font",
        "name the font file itself, not a page that offers it",
      );
      continue;
    }
    if (!type) {
      fail(
        "image-not-image",
        "these bytes are not a PNG, JPEG, GIF, WebP, AVIF or SVG",
        "name the image itself, not a page that shows it",
      );
      continue;
    }
    if (type !== "image/svg+xml" && bytes.byteLength > MAX_BYTES) {
      const size = dimensions(bytes, type);
      fail(
        "image-oversize",
        `${kb(bytes.byteLength)}${size ? ` (${FORMAT[type]} ${size[0]}x${size[1]})` : ""}, over ${kb(MAX_BYTES)}`,
        RECIPE,
      );
      continue;
    }
    const uri = `data:${type};base64,${bytes.toString("base64")}`;
    uris.set(ref, uri);
    const size = type === "image/svg+xml" ? null : dimensions(bytes, type);
    const over = size && Math.max(...size) > ENOUGH_EDGE;
    embedded.push(
      `${ref.slice(0, 80)}: ${FORMAT[type]}${size ? ` ${size[0]}x${size[1]}` : ""}, ${kb(uri.length)} in the page${over ? `; more than the ${ENOUGH_EDGE} pixels on the long edge anyone sees, so resize it to save the reader the bytes (references/images.md)` : ""}`,
    );
  }
  const out = html
    .replace(TAG, (tag, name) =>
      tag.replace(attrOf(name), (all, lead, q, v) =>
        uris.has(v) ? `${lead}${q}${uris.get(v)}${q}` : all,
      ),
    )
    .replace(URL_FN, (all, q, v) =>
      uris.has(v.trim()) ? `url(${q}${uris.get(v.trim())}${q})` : all,
    );
  return { html: out, failed, embedded };
}
