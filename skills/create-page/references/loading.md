# Loading a library

Any library, from a short list of general-purpose package hosts. `cdn.jsdelivr.net/npm/` is the default and the one to reach for first: it mirrors every npm package file for file, builds any of them as a module at one URL shape (`/+esm`), and marks a pinned URL immutable. `esm.sh` is the second host, for the one thing a mirror cannot do: pin a single React through a whole import graph. `allowed-sources.json` at the registry root is the list, `pnpm check:ideas` holds every page to it, and the pages worker derives a hosted copy's `connect-src` from the same file.

Why the mirror first: some places a page is opened are frames whose Content Security Policy names a few plain CDNs and nothing else, and jsDelivr is on the lists seen so far where esm.sh is on none of them. A library that loads there draws its chart; one that cannot shows the page's offline branch, which is correct and worse.

**Which library is yours to choose.** Nothing here is a curated set of blessed packages; if a page wants a physics engine, a music notation renderer or a date picker, import it. What the list bounds is the host and the version.

The rule that has not changed: **open the page with the network off and every number, name, place and finding is still there, in the HTML.** A library may add motion, precision or scale to something already on the page; it may never be the only copy of a fact. So every import below has a branch for not arriving, and the page says on it what that branch shows.

## Pin it

Every host on the list insists on an exact version, `<major>.<minor>.<patch>`. `@4` and no version both resolve to whatever is newest on the day the page is opened, and a page is an artifact somebody opens in a year: that drift is the one kind of change the offline test cannot catch, so neither passes the check. Pick the version once, from `npm view <package> version`, and write it everywhere the page names the package.

| Host                                                | Shape                                    | Reach for it when                                                                           |
| --------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `cdn.jsdelivr.net/npm/<pkg>@1.2.3/+esm`             | anything, built as a module              | always, first                                                                               |
| `cdn.jsdelivr.net/npm/<pkg>@1.2.3/<file>`           | npm as published, file for file          | a classic script that installs a global, a stylesheet, an asset a library fetches by path   |
| `esm.sh/<pkg>@1.2.3?deps=react@x,react-dom@x`       | built as a module, one React             | a React component library, whose graph needs one React resolved through every package in it |
| `unpkg.com/<pkg>@1.2.3/<file>`                      | the same mirror, what most READMEs print | you are copying a library's own documented script tag                                       |
| `cdnjs.cloudflare.com/ajax/libs/<lib>/1.2.3/<file>` | hand-curated, minified builds            | the library never shipped to npm, or only its single-file build is any use                  |

## Four shapes, and which to reach for

**A module import, in the page's one module script.** The default. `/+esm` after the package, or after a file inside it, asks jsDelivr for that file built as a module with its dependencies resolved to pinned URLs on the same host. Top-level `await` is fine in a module, and `.catch` is the offline branch.

```js
const Plot =
  await import("https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6.17/+esm").catch(
    () => undefined,
  );
const { TabulatorFull } =
  await import("https://cdn.jsdelivr.net/npm/tabulator-tables@6.5.2/+esm").catch(
    () => ({}),
  );
const Chart = (
  await import("https://cdn.jsdelivr.net/npm/chart.js@4.5.1/auto/+esm").catch(
    () => ({}),
  )
).default;
```

A namespace (`Plot.plot`, `Plot.barY`) is the whole module; a named export is destructured; a default export is `.default`. A dependency the package needs comes with it, which is why Plot no longer wants d3 loaded first. Two modules that both import the same pinned package get one copy, so a library's add-on (three's `examples/jsm` controls, say) shares the library with the page that imports both.

**A file as published, by its path.** For a build that installs a global rather than exporting: a classic `<script src>` before the module script, and the guard is `typeof X === "undefined"`. Reach for it when the package only ships that kind of build (sql.js), or when a library has to be a global for its own plugins (Leaflet's, Tabulator's).

```html
<script src="https://cdn.jsdelivr.net/npm/sql.js@1.14.2/dist/sql-wasm.js"></script>
```

Never `/+esm` on one of these: wrapped as a module, a build that expects `window` and Node's `fs` gets a shim for the second that does not work, and a build that installs a global exports nothing.

**A stylesheet or an asset, by path.** The package's files are at their own paths, so a stylesheet is a `<link>` and a library that fetches its own assets is pointed at the package's directory.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css"
/>
```

```js
initSqlJs({
  locateFile: (f) => "https://cdn.jsdelivr.net/npm/sql.js@1.14.2/dist/" + f,
});
window.EXCALIDRAW_ASSET_PATH =
  "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.1/dist/prod/";
```

**A React component library, from esm.sh.** Its build imports `react` bare, and so does every package in its graph, each with a peer range of its own. A mirror's module build resolves each range separately, so one import graph arrives with several Reacts in it and fails on the first hook. esm.sh's `?deps=react@<v>,react-dom@<v>` pins one React through the whole graph; import React and ReactDOM from the same host at the same pinned versions. Mount with `createElement`; there is no JSX without a build step.

```js
const React = await import("https://esm.sh/react@19.2.5");
const { createRoot } = await import("https://esm.sh/react-dom@19.2.5/client");
const { Excalidraw } =
  await import("https://esm.sh/@excalidraw/excalidraw@0.18.1?deps=react@19.2.5,react-dom@19.2.5");
createRoot(host).render(React.createElement(Excalidraw, props));
```

A page that does this will not run inside the strict frames above, and its `template.md` says what it shows instead. An import map is the same thing written once: `<script type="importmap">` mapping `react`, `react-dom/` and the library to their pinned URLs, and bare names in the module after it. Reach for it when a page imports the same package from several places; a page with one import of each does not need it.

## What the templates already prove

| Library         | Shape                                                            | Where              |
| --------------- | ---------------------------------------------------------------- | ------------------ |
| Chart.js        | module, `/auto/+esm`, `.default`; or the UMD as a classic script | `tool`, `explorer` |
| Observable Plot | module namespace                                                 | `dashboard`        |
| Tabulator       | classic script by path, stylesheet                               | `explorer`         |
| sql.js          | classic script by path, wasm by path                             | `explorer`         |
| Leaflet         | classic script by path, stylesheet                               | `explorer`         |
| Excalidraw      | esm.sh with `?deps`, stylesheet, assets                          | `whiteboard`       |

## Say what it costs

The starter spends about 85 KB on its framework and icon set together. A charting library is about the same again; Excalidraw is 1.2 MB, which the whiteboard earns because the board is the whole page. Name the cost in the template's `template.md` when a document kind needs something past a chart, and say there what the page shows while it loads and if it never does.
