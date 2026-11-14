import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { findChrome, launch } from "../tools/page-check/chrome.mjs";

// How a page's foundation, and the wireframe shell, break lines around a
// link's site icon and inline code, measured glyph by glyph in a downloaded
// Chromium at every third width from 320 to 440 and at 1280. Skipped where none
// is downloaded, as on CI. The icon service is answered with a stand-in so the
// check runs offline.
const SKILLS = join(import.meta.dirname, "../skills");
const link = (text: string) => `<a href="https://github.com/o/r">${text}</a>`;
const PROSE = `<p id="case-paren">Highlights, notes, stamps and filled form values in a PDF never draw (${link("render-plugin.ts:74")}, ${link("engine.ts:9927")}) at all.</p>
<p id="case-url">The address is ${link("https://github.com/embedpdf/embed-pdf-viewer/blob/main/packages/plugin-render/src/lib/render-plugin.ts")} today.</p>`;
const LISTS = `<header><hgroup><h1>Lines break like text</h1></hgroup></header>
<section class="hero"><ol class="letters">
<li id="case-letter" data-one-line><b>Hidden.</b> Set <code>withForms</code> in ${link("plugin.ts:74")} now.</li>
<li id="case-letter-long"><b>Studio hides existing annotations today.</b> The render plugin is registered with no config, so <code>withAnnotations</code> and <code>withForms</code> default to false and nothing draws (${link("render-plugin.ts:74")}, ${link("engine.ts:9927")}). Adding the annotation plugin draws them.</li>
</ol></section>
<section><h2>Steps, pins and a summary</h2>
<ol class="steps"><li id="case-step" data-one-line><b>Run it.</b> Call <code>check()</code> from ${link("engine.ts:9927")}.</li></ol>
<ol class="pins"><li id="case-pin" data-one-line>Opens over <code>ChatSurface</code> and ${link("its sources")}.</li></ol>
<details><summary id="case-summary" data-one-line>Why <code>withForms</code> is off in ${link("EmbedPDF")}</summary><p>It costs a pass.</p></details>
${PROSE}
<p id="case-code">The engine exports <code>EPDFText_RedactInRectsWithAnnotationsAndFormsAndMetadata</code> from <code>packages/engines/src/lib/pdfium/engine.ts</code> for this.</p>
</section>`;
const icons = (html: string) => (html.match(/<a /g) ?? []).length;

// Runs in the page: one line per problem at the current width, and how many
// links wear an icon.
function measure() {
  const problems: string[] = [];
  const mid = (r: DOMRect) => (r.top + r.bottom) / 2;
  const charBox = (t: Text, i: number) => {
    const range = document.createRange();
    range.setStart(t, i);
    range.setEnd(t, i + 1);
    return range.getClientRects()[0];
  };
  const texts = (el: Element) => {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const out: Text[] = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode())
      if (n instanceof Text) out.push(n);
    return out;
  };
  for (const el of document.querySelectorAll("[id^=case-]")) {
    if (el.scrollWidth > el.clientWidth + 1)
      problems.push(`${el.id}: runs past its column`);
    // Line starts, from every visible glyph.
    const lines: { y: number; x: number }[] = [];
    for (const t of texts(el))
      for (let i = 0; i < t.data.length; i++) {
        const box = charBox(t, i);
        if (!box || !t.data[i]?.trim()) continue;
        const line = lines.find((l) => Math.abs(l.y - mid(box)) < 6);
        if (line) line.x = Math.min(line.x, box.left);
        else lines.push({ y: mid(box), x: box.left });
      }
    const xs = lines.map((l) => l.x);
    if (Math.max(...xs) - Math.min(...xs) > 25)
      problems.push(`${el.id}: lines start at different edges`);
    if (
      innerWidth >= 1280 &&
      el.hasAttribute("data-one-line") &&
      lines.length > 1
    )
      problems.push(`${el.id}: one short sentence takes ${lines.length} lines`);
  }
  let icons = 0;
  for (const a of document.querySelectorAll("[id^=case-] a")) {
    const t = texts(a).find((n) => n.data.trim());
    const box = a.getClientRects()[0];
    const first = t && charBox(t, t.data.search(/\S/));
    if (!box || !first) continue;
    if (box.left < first.left - 8) icons++;
    if (Math.abs(mid(box) - mid(first)) > 6)
      problems.push(
        `${a.closest("[id]")?.id}: an icon ends a line apart from its link`,
      );
    const before = a.previousSibling;
    if (before instanceof Text && before.data.endsWith("(")) {
      const paren = charBox(before, before.data.length - 1);
      if (paren && Math.abs(mid(paren) - mid(first)) > 6)
        problems.push(
          `${a.closest("[id]")?.id}: a "(" ends a line apart from its link`,
        );
    }
  }
  return { problems, icons };
}

// Opens the page at each width and returns every problem, with the first
// width it showed at, and how many links wore an icon at 1280.
async function sweep(file: string) {
  const { page, close } = await launch();
  try {
    // A 32px stand-in for every site icon; nothing else leaves the machine.
    await page.send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
    page.on("Fetch.requestPaused", ({ requestId, request }) =>
      request.url.startsWith("https://t0.gstatic.com/faviconV2")
        ? page.send("Fetch.fulfillRequest", {
            requestId,
            responseCode: 200,
            responseHeaders: [{ name: "Content-Type", value: "image/svg+xml" }],
            body: Buffer.from(
              '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32"/></svg>',
            ).toString("base64"),
          })
        : request.url.startsWith("file:")
          ? page.send("Fetch.continueRequest", { requestId })
          : page.send("Fetch.failRequest", {
              requestId,
              errorReason: "BlockedByClient",
            }),
    );
    await page.navigate(pathToFileURL(file).href);
    const found = new Map<string, number>();
    let icons = 0;
    const widths = [1280];
    for (let w = 320; w <= 440; w += 3) widths.push(w);
    for (const w of widths) {
      await page.viewport(w, 900, { mobile: w < 600 });
      const result = await page.evaluate(
        `new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))).then(() => (${measure})())`,
      );
      if (w === 1280) icons = result.icons;
      for (const p of result.problems) if (!found.has(p)) found.set(p, w);
    }
    return {
      icons,
      problems: [...found].map(([p, w]) => `${p} (first at ${w}px)`),
    };
  } finally {
    close();
  }
}

describe.skipIf(!findChrome().bin)("line breaks in Chromium", () => {
  it(
    "instrument-page keeps icons with their links, list text in flow and nothing past the column",
    { timeout: 120000 },
    async () => {
      const dir = mkdtempSync(join(tmpdir(), "foundation-lines-"));
      writeFileSync(
        join(dir, "page.html"),
        `<!doctype html>
<!-- direction: reader="a developer" point="lines break like text" shape=read feel=minimal hero="cases" -->
<html lang="en" data-shape="read" data-feel="minimal">
<head><title>Lines break like text</title><meta name="description" content="Line breaks around icons and code."></head>
<body>${LISTS}</body></html>`,
      );
      await promisify(execFile)(
        "node",
        [join(SKILLS, "instrument-page/page.mjs"), "page.html"],
        { cwd: dir },
      ).catch(() => {});
      expect(await sweep(join(dir, "page.html"))).toEqual({
        icons: icons(LISTS),
        problems: [],
      });
    },
  );

  it(
    "the wireframe shell keeps icons with their links and nothing past the column",
    { timeout: 120000 },
    async () => {
      const dir = mkdtempSync(join(tmpdir(), "shell-lines-"));
      const shell = readFileSync(join(SKILLS, "wireframe/shell.html"), "utf8");
      writeFileSync(
        join(dir, "page.html"),
        shell.replace(/(<main[^>]*>)[\s\S]*?(<\/main>)/, `$1${PROSE}$2`),
      );
      expect(await sweep(join(dir, "page.html"))).toEqual({
        icons: icons(PROSE),
        problems: [],
      });
    },
  );
});
