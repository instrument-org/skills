# page-lab

A local lab for designing how Instrument pages look. Every page here reads `skills/instrument-page/lib/foundation.css` and `foundation.js` straight from the repo, so a change to the stylesheet shows on every page at the next reload. It is outside `skills/` on purpose: nothing here ships with the skill, and no agent using the skill ever sees it.

```sh
pnpm page-lab
```

Then open `http://localhost:4711/tools/page-lab/`. The server serves the repo root on 127.0.0.1 and tells the browser never to cache, so a reload always shows the files as they are on disk. Pass another port as an argument if 4711 is taken.

## What is here

- `index.html`: the specimen. Every token, element and class the stylesheet draws, with the feels laid out as one table of the values each one sets.
- `samples/`: six pages written the way the skill's method writes them, each in the feel and layout that suits it.
- `lab.js`: the panel in the corner of every lab page. It links the specimen and the samples, and switches feel, layout and theme. The URL keeps your choice, so a reload after an edit stays where you were. Keys: `f` next feel, `l` next layout, `t` next theme, `0` back to the page's own.
- `build.mjs`: builds each sample the way an agent ships it, into `built/`, and runs `page.mjs` on it.
- `serve.mjs`: the server.

## Checking a stylesheet change

```sh
pnpm page-lab:build
pnpm page-check tools/page-lab/built/*.html --no-build
```

The first builds every sample and prints any FAIL line from `page.mjs`. The second runs the layout probe on each in headless Chromium at desktop, link preview, dark and phone (see [`../page-check/README.md`](../page-check/README.md)). To check every feel, copy a built page with its `data-feel` changed and run the probe on the copies.

## The samples are fixtures, not examples

They exist to show the stylesheet and to catch regressions. Never copy one into the skill, a recipe or a kit, and never point an agent at them: an agent shown a finished page copies it, which is why the skill has no example gallery. Their names, products and figures are made up.
