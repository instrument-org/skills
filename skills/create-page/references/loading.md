# Loading a library

Any library, from a short list of general-purpose package hosts. `esm.sh` is the default and the one to reach for first: it serves any npm package as a module at one URL shape, resolves a React once across a whole import graph when asked, hands a file over untouched when asked, and marks a pinned URL immutable. `allowed-sources.json` at the registry root is the list, `pnpm check:ideas` holds every page to it, and the pages worker derives a hosted copy's `connect-src` from the same file.

**Which library is yours to choose.** Nothing here is a curated set of blessed packages; if a page wants a physics engine, a music notation renderer or a date picker, import it. What the list bounds is the host and the version.

The rule that has not changed: **open the page with the network off and every number, name, place and finding is still there, in the HTML.** A library may add motion, precision or scale to something already on the page; it may never be the only copy of a fact. So every import below has a branch for not arriving, and the page says on it what that branch shows.

## Pin it

Every host on the list insists on an exact version, `<major>.<minor>.<patch>`. `@4` and no version both resolve to whatever is newest on the day the page is opened, and a page is an artifact somebody opens in a year: that drift is the one kind of change the offline test cannot catch, so neither passes the check. Pick the version once, from `npm view <package> version`, and write it everywhere the page names the package.

| Host                                                | Shape                                 | Reach for it when                                                                     |
| --------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| `esm.sh/<pkg>@1.2.3`                                | anything, built as a module           | always, first                                                                         |
| `cdn.jsdelivr.net/npm/<pkg>@1.2.3/<file>`           | npm as published, file for file       | the package ships a UMD or IIFE build you want unrewritten, or esm.sh cannot build it |
| `unpkg.com/<pkg>@1.2.3/<file>`                      | the same, and what most READMEs print | you are copying a library's own documented script tag                                 |
| `cdnjs.cloudflare.com/ajax/libs/<lib>/1.2.3/<file>` | hand-curated, minified builds         | the library never shipped to npm, or only its single-file build is any use            |

## Four shapes, and which to reach for

**A module import, in the page's one module script.** The default. Top-level `await` is fine in a module, and `.catch` is the offline branch.

```js
const Plot = await import("https://esm.sh/@observablehq/plot@0.6.17").catch(
  () => undefined,
);
const { TabulatorFull } =
  await import("https://esm.sh/tabulator-tables@6.5.2").catch(() => ({}));
const Chart = (
  await import("https://esm.sh/chart.js@4.5.1/auto").catch(() => ({}))
).default;
```

A namespace (`Plot.plot`, `Plot.barY`) is the whole module; a named export is destructured; a default export is `.default`. A dependency the package needs comes with it, which is why Plot no longer wants d3 loaded first.

**A file as published, `?raw`.** For a build that installs a global rather than exporting: a classic `<script src>` before the module script, and the guard is `typeof X === "undefined"`. Reach for it when the package only ships that kind of build (sql.js), or when a library has to be a global for its own plugins (Leaflet's, Tabulator's).

```html
<script src="https://esm.sh/sql.js@1.14.2/dist/sql-wasm.js?raw"></script>
```

Without `?raw` esm.sh wraps the file as a module, and a build that expects `window` and Node's `fs` gets a shim for the second that does not work.

**A stylesheet or an asset, by path.** The package's files are at their own paths, so a stylesheet is a `<link>` and a library that fetches its own assets is pointed at the package's directory.

```html
<link rel="stylesheet" href="https://esm.sh/leaflet@1.9.4/dist/leaflet.css" />
```

```js
initSqlJs({ locateFile: (f) => "https://esm.sh/sql.js@1.14.2/dist/" + f });
window.EXCALIDRAW_ASSET_PATH =
  "https://esm.sh/@excalidraw/excalidraw@0.18.1/dist/prod/";
```

**A React component library.** Add `?deps=react@<v>,react-dom@<v>` to the library's URL and import React and ReactDOM from the same pinned URLs. Without it, each package in the graph resolves its own `react` peer range separately, and a library like Excalidraw arrives with four Reacts in it and fails on the first hook. Mount with `createElement`; there is no JSX without a build step.

```js
const React = await import("https://esm.sh/react@19.2.5");
const { createRoot } = await import("https://esm.sh/react-dom@19.2.5/client");
const { Excalidraw } =
  await import("https://esm.sh/@excalidraw/excalidraw@0.18.1?deps=react@19.2.5,react-dom@19.2.5");
createRoot(host).render(React.createElement(Excalidraw, props));
```

An import map is the same thing written once: `<script type="importmap">` mapping `react`, `react-dom/` and the library to their pinned URLs, and bare names in the module after it. Reach for it when a page imports the same package from several places; a page with one import of each does not need it.

## What the templates already prove

| Library         | Shape                                   | Where              |
| --------------- | --------------------------------------- | ------------------ |
| Chart.js        | module, `/auto`, `.default`             | `tool`, `explorer` |
| Observable Plot | module namespace                        | `dashboard`        |
| Tabulator       | `?raw` classic script, stylesheet       | `explorer`         |
| sql.js          | `?raw` classic script, wasm by path     | `explorer`         |
| Leaflet         | `?raw` classic script, stylesheet       | `explorer`         |
| Excalidraw      | module with `?deps`, stylesheet, assets | `whiteboard`       |

## Say what it costs

The starter spends about 85 KB on its framework and icon set together. A charting library is about the same again; Excalidraw is 1.2 MB, which the whiteboard earns because the board is the whole page. Name the cost in the template's `template.md` when a document kind needs something past a chart, and say there what the page shows while it loads and if it never does.
