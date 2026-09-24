# Framed viewers with a strict CSP leave a page unstyled

Status: resolved for the framework and for libraries by [`decisions/2026-09-13-jsdelivr-first-esm-sh-for-react-graphs.md`](../decisions/2026-09-13-jsdelivr-first-esm-sh-for-react-graphs.md), which took options 1 and 3 below. Icons (option 2) and the fragment wrinkle at the end are still open. Observed 2026-09-13.

## What happens

Some places a reader meets a page are not a browser tab but a frame inside another product, and the product sets a Content Security Policy the page cannot see or change. The first one confirmed allows scripts from a short list of CDNs (`cdnjs.cloudflare.com`, `cdn.jsdelivr.net/npm/`, `cdn.tailwindcss.com`, `code.jquery.com`), stylesheets only from `fonts.googleapis.com` with their font files from `fonts.gstatic.com`, inline styles and scripts, and nothing else: no other host for anything, and on the allowed hosts nothing but scripts, so no `fetch`, no image, no stylesheet, no runtime asset a library goes back for. The list will differ by product; what generalizes is the shape, a few script hosts and Google Fonts.

A page from `starter.html` as it was, loading its framework and icon set from `esm.sh`, opened there:

- The fonts load. Google Fonts is on every such list.
- The framework does not. Tailwind is compiled in the browser by `@tailwindcss/browser`, and esm.sh is not on the list. The blocked script fires `error` on its element, the starter's guard shows the page at once rather than waiting out its floor, and the reader gets a fully unstyled document: the skin is inside a `<style type="text/tailwindcss">` block that only the compiler reads.
- The icons do not. Phosphor's stylesheet would be refused from any CDN there, since stylesheets are allowed from Google Fonts alone. Every `<i class="ph ...">` renders as nothing, which breaks no layout.
- The share widget does not. `tryinstrument.com` is not on the list. Nothing is lost; the frame has its own way to share.
- Site icons on links do not. `t0.gstatic.com` is an image, and images are refused; the starter's `onerror` drops each one and the line does not move.
- Libraries do not, from esm.sh, and any library's runtime fetch (sql.js's wasm, map tiles) is refused from every host. The offline branch the rule already requires is what the reader sees.

The one that matters is the framework. Everything else degrades the way it does offline; the framework failing is the difference between the page and a wall of unstyled text.

## Why the starter loaded from esm.sh

`decisions/2026-09-11-esm-sh-serves-every-library.md`: one URL shape to teach, a builder host that makes ES-module-only packages loadable and pins one React through an import graph (`?deps=`), and `cache-control: immutable` on a pinned URL. The starter's own two files took the same host with `?raw`, which asks for the file as published.

Those two files did not need a builder. `@tailwindcss/browser` ships one self-contained IIFE, `dist/index.global.js`; `@phosphor-icons/web` ships a stylesheet and a font. jsDelivr serves both as published, immutable at a pinned version, from a foundation-scale multi-CDN, and it is already in `allowed-sources.json` and in the pages worker's `connect-src`. Nothing `?raw` bought is lost by moving them.

## Options

1. **Move the starter's two files to `cdn.jsdelivr.net/npm/`.** `<script defer src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3/dist/index.global.js">` and `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css">`. In the strict frame the page is then styled, in the right type, with icons and widget absent. Everywhere else nothing changes. Cost: a starter change, which is `pnpm fix:shell` over every example and `pnpm capture` over every template, as the starter decision says it must be; no pages deploy, since the origin is already in `connect-src`.
2. **Make icons survive too.** Inline SVG per icon instead of an icon font: each page carries only the glyphs it uses, and they render offline and under any CSP. A larger change, since every template and example writes `<i class="ph ph-...">`; the alternative, inlining the whole regular font as a data URI, is about 200 KB on every page for a decoration. Not worth doing for the frame alone; worth weighing on its own merits as an offline gain.
3. **Flip the library default in `references/loading.md`.** jsDelivr first, esm.sh when the import graph needs one React through it. jsDelivr's `/+esm` builds any file as a module with its dependencies pinned on the same host, static and dynamic imports alike, so the one-line import shape survives the move; what it cannot do is dedupe a React peer across a graph, which is Excalidraw, whose `dist/prod/index.js` imports `react`, `react-dom`, `jotai` and a dozen others bare and needs esm.sh's `?deps=` to mount at all. Verified 2026-09-13 by rendering every example headlessly: Plot, Chart.js, echarts, mermaid with its lazy diagram chunks, ag-grid, Tabulator, sql.js with its wasm, Leaflet, and three with its `examples/jsm` controls sharing one three all draw from jsDelivr. Cost: the templates that import a library rewrite and recapture, and the decision above is superseded, since "esm.sh always, first" stops being the rule. Gain: a chart, a table or a map draws in the strict frame rather than showing its offline branch.
4. **Do nothing.** The offline rule already guarantees the facts are on the page. But an unstyled page is not a degraded page, it is one the reader closes.

Options 1 and 3 were taken the same day, in that order. Option 2 is independent of the frame and still open.

## One more wrinkle for that frame

The confirmed frame wraps what it is handed in a skeleton of its own, a `<head>` with charset, viewport and a small reset, and asks for a fragment: no doctype, `html`, `head` or `body` of the page's own. A whole page from the starter handed over as-is parses with its tags nested; browsers tolerate that, and its `<link>` and `<style>` elements still apply from inside the body. An agent putting a page into that frame should either accept the nesting or strip the page to the contents of its head and body. Nothing in the starter can fix that from the page's side.
