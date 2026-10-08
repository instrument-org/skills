// Build and check one or more pages. Called by ../page.mjs; not read by the agent.
//
// Build: strips what an earlier run wrote, embeds the images it names by
// path or URL (embed.mjs), draws any data-device elements
// (when the skill ships devices), and writes the foundation (fonts,
// stylesheet, behaviors, share widget) into <head>. Check: every rule that
// can be read from the file itself, over a small parse of its HTML. What
// only layout can show (overlaps, clipping, phone width and text size,
// contrast, the first screen) is lib/probe.js, run in a browser.
// Starts no process and opens no browser; reaches the network only to download
// an image the page names by URL. Prints one line per image embedded, FAIL
// lines, and one closing line with the page's size. Exit 0 pass, 1 FAIL, 2 bad
// command.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { embedImages } from "./embed.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const CMD = process.env.PAGE_CMD || "node page.mjs";

export const LIMITS = {
  h1: 10,
  title: 10,
  para: 60,
  above: 45,
  prose: 40,
};
// What the share host takes; the 413 message in share.mjs and share.py names it too.
const SHARE_MAX_BYTES = 8 * 1024 * 1024;
const FEELS = ["calm", "urgent", "warm", "crew", "ledger", "festive"];
const SHAPES = ["card", "read", "sheet", "wall"];
const ALLOWED = [
  /^https:\/\/fonts\.googleapis\.com\//,
  /^https:\/\/fonts\.gstatic\.com\//,
  /^https:\/\/tryinstrument\.com\/page\.js$/,
  /^https:\/\/cdn\.jsdelivr\.net\/npm\/(@[\w.-]+\/)?[\w.-]+@\d+\.\d+\.\d+([-+][\w.-]+)?(\/|$)/,
  /^https:\/\/unpkg\.com\/(@[\w.-]+\/)?[\w.-]+@\d+\.\d+\.\d+([-+][\w.-]+)?(\/|$)/,
  /^https:\/\/esm\.sh\/(@[\w.-]+\/)?[\w.-]+@\d+\.\d+\.\d+([-+][\w.-]+)?(\/|$)/,
  /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/[\w.-]+\/\d+\.\d+\.\d+([-\w.]+)?\//,
];
const FONTS =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400..800&family=JetBrains+Mono:wght@400;600&family=Roboto+Serif:ital,wght@0,400;0,500;1,400;1,500&display=swap";
const ICONS =
  "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css";
const MARK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 520 520'%3E%3Crect width='520' height='520' rx='136' fill='%230b6056'/%3E%3Cpath d='M436.675 331.78C408.481 401.395 340.226 450.5 260.5 450.5C180.774 450.5 112.519 401.395 84.3252 331.78H436.675ZM446.977 223.906C449.287 235.748 450.5 247.982 450.5 260.5C450.5 274.88 448.899 288.886 445.872 302.352H314.801C293.139 302.351 275.578 284.791 275.578 263.129C275.578 241.467 293.139 223.906 314.801 223.906H446.977ZM210.199 223.906C231.861 223.906 249.422 241.467 249.422 263.129C249.422 284.791 231.861 302.352 210.199 302.352H75.1279C72.1008 288.886 70.5 274.88 70.5 260.5C70.5 247.982 71.7131 235.748 74.0234 223.906H210.199ZM260.5 70.5C342.227 70.5 411.9 122.101 438.721 194.5H82.2793C109.1 122.101 178.773 70.5 260.5 70.5Z' fill='%23fff'/%3E%3C/svg%3E";
const SHARE = '<script async src="https://tryinstrument.com/page.js"></script>';

const FIX = {
  token:
    "use a token the stylesheet defines (--ink --ink-2 --muted --line --accent --good --warn --bad --c1..--c8 and their -wash) or define it in your <style>",
};

// ---------- build ----------

function stripBuilt(html) {
  return html
    .replace(/<!--dv:start[^>]*-->[\s\S]*?<!--dv:end-->/g, "")
    .replace(/<!-- foundation:start[\s\S]*?<!-- foundation:end -->\n?/, "")
    .replace(/<script data-snap>[^<]*<\/script>\n?/g, "");
}

function assemble(own, styles, css, js) {
  const block = [
    "<!-- foundation:start (written by page.mjs; edit the page, not this block) -->",
    /<meta\s+charset/i.test(own) ? "" : '<meta charset="utf-8">',
    /<meta\s+name=["']viewport/i.test(own)
      ? ""
      : '<meta name="viewport" content="width=device-width, initial-scale=1">',
    /<link[^>]+rel=["']icon/i.test(own)
      ? ""
      : `<link rel="icon" href="${MARK}">`,
    own.includes("tryinstrument.com/page.js") ? "" : SHARE,
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link rel="stylesheet" href="${FONTS}">`,
    /class="[^"]*\bph\b/.test(own)
      ? `<link rel="stylesheet" href="${ICONS}">`
      : "",
    `<style>\n${css}\n</style>`,
    styles.size
      ? `<style data-dv-styles>\n@layer devices {\n${[...styles.entries()].map(([k, v]) => `/* ${k} */\n${v}`).join("\n")}\n}\n</style>`
      : "",
    `<script>\n${js}\n</script>`,
    "<!-- foundation:end -->",
  ]
    .filter(Boolean)
    .join("\n");
  let html = /^\s*<!doctype html>/i.test(own) ? own : "<!doctype html>\n" + own;
  if (/<head[^>]*>/i.test(html))
    html = html.replace(/<head[^>]*>\n?/i, (m) => m + block + "\n");
  else if (/<html[^>]*>/i.test(html))
    html = html.replace(
      /<html[^>]*>\n?/i,
      (m) => m + "<head>\n" + block + "\n</head>\n",
    );
  // The share widget publishes the page as written: snapshot it before the page's first script runs.
  const bodyAt = html.search(/<body[\s>]/i);
  if (bodyAt > -1) {
    const m = html
      .slice(bodyAt)
      .match(
        /<script(?![^>]*type=["'](?!module|text\/javascript)[^"']*["'])[\s>]/i,
      );
    const at = m ? bodyAt + m.index : html.search(/<\/body>/i);
    if (at > -1)
      html =
        html.slice(0, at) +
        "<script data-snap>__instrumentSnap(document.currentScript)</script>\n" +
        html.slice(at);
  }
  return html;
}

// ---------- text helpers ----------

const ENTITIES = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  lsquo: "‘",
  rsquo: "'",
  ldquo: "“",
  rdquo: "”",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  middot: "·",
  times: "×",
  minus: "−",
  thinsp: " ",
  ensp: " ",
  emsp: " ",
};
const decode = (s) =>
  s.replace(/&(#x[\da-f]+|#\d+|[a-z]+\d*);/gi, (m, e) =>
    e[0] === "#"
      ? String.fromCodePoint(
          e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1),
        )
      : (ENTITIES[e] ?? m),
  );
const visibleText = (html) =>
  decode(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ");
const wordsOf = (s) =>
  (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,:/%$€£-]*/gu) || []).length;
// A stream of lowercase words, punctuation and line breaks dropped, so a quote is found however it was wrapped.
const stream = (s) =>
  " " +
  (
    s
      .toLowerCase()
      .replace(/[‘’ʼ`´]/g, "'")
      .replace(/[“”«»„]/g, '"')
      .match(/[\p{L}\p{N}]+(?:'[\p{L}]+)?/gu) || []
  ).join(" ") +
  " ";

// ---------- file checks ----------

function fileChecks(own, push, inputText, reported = new Set()) {
  const htmlTag = own.match(/<html\b[^>]*>/i)?.[0] ?? "";
  const shape = htmlTag.match(/data-shape\s*=\s*"([^"]*)"/)?.[1];
  const feel = htmlTag.match(/data-feel\s*=\s*"([^"]*)"/)?.[1];
  if (!htmlTag)
    push(
      "no-html",
      "the file",
      "no <html> tag",
      'start from the skeleton in SKILL.md: <html lang="en" data-shape="read" data-feel="calm">',
    );
  else if (!SHAPES.includes(shape ?? ""))
    push(
      "shape",
      "<html>",
      shape ? `data-shape="${shape}" is not a shape` : "no data-shape",
      `use one of ${SHAPES.join(", ")}`,
    );
  if (feel && !FEELS.includes(feel))
    push(
      "feel",
      "<html>",
      `data-feel="${feel}" is not a feel`,
      `use one of ${FEELS.join(", ")}`,
    );
  const direction = own.match(/<!--\s*direction:([\s\S]*?)-->/)?.[1];
  if (!direction)
    push(
      "direction",
      "under <!doctype html>",
      "no <!-- direction: ... --> comment",
      "write it first: reader, point (the buried point in one line), conflicts, shape, feel, hero",
    );
  else if (!/\bpoint\s*=/.test(direction))
    push(
      "direction",
      "<!-- direction -->",
      'it has no point="..."',
      'add point="what the inputs imply that nobody asked, in one line"; the headline comes from it',
    );

  const title = decode(
    own.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "",
  ).trim();
  if (!title)
    push(
      "title",
      "<head>",
      "no <title>",
      "the title is the link's name in Slack: the answer in 10 words or fewer",
    );
  else if (wordsOf(title) > LIMITS.title)
    push(
      "long-title",
      "<title>",
      `"${title}" is ${wordsOf(title)} words`,
      `cut it to ${LIMITS.title} words or fewer; it is set big in the link unfurl`,
    );
  const desc = own
    .match(
      /<meta\s+name=["']description["']\s+content=(?:"([^"]*)"|'([^']*)')/i,
    )
    ?.slice(1)
    .find((x) => x !== undefined);
  if (desc === undefined)
    push(
      "description",
      "<head>",
      'no <meta name="description">',
      "add one sentence (40 to 160 characters) a person reads in the unfurl: the answer with its key figure",
    );
  else if (decode(desc).trim().length < 30)
    push(
      "description",
      '<meta name="description">',
      `"${desc}" is too short`,
      "write one full sentence with the answer and its key figure",
    );

  const h1s = (own.match(/<h1[\s>]/gi) || []).length;
  if (h1s !== 1)
    push(
      "h1-count",
      "the page",
      `${h1s} <h1> elements`,
      "one h1, and it says the answer",
    );

  const text = visibleText(own);
  if (/—/.test(own))
    push(
      "em-dash",
      "the page",
      `${(own.match(/—/g) || []).length} em dash(es)`,
      "rewrite with a colon, comma, period or parentheses",
    );
  for (const [re, what] of [
    [/\[\[[^\]]{1,80}\]\]/g, "an unfilled [[slot]]"],
    [/\blorem ipsum\b/gi, "lorem ipsum"],
    [/\b(TODO|FIXME|TBD|PLACEHOLDER)\b/g, "a to-do marker"],
  ])
    for (const m of text.matchAll(re))
      if (!inputText.toUpperCase().includes(m[0].toUpperCase()))
        push(
          "placeholder",
          `"${text.slice(Math.max(0, m.index - 20), m.index + 30).trim()}"`,
          what,
          "replace it with real content or delete it",
        );

  for (const m of own.matchAll(
    /<(script|link|img|iframe|source|video|audio)\b[^>]*?\s(src|href)\s*=\s*["']([^"']+)["']/gi,
  )) {
    const [, tag, , url] = m;
    if (
      tag.toLowerCase() === "link" &&
      !/rel=["']?(stylesheet|preload|modulepreload)/.test(m[0])
    )
      continue;
    if (url.startsWith("data:") || url.startsWith("#") || reported.has(url))
      continue;
    if (!/^https?:/.test(url))
      push(
        "local-file",
        `<${tag}>`,
        `loads the local file "${url}"`,
        "inline it: a data: URI, inline SVG, or the data in a JSON island",
      );
    else if (!ALLOWED.some((r) => r.test(url)))
      push(
        "host",
        `<${tag}>`,
        `loads ${url}`,
        "only fonts.googleapis/gstatic and jsdelivr /npm/, unpkg, esm.sh or cdnjs at an exact version may load; inline everything else",
      );
  }
  for (const m of own.matchAll(/url\((['"]?)(https?:[^)'"]+)\1\)/g))
    if (!ALLOWED.some((r) => r.test(m[2])) && !reported.has(m[2]))
      push("host", "CSS url()", `loads ${m[2]}`, "inline it as a data: URI");
  weekdays(text, inputText, push);
  return { shape, feel, title };
}

const MON = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DOWNAME = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
function weekdays(text, inputText, push) {
  const count = (s) => {
    const c = {};
    for (const m of s.matchAll(/\b(20[2-4]\d)\b/g))
      c[m[1]] = (c[m[1]] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0];
  };
  const year = Number(
    count(text) || count(inputText) || new Date().getFullYear(),
  );
  const hasLate = /\b(Nov|Dec)[a-z]*\.?\s+\d/.test(text);
  const seen = new Set();
  const test = (raw, dow, mon, day, yr) => {
    const want = DOW.indexOf(dow.slice(0, 3).toLowerCase());
    const years = yr
      ? [Number(yr)]
      : mon === 0 && hasLate
        ? [year, year + 1]
        : [year];
    if (
      years.some((y) => new Date(y, mon, day).getDay() === want) ||
      seen.has(raw)
    )
      return;
    seen.add(raw);
    push(
      "weekday",
      `"${raw}"`,
      `${MON[mon][0].toUpperCase() + MON[mon].slice(1)} ${day}, ${years[0]} is a ${DOWNAME[new Date(years[0], mon, day).getDay()]}`,
      "compute weekdays with a script, never by hand, and fix every date on the page",
    );
  };
  const D = "(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\\.?,?";
  const M = "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?";
  for (const m of text.matchAll(
    new RegExp(
      `\\b${D}\\s+${M}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s+(20\\d\\d))?`,
      "g",
    ),
  ))
    test(m[0], m[1], MON.indexOf(m[2].toLowerCase()), +m[3], m[4]);
  for (const m of text.matchAll(
    new RegExp(`\\b${D}\\s+(\\d{1,2})\\s+${M}\\b`, "g"),
  ))
    test(m[0], m[1], MON.indexOf(m[3].toLowerCase()), +m[2]);
  for (const m of text.matchAll(
    new RegExp(`\\b${M}\\s+(\\d{1,2})\\s*\\(${D}\\)`, "g"),
  ))
    test(m[0], m[3], MON.indexOf(m[1].toLowerCase()), +m[2]);
}

// ---------- quotes ----------

function quoteChecks(quotes, inputs, push) {
  if (!quotes.length) return;
  if (!inputs.length) {
    push(
      "quotes-unchecked",
      quotes[0].where,
      `${quotes.length} quote(s) on the page and no --inputs given`,
      "rerun with --inputs <every input file> request.md so each quote is checked word for word against its source",
    );
    return;
  }
  const files = inputs.map((f) => ({ name: f.name, s: stream(f.text) }));
  for (const q of quotes) {
    // Words inside quote marks are the quote; with none, the whole element is.
    const marked = [...q.text.matchAll(/[“"]([^”"]{3,})[”"]/g)].map(
      (m) => m[1],
    );
    const body = marked.length ? marked.join(" ... ") : q.text;
    const parts = body
      .replace(/^[\s"“”'‘’«»]+|[\s"“”'‘’«»]+$/g, "")
      .split(/\s*(?:\.\.\.|…|\[[^\]]*\])\s*/)
      .map(stream)
      .filter((p) => p.trim());
    if (!parts.length) continue;
    const hit = files.find((f) => parts.every((p) => f.s.includes(p)));
    const short = q.text.length > 70 ? q.text.slice(0, 67) + "..." : q.text;
    if (!hit) {
      push(
        "quote",
        `${q.where} "${short}"`,
        "these words are not in any input, word for word",
        "copy the exact words from the input (an ellipsis may join two exact pieces), or say it as your own summary without quote marks; if it is not a quote at all, use <aside> or <p>, not <blockquote>",
      );
      continue;
    }
    if (q.device && !q.src) {
      push(
        "quote-source",
        `${q.where} "${short}"`,
        "the device drew a quote with no source",
        'give the quote its speaker in the device data ("by" or "source"), as the input names them',
      );
      continue;
    }
    if (q.src) {
      // The speaker is the cite's names (capitalized words that are not roles, months or weekdays); a cite with none is not checked.
      const GENERIC =
        /^(survey|respondent|customer|client|user|member|parent|staff|team|board|the|a|an|via|from|in|on|at|email|chat|thread|message|meeting|notes|comment|review|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|mon|tue|wed|thu|fri|sat|sun)[a-z]*$/i;
      const names = (q.src.match(/\p{Lu}[\p{L}'-]+/gu) || [])
        .filter((w) => !GENERIC.test(w))
        .map((w) => w.toLowerCase());
      const at = hit.s.indexOf(parts[0]);
      const near = hit.s.slice(
        Math.max(0, at - 2400),
        at + parts[0].length + 200,
      );
      if (names.length && !names.some((n) => near.includes(" " + n + " ")))
        push(
          "quote-source",
          `${q.where} "${short}"`,
          `"${q.src}" is not who says this in ${hit.name}`,
          'credit the quote to the person the input shows saying it, with the time or date the input gives; for an unnamed source write a role ("a Pro monthly customer")',
        );
    }
  }
}

// ---------- a small HTML parse ----------

// Enough of a parse to read the page the way a reader meets it: elements with
// their attributes, text in document order, raw-text elements skipped whole.
// Unclosed p, li, td, tr, dt, dd and option close the way browsers close them.
const VOID = new Set(
  "area base br col embed hr img input link meta param source track wbr".split(
    " ",
  ),
);
const RAW = new Set(["script", "style", "textarea", "title", "template"]);
const CLOSES_P =
  /^(address|article|aside|blockquote|details|div|dl|fieldset|figcaption|figure|footer|form|h[1-6]|header|hgroup|hr|main|menu|nav|ol|p|pre|section|table|ul)$/;
const IMPLIED = {
  li: ["li"],
  dt: ["dt", "dd"],
  dd: ["dt", "dd"],
  td: ["td", "th"],
  th: ["td", "th"],
  tr: ["tr", "td", "th"],
  option: ["option"],
};
const SCOPE = /^(ul|ol|dl|table|tbody|thead|tfoot|select|datalist)$/;

function parse(html) {
  let n = 0;
  const root = { tag: "#root", attrs: {}, kids: [], parent: null, i: n++ };
  let at = root;
  const close = (tag) => {
    for (let e = at; e && e !== root; e = e.parent)
      if (e.tag === tag) {
        at = e.parent;
        return;
      }
  };
  const re =
    /<!--[\s\S]*?-->|<![^>]*>|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=/>"']+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;
  let last = 0;
  const text = (t) => {
    if (t) at.kids.push({ text: decode(t), parent: at, i: n++ });
  };
  for (let m; (m = re.exec(html));) {
    text(html.slice(last, m.index));
    last = re.lastIndex;
    if (!m[2]) continue;
    const tag = m[2].toLowerCase();
    if (m[1]) {
      close(tag);
      continue;
    }
    if (at.tag === "p" && CLOSES_P.test(tag)) at = at.parent;
    for (const t of IMPLIED[tag] ?? [])
      for (let e = at; e && e !== root && !SCOPE.test(e.tag); e = e.parent)
        if (e.tag === t) {
          at = e.parent;
          break;
        }
    const attrs = {};
    for (const a of m[3].matchAll(
      /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g,
    ))
      attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? a[4] ?? "");
    const el = { tag, attrs, kids: [], parent: at, i: n++ };
    at.kids.push(el);
    if (RAW.has(tag)) {
      const end = html.slice(last).search(new RegExp(`</${tag}\\s*>`, "i"));
      const body = end < 0 ? html.slice(last) : html.slice(last, last + end);
      el.kids.push({ text: body, parent: el, i: n++, raw: true });
      last = end < 0 ? html.length : last + end;
      re.lastIndex = last;
    } else if (!VOID.has(tag) && !m[4]) at = el;
  }
  text(html.slice(last));
  return root;
}

const all = (node, out = []) => {
  for (const k of node.kids ?? []) {
    out.push(k);
    all(k, out);
  }
  return out;
};
const textOf = (node, skip = () => false) =>
  node.text !== undefined
    ? node.raw
      ? ""
      : node.text
    : skip(node)
      ? " "
      : (node.kids ?? []).map((k) => textOf(k, skip)).join("");
const closest = (node, test) => {
  for (let e = node; e && e.tag !== "#root"; e = e.parent)
    if (e.tag && test(e)) return e;
  return null;
};
const classes = (el) => (el.attrs?.class ?? "").split(/\s+/);
const hasClass = (el, c) => classes(el).includes(c);
const where = (el) => {
  const parts = [];
  for (let e = el; e && e.tag !== "#root" && e.tag !== "body"; e = e.parent) {
    if (parts.length >= 3) break;
    if (e.attrs.id) {
      parts.unshift("#" + e.attrs.id);
      break;
    }
    const cls = classes(e).filter(Boolean).slice(0, 2);
    parts.unshift(e.tag + (cls.length ? "." + cls.join(".") : ""));
  }
  return parts.join(" > ") || el.tag;
};
const clip = (t, n) => t.replace(/\s+/g, " ").trim().slice(0, n);

// Laid out inline by default, so their text belongs to the block around them.
const INLINE = new Set(
  "a abbr b bdi bdo br cite code data del dfn em i ins kbd label mark q s samp small span strong sub sup time u var wbr".split(
    " ",
  ),
);
// Text a reader never sees as prose: code, drawings, things marked hidden.
const SKIP = (el) =>
  /^(script|style|template|noscript|svg|pre|code|head)$/.test(el.tag) ||
  el.attrs["aria-hidden"] === "true";
// Not on the first screens at 1280: hidden, folded away, or for another medium.
const OFFSCREEN = (el) =>
  "hidden" in el.attrs ||
  hasClass(el, "print-only") ||
  hasClass(el, "phone-only") ||
  (el.tag !== "summary" &&
    el.parent?.tag === "details" &&
    !("open" in el.parent.attrs));

// What the page says, read from the file: the headline, the hero, every text
// block in document order, drawings, quotes and device guards.
function readPage(own) {
  const root = parse(own);
  const nodes = all(root);
  const els = nodes.filter((x) => x.tag);
  const body = els.find((e) => e.tag === "body") ?? root;
  const h1 = els.find((e) => e.tag === "h1");
  const hero = els.find(
    (e) =>
      (hasClass(e, "hero") || "data-hero" in e.attrs) && !closest(e, OFFSCREEN),
  );
  const blocks = new Map();
  for (const t of nodes) {
    if (t.text === undefined || t.raw || !t.text.trim()) continue;
    if (closest(t.parent, SKIP)) continue;
    let b = t.parent;
    while (b && b !== body && b.tag !== "#root" && INLINE.has(b.tag))
      b = b.parent;
    if (!b || b === body || b.tag === "#root") continue;
    if (!blocks.has(b)) blocks.set(b, { el: b, i: t.i, text: "" });
    blocks.get(b).text += t.text;
  }
  const words = (b) => wordsOf(b.text);
  const list = [...blocks.values()].map((b) => {
    const w = words(b);
    const heading = /^h[1-6]$/.test(b.el.tag);
    return {
      ...b,
      words: w,
      heading,
      prose: !heading && (/^(li|td)$/.test(b.el.tag) ? w >= 30 : w >= 15),
      offscreen: !!closest(b.el, OFFSCREEN),
      footer: !!closest(b.el, (e) => e.tag === "footer"),
      inHero: !!(hero && closest(b.el, (e) => e === hero)),
    };
  });
  const drawings = els.filter(
    (e) =>
      /^(svg|img|canvas|video|iframe)$/.test(e.tag) &&
      !closest(e.parent, (a) => a.tag === "svg") &&
      !closest(e, OFFSCREEN) &&
      // An icon, not a drawing.
      !(Number(e.attrs.width) < 40 || Number(e.attrs.height) < 24),
  );
  // Words before the hero starts: every text node ahead of it in the file.
  let above = 0,
    aboveText = [];
  if (hero && !(h1 && closest(h1, (e) => e === hero)))
    for (const t of nodes) {
      if (t.i >= hero.i) break;
      if (t.text === undefined || t.raw || !t.text.trim()) continue;
      if (closest(t.parent, (e) => SKIP(e) || OFFSCREEN(e))) continue;
      above += wordsOf(t.text);
      aboveText.push(clip(t.text, 40));
    }
  const quotes = els
    .filter((e) => /^(blockquote|q)$/.test(e.tag) || "data-quote" in e.attrs)
    .filter(
      (q) =>
        !closest(
          q.parent,
          (a) => /^(blockquote|q)$/.test(a.tag) || "data-quote" in a.attrs,
        ),
    )
    .map((q) => {
      const credit = (e) =>
        /^(cite|footer|figcaption|small)$/.test(e.tag) ||
        hasClass(e, "who") ||
        "data-src-label" in e.attrs;
      const inner = all(q).find((e) => e.tag === "cite");
      const fig = closest(q, (e) => e.tag === "figure");
      const figCite = fig
        ? all(fig).find(
            (e) =>
              e.tag === "cite" && closest(e, (a) => a.tag === "figcaption"),
          )
        : null;
      return {
        where: where(q),
        text: clip(textOf(q, credit), 4000),
        src: clip(
          q.attrs["data-src"] ||
            (inner && textOf(inner)) ||
            (figCite && textOf(figCite)) ||
            "",
          200,
        ),
        device: !!closest(q, (e) => "data-device" in e.attrs),
      };
    })
    .filter((q) => q.text);
  const dvFails = els
    .filter((e) => "data-dv-fail" in e.attrs)
    .map((f) => {
      const host = closest(f, (e) => "data-device" in e.attrs);
      return {
        device: host ? host.attrs["data-device"] : "?",
        where: where(host ?? f),
        msg: f.attrs["data-dv-fail"],
      };
    });
  return {
    h1: h1 && clip(textOf(h1, SKIP), 160),
    hero,
    heroWhere: hero && where(hero),
    blocks: list,
    drawings,
    above,
    aboveText: aboveText.join(" / ").slice(0, 120),
    quotes,
    dvFails,
  };
}

// Prose share, approximated from the file. What matters is how much of the
// first two 1280x900 screens is prose; without layout, every block counts its
// words (a heading twice, for its size) and each drawing counts as 150 words
// of non-prose, about what a half-screen chart displaces at reading width, in
// file order until 500 words' worth, about two screens. The hero counts as at
// least one drawing, since a script often draws it from data at load. Prose
// is a block of 15+ words, or 30+ in a list item or a table cell.
const SCREENS = 500,
  DRAWING = 150;
function proseShare(page) {
  const inHero = (el) => !!(page.hero && closest(el, (e) => e === page.hero));
  let hero = 0;
  const items = [
    ...page.blocks
      .filter((b) => !b.offscreen && !b.footer)
      .map((b) => ({
        el: b.el,
        i: b.i,
        units: b.heading ? 2 * b.words : b.words,
        prose: b.prose,
      })),
    ...page.drawings.map((d) => ({ el: d, i: d.i, units: DRAWING })),
  ].filter((it) => !(inHero(it.el) && (hero += it.units)));
  if (page.hero)
    items.push({
      i: page.hero.i,
      units: Math.max(DRAWING, hero),
      prose: false,
    });
  items.sort((a, b) => a.i - b.i);
  let total = 0,
    prose = 0;
  for (const it of items) {
    if (total >= SCREENS) break;
    const u = Math.min(it.units, SCREENS - total);
    total += u;
    if (it.prose) prose += u;
  }
  return total ? Math.round((100 * prose) / total) : 0;
}

// ---------- page rules read from the file ----------

function pageRules(page, push) {
  if (page.h1 && wordsOf(page.h1) > LIMITS.h1)
    push(
      "long-headline",
      `h1 "${page.h1}"`,
      `${wordsOf(page.h1)} words`,
      `say the answer in ${LIMITS.h1} words or fewer; move the rest into the lede or the hero`,
    );
  if (!page.hero)
    push(
      "no-hero",
      "the page",
      'nothing is marked class="hero"',
      'mark the one thing the page is built around with class="hero"; it must show in the first screen',
    );
  if (page.above > LIMITS.above)
    push(
      "header-words",
      "above the hero",
      `${page.above} words before the hero starts ("${page.aboveText}")`,
      `keep what comes before the hero to ${LIMITS.above} words: a kicker, the headline, one short lede; the rest goes below the hero`,
    );
  for (const b of page.blocks
    .filter((b) => !b.heading && b.words > LIMITS.para)
    .sort((a, b) => b.words - a.words))
    push(
      "long-paragraph",
      `${where(b.el)} "${clip(b.text, 70)}"`,
      `${b.words} words`,
      `split it, cut it to ${LIMITS.para} words or fewer, or turn it into something seen: a list, a table, a labeled drawing`,
    );
  const pct = proseShare(page);
  if (pct > LIMITS.prose)
    push(
      "prose-heavy",
      "the first two screens",
      `prose (blocks of 15+ words) is about ${pct}% of what comes first, counting words, with a drawing as 150`,
      `bring it under ${LIMITS.prose}%: turn sentences into the hero, a chart, a short list, a table or labels, and move explanation below or into one <details>`,
    );
  for (const f of page.dvFails)
    push(
      "device-guard",
      `${f.where} (${f.device})`,
      f.msg,
      `fix the device's data as the line says (run: ${CMD} device ${f.device})`,
    );
}

// ---------- report ----------

function report(file, fails, embedded, bytes) {
  const out = embedded.map((line) => `embedded ${line}`);
  const per = new Map();
  for (const f of fails) {
    per.set(f.rule, (per.get(f.rule) || 0) + 1);
    if (per.get(f.rule) <= 6)
      out.push(`FAIL ${f.rule}: ${f.where}: ${f.measure} -> ${f.fix}`);
  }
  for (const [r, n] of per)
    if (n > 6) out.push(`FAIL ${r}: ${n - 6} more like the above -> same fix`);
  const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
  const size =
    bytes > SHARE_MAX_BYTES
      ? `It is ${mb(bytes)}, over the ${mb(SHARE_MAX_BYTES)} a link takes: shrink its images or data before sharing it.`
      : `It is ${bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : mb(bytes)}.`;
  if (fails.length)
    out.push(
      `${basename(file)}: ${fails.length} FAIL. Fix each by fixing what it names, then run again. ${size}`,
    );
  else
    out.push(
      `${basename(file)}: pass, as far as the file shows. ${size} Layout is not checked yet: run lib/probe.js on it in a browser (SKILL.md, step 5).`,
    );
  console.log(out.join("\n"));
}

// ---------- main ----------

export async function main(argv, { prerender = null, cmd } = {}) {
  const files = [],
    inputFiles = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--inputs")
      while (argv[i + 1] && !argv[i + 1].startsWith("--"))
        inputFiles.push(argv[++i]);
    else if (a.startsWith("--")) {
      console.log(`unknown flag ${a}`);
      return 2;
    } else files.push(a);
  }
  if (!files.length) {
    console.log(
      `usage: ${cmd} page.html [more.html] --inputs <every input file> request.md`,
    );
    return 2;
  }
  for (const f of [...files, ...inputFiles])
    if (!existsSync(f)) {
      console.log(
        `FAIL no-file: ${f}: does not exist -> check the path (run from the task folder)`,
      );
      return 2;
    }
  const inputs = inputFiles.map((f) => ({
    name: basename(f),
    text: readFileSync(f, "utf8"),
  }));
  const inputText = inputs.map((f) => f.text).join("\n");
  const css = readFileSync(join(here, "foundation.css"), "utf8");
  const js = readFileSync(join(here, "foundation.js"), "utf8");

  let exit = 0;
  for (const f of files) {
    const path = resolve(f);
    const fails = [];
    const push = (rule, where, measure, fix) =>
      fails.push({ rule, where, measure, fix });
    const embedded = await embedImages(
      stripBuilt(readFileSync(path, "utf8")),
      dirname(path),
      ALLOWED,
      push,
    );
    const own0 = embedded.html;
    let own = own0,
      styles = new Map();
    if (prerender) {
      const r = await prerender(own0, {
        push: (level, rule, where, measure, fix) =>
          level === "FAIL" && push(rule, where, measure, fix),
      });
      own = r.html;
      styles = r.styles;
    }
    const built = assemble(own, styles, css, js);
    writeFileSync(path, built);
    fileChecks(own0, push, inputText, embedded.failed);
    const page = readPage(own);
    pageRules(page, push);
    quoteChecks(page.quotes, inputs, push);
    // A token used and declared nowhere, unless a script names it (and so may set it).
    const defined = new Set(
      [...(css + own).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]),
    );
    const used = [...own0.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]);
    for (const t of new Set(used))
      if (
        !defined.has(t) &&
        own0.split(t).length - 1 === used.filter((u) => u === t).length
      )
        push(
          "token",
          `var(${t})`,
          "this custom property is defined nowhere",
          FIX.token,
        );
    report(path, fails, embedded.embedded, Buffer.byteLength(built));
    if (fails.length) exit = 1;
  }
  return exit;
}
