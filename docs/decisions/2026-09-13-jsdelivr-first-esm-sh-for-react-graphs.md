# jsDelivr first, esm.sh for React graphs

Status: accepted, 2026-09-13. Supersedes [`2026-09-11-esm-sh-serves-every-library.md`](2026-09-11-esm-sh-serves-every-library.md).

## What

Every `create-page` page loads its framework, its icon set and any library from `https://cdn.jsdelivr.net/npm/`, pinned to an exact version: a module at `<pkg>@1.2.3/+esm`, and a classic script, a stylesheet or an asset at the file's own path. `https://esm.sh` stays on the list for one job, a React component library, where `?deps=` pins one React through the whole import graph. `references/loading.md` teaches the shapes; the whiteboard is the one template on esm.sh, and its `template.md` says what a strict frame shows instead.

## Why

Some places a page is opened are frames inside another product, with a Content Security Policy the page cannot see or change. The first one confirmed allows scripts from a short list of plain CDNs, stylesheets from Google Fonts, and nothing else; jsDelivr is on the list and esm.sh is not. See `findings/framed-viewers-with-a-strict-csp-leave-a-page-unstyled.md`. On esm.sh a page opened there was fully unstyled, since the skin lives in a `text/tailwindcss` block only the compiler reads; on jsDelivr it is the page. A library follows the same logic one step down: from jsDelivr a chart draws in the frame, from esm.sh the reader sees the offline branch, which is correct and worse.

The reason the earlier decision chose esm.sh was Excalidraw: a mirror's module build resolves each package's React peer range on its own, and one import graph arrived with four Reacts in it. That is still true, and still what `?deps=` is for. What was not true is that the rest needed a builder host at all. jsDelivr's `/+esm` builds any file as a module with its dependencies resolved to pinned URLs on the same host, and every library the templates use loads that way: Plot, Chart.js, echarts, mermaid with its lazy diagram chunks, ag-grid, three with its `examples/jsm` controls sharing one three. Verified by rendering every example headlessly on 2026-09-13; the two scenes needed software WebGL to draw at all, before and after.

The starter's two files never needed building. `@tailwindcss/browser` is one IIFE and Phosphor is a stylesheet and a font, and `?raw` on esm.sh was asking for exactly what a mirror serves by default.

## Options weighed

- Stay on esm.sh and accept the frame. The frame is where a reader who cannot open a file meets the page, and an unstyled page there is one they close.
- Move the starter alone and leave libraries on esm.sh. Half the gain: the page is styled in the frame and every chart in it is missing. The `+esm` build covers the rest at no cost, so there was no reason to stop.
- Import maps over jsDelivr for React graphs. Rejected in the earlier decision for mapping a package's internals, and nothing has changed.

## Cost

Two hosts to teach instead of one, with the boundary in one sentence: esm.sh when the graph needs one React. jsDelivr's `/+esm` resolves a dependency's version at build time and pins it in the built file, so a pinned URL's graph is stable, the same promise esm.sh made. A page that needs esm.sh, today only the whiteboard, does not run in the strict frame and says so. Every example that imports a library rewrote and every capture that changed was reshot.
