// Build and check one or more pages. Called by ../page.mjs; not read by the agent.
//
// Build: strips what an earlier run wrote, draws any data-device elements
// (when the skill ships devices), and writes the foundation (fonts,
// stylesheet, behaviors, share widget) into <head>. Check: file rules, then
// Chrome at 1280x900 (light and dark), the 1104x590 link preview, and a
// 390-wide phone. Prints only FAIL lines and one closing line.
// Exit 0 pass, 1 FAIL, 2 bad command, 3 Chrome could not render (NOT checked).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launch, ChromeError } from "./chrome.mjs";
import { probe } from "./probe.mjs";
import { spec } from "./spec.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const CMD = process.env.PAGE_CMD || "node page.mjs";

export const LIMITS = {
  h1: 10,
  title: 10,
  para: 60,
  above: 45,
  prose: 40,
  firstDesk: 260,
  firstPreview: 150,
  tiny: 11,
};
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
  overlap:
    "give each label its own space: move one, wrap it, or shorten it; hiding it or shrinking it under 11px fails other rules",
  clipped:
    "let the box grow or the text wrap (drop the fixed width or height, nowrap, ellipsis, line-clamp), or shorten the words",
  offscreen:
    "find the fixed width, min-width or nowrap that pushes it out and make it fluid",
  "svg-outside":
    "move or shorten the label, or widen the viewBox so the label sits inside the drawing",
  "leaves-box":
    "shorten the label, break it into two lines, or put a number in the box and the name in a key beside the drawing",
  covered: "move the dot or the label so both show",
  tiny: "make it render at 11px or more on a 390px phone. Inside an SVG that scales down, put the words in HTML beside the drawing (a key or list), or give phones their own simpler version (.phone-only)",
  contrast:
    'color text with --ink, --ink-2 or --muted on --paper or --ground, and with --paper (SVG class="paper") on a colored fill; a fixed color or a faded opacity fails in one of the two themes',
  hscroll:
    "make that element fluid (max-width:100%, minmax(0,1fr), flex-wrap, no px min-width); overflow-x:hidden on body only cuts it off",
  "scroller-drawing":
    "a drawing must fit the phone: drop the min-width so it scales, and give phones a stacked or listed version of whatever is then too small",
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

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&rsquo;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
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

function fileChecks(own, push, inputText) {
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
    if (url.startsWith("data:") || url.startsWith("#")) continue;
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
    if (!ALLOWED.some((r) => r.test(m[2])))
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

// ---------- in-page rules ----------

function pageRules({ desk, prev, deskSpec, prevSpec, phone, phoneSpec }, push) {
  // Probe findings, FAIL rules only.
  const merged = new Map(),
    tiny = new Map();
  for (const [label, res] of [
    ["1280", desk],
    ["1280 dark", prev.dark],
    ["390", phone],
  ]) {
    for (const is of res.issues) {
      if (is.rule === "tiny") {
        const t = tiny.get(is.group) ?? { n: 0, min: 99, ex: [] };
        t.n++;
        t.min = Math.min(t.min, is.fs);
        if (t.ex.length < 3 && !t.ex.includes(is.text)) t.ex.push(is.text);
        tiny.set(is.group, t);
        continue;
      }
      const rule =
        is.rule === "scroller"
          ? is.kind === "drawing"
            ? "scroller-drawing"
            : null
          : is.rule;
      if (!rule || !FIX[rule]) continue;
      if (label === "1280 dark" && rule !== "contrast") continue;
      const key = `${rule}|${is.where}|${is.text}|${is.other ?? ""}`;
      if (!merged.has(key)) merged.set(key, { rule, is, at: [] });
      if (!merged.get(key).at.includes(label)) merged.get(key).at.push(label);
    }
  }
  for (const { rule, is, at } of merged.values())
    push(
      rule,
      `${is.where}${is.text ? ` "${is.text}"` : ""}`,
      `${is.measure} at ${at.join(" and ")}`,
      FIX[rule],
    );
  for (const [g, t] of tiny)
    push(
      "tiny",
      g,
      `${t.n} text(s) under ${LIMITS.tiny}px at 390 (smallest ${t.min.toFixed(1)}px): ${t.ex.map((x) => `"${x}"`).join(", ")}`,
      FIX.tiny,
    );
  for (const t of desk.tokens || [])
    push(
      "token",
      `var(${t})`,
      "this custom property is defined nowhere",
      FIX.token,
    );

  // Headline.
  const h1 = deskSpec.h1;
  if (h1 && h1.words > LIMITS.h1)
    push(
      "long-headline",
      `h1 "${h1.text}"`,
      `${h1.words} words`,
      `say the answer in ${LIMITS.h1} words or fewer; move the rest into the lede or the hero`,
    );

  // First screen and link preview: the headline plus the hero.
  for (const [name, s, need, what] of [
    ["first-screen", deskSpec, LIMITS.firstDesk, "the 1280x900 first screen"],
    ["preview", prevSpec, LIMITS.firstPreview, "the 1104x590 link preview"],
  ]) {
    if (!s.h1) continue;
    const miss = [];
    if (s.h1.bottom > s.H) miss.push(`the h1 ends at y=${s.h1.bottom}`);
    if (!s.hero) continue;
    const vis = Math.max(
      0,
      Math.min(s.hero.bottom, s.H) - Math.max(s.hero.top, 0),
    );
    if (!s.hero.containsH1 && vis < Math.min(need, s.hero.height))
      miss.push(
        `only ${vis}px of the hero (${s.hero.where}, starts at y=${s.hero.top}) shows`,
      );
    if (miss.length)
      push(
        name,
        what,
        miss.join("; "),
        `shorten the header (kicker, a headline of ${LIMITS.h1} words or fewer, a lede of one or two short sentences) and put the hero right after it, or make the hero itself shorter at the top`,
      );
  }
  if (!deskSpec.hero)
    push(
      "no-hero",
      "the page",
      'nothing is marked class="hero"',
      'mark the one thing the page is built around with class="hero"; it must show in the first screen',
    );
  if (deskSpec.aboveHero > LIMITS.above)
    push(
      "header-words",
      "above the hero",
      `${deskSpec.aboveHero} words before the hero starts ("${deskSpec.aboveHeroText}")`,
      `keep what comes before the hero to ${LIMITS.above} words: a kicker, the headline, one short lede; the rest goes below the hero`,
    );

  // Paragraphs and prose share.
  const long = deskSpec.blocks
    .filter((b) => !b.heading && b.words > LIMITS.para)
    .sort((a, b) => b.words - a.words);
  for (const b of long)
    push(
      "long-paragraph",
      `${b.where} "${b.text}"`,
      `${b.words} words`,
      `split it, cut it to ${LIMITS.para} words or fewer, or turn it into something seen: a list, a table, a labeled drawing`,
    );
  if (deskSpec.share && deskSpec.share.pct > LIMITS.prose)
    push(
      "prose-heavy",
      "the first two screens (y 0..1800 at 1280)",
      `prose (blocks of 15+ words) is ${deskSpec.share.pct}% of what is shown`,
      `bring it under ${LIMITS.prose}%: turn sentences into the hero, a chart, a short list, a table or labels, and move explanation below or into one <details>`,
    );

  for (const [label, sp] of [
    ["1280", deskSpec],
    ["390", phoneSpec],
  ])
    for (const x of (sp.spills || []).slice(0, 4))
      push(
        "spills",
        `${x.where} "${x.text}"`,
        `runs ${x.by}px outside its box (${x.box}) at ${label}`,
        "let it wrap or set it smaller so it fits its box (a long figure in a narrow card is the usual cause), or give the box more width",
      );
  if ((deskSpec.bigFigures || []).length > 2)
    push(
      "figure-wall",
      "the first two screens",
      `${deskSpec.bigFigures.length} figures set big: ${deskSpec.bigFigures
        .slice(0, 5)
        .map((t) => `"${t}"`)
        .join(", ")}`,
      "a row of big numbers is a dashboard, not an answer: keep at most two big figures and show the comparison they make as a chart, bars on one scale, or a short table",
    );

  // Devices' own truth guards.
  for (const f of deskSpec.dvFails)
    push(
      "device-guard",
      `${f.where} (${f.device})`,
      f.msg,
      `fix the device's data as the line says (run: ${CMD} device ${f.device})`,
    );
}

// ---------- report ----------

function report(file, fails, shots) {
  const out = [];
  const per = new Map();
  for (const f of fails) {
    per.set(f.rule, (per.get(f.rule) || 0) + 1);
    if (per.get(f.rule) <= 6)
      out.push(`FAIL ${f.rule}: ${f.where}: ${f.measure} -> ${f.fix}`);
  }
  for (const [r, n] of per)
    if (n > 6) out.push(`FAIL ${r}: ${n - 6} more like the above -> same fix`);
  const pics = shots.length ? ` Pictures: ${shots.join(", ")}.` : "";
  if (fails.length)
    out.push(
      `${basename(file)}: ${fails.length} FAIL. Fix each by fixing what it names, then run again.${pics}`,
    );
  else
    out.push(
      `${basename(file)}: pass.${pics} If you can view images, look at the preview and phone pictures; if you cannot, you are done (never decode them with a script).`,
    );
  console.log(out.join("\n"));
}

// ---------- main ----------

export async function main(argv, { prerender = null, cmd } = {}) {
  const files = [],
    inputFiles = [];
  let timeoutS = 60;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--inputs")
      while (argv[i + 1] && !argv[i + 1].startsWith("--"))
        inputFiles.push(argv[++i]);
    else if (a === "--timeout") timeoutS = Number(argv[++i]) || timeoutS;
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

  // Build every file first, so the pages are usable even if Chrome fails.
  const built = [];
  for (const f of files) {
    const path = resolve(f);
    const fails = [];
    const push = (rule, where, measure, fix) =>
      fails.push({ rule, where, measure, fix });
    const own0 = stripBuilt(readFileSync(path, "utf8"));
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
    const html = assemble(own, styles, css, js);
    writeFileSync(path, html);
    const st = fileChecks(own0, push, inputText);
    const defined = new Set(
      [...(css + own).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]),
    );
    const maybe = [
      ...new Set([...own0.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1])),
    ].filter((t) => !defined.has(t));
    built.push({ path, fails, push, st, maybe });
  }

  let chrome = null;
  const timer = setTimeout(
    () => {
      console.log(
        `FAIL chrome-timeout: Chrome did not finish within ${timeoutS}s -> the page is built but NOT checked. Run the command once more; if it times out again, tell the user plainly that the page is unchecked.`,
      );
      chrome?.close();
      process.exit(3);
    },
    timeoutS * 1000 * files.length,
  );
  timer.unref();
  try {
    chrome = await launch();
  } catch (e) {
    for (const b of built)
      for (const f of b.fails)
        console.log(`FAIL ${f.rule}: ${f.where}: ${f.measure} -> ${f.fix}`);
    console.log(
      `FAIL chrome: ${e instanceof ChromeError ? "" : "unexpected error: "}${e.message} -> the layout, first-screen, phone and quote checks did NOT run, so the page is NOT checked. If Chrome is installed elsewhere, set CHROME=/path/to/chrome and rerun; if you cannot, tell the user plainly that the page is unchecked.`,
    );
    return 3;
  }
  let exit = 0;
  try {
    for (const b of built) {
      const P = chrome.page,
        url = pathToFileURL(b.path).href,
        stem = b.path.replace(/\.html?$/i, "");
      const runProbe = (o) =>
        P.evaluate(`(${probe.toString()})(${JSON.stringify(o)})`, 30000);
      const runSpec = (o) =>
        P.evaluate(`(${spec.toString()})(${JSON.stringify(o)})`, 30000);
      const frame = () =>
        P.evaluate(
          "new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))",
        );
      const shots = [];
      await P.viewport(1280, 900);
      await P.navigate(url);
      const desk = await runProbe({
        collect: true,
        desktop: true,
        contrast: true,
        tokens: b.maybe,
      });
      const deskSpec = await runSpec({ H: 900 });
      const fullH = Math.min(desk.docH, 4000);
      await P.viewport(1280, fullH);
      await frame();
      writeFileSync(
        `${stem}.desktop.png`,
        await P.screenshot({ width: 1280, height: fullH }),
      );
      shots.push(`${basename(stem)}.desktop.png`);
      await P.viewport(1280, 900, { dark: true });
      await frame();
      // Let color transitions on a theme change finish, or contrast is read mid-fade.
      await new Promise((r) => setTimeout(r, 600));
      const dark = await runProbe({ contrast: true });
      await P.viewport(1104, 590);
      await P.navigate(url);
      const prevSpec = await runSpec({ H: 590 });
      writeFileSync(
        `${stem}.preview.png`,
        await P.screenshot({ width: 1104, height: 590 }),
      );
      shots.push(`${basename(stem)}.preview.png`);
      await P.viewport(390, 844, { mobile: true });
      await P.navigate(url);
      const phone = await runProbe({
        collect: false,
        phone: true,
        tiny: LIMITS.tiny,
      });
      const phoneSpec = await runSpec({ H: 844 });
      const ph = Math.min(phone.docH, 5000);
      if (ph !== 844) await P.viewport(390, ph, { mobile: true });
      await frame();
      writeFileSync(
        `${stem}.phone.png`,
        await P.screenshot({ width: 390, height: ph }),
      );
      shots.push(`${basename(stem)}.phone.png`);
      pageRules(
        { desk, prev: { dark }, deskSpec, prevSpec, phone, phoneSpec },
        b.push,
      );
      quoteChecks(deskSpec.quotes, inputs, b.push);
      if (process.env.PAGE_DEBUG)
        console.log(
          JSON.stringify({
            h1: deskSpec.h1,
            hero: deskSpec.hero,
            prevHero: prevSpec.hero,
            prevH1: prevSpec.h1,
            share: deskSpec.share,
            above: deskSpec.aboveHero,
          }),
        );
      report(b.path, b.fails, shots);
      if (b.fails.length) exit = 1;
    }
  } catch (e) {
    console.log(
      `FAIL chrome: ${e.message} -> the page is NOT checked. Run once more; if it fails again, tell the user plainly that the page is unchecked and why.`,
    );
    exit = 3;
  } finally {
    chrome.close();
    clearTimeout(timer);
  }
  return exit;
}
