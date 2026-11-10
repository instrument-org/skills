# Loading a library

A page can load any library, as long as it comes from a short list of general-purpose package hosts. Start with `cdn.jsdelivr.net/npm/`. It mirrors every npm package file for file, builds any of them as a module at one URL shape (`/+esm`), and marks a pinned URL as immutable. `esm.sh` is the second host, for the one thing a mirror can't do, which is pin a single React through a whole import graph. `page.mjs` fails a page that loads from anywhere else, and a hosted copy of a page can only fetch from the same hosts.

Use the mirror first because some places that open a page show it in a frame whose Content Security Policy allows only a few plain CDNs. jsDelivr has been on every such list we've seen, and esm.sh on none of them. A library that loads there draws its chart. One that can't load leaves the page showing its offline fallback, which is still correct but less useful.

**You choose the library.** There's no approved set of packages. If a page needs a physics engine, a music notation renderer or a date picker, import it. The list only limits the host and the version.

One rule always holds. **Open the page with the network off, and every number, name, place and finding must still be there in the HTML.** A library can add motion, precision or scale to something the page already shows, but it must never be the only copy of a fact. So every import below has a fallback for when it doesn't arrive, and the page says what the fallback shows.

## Pin the version

Every host on the list requires an exact version, `<major>.<minor>.<patch>`. `@4`, or no version at all, resolves to whatever is newest on the day someone opens the page, and people open a page a year after it was made. That drift is the one kind of change the offline test can't catch, so neither form passes the check. Pick the version once, with `npm view <package> version`, and write it everywhere the page names the package.

| Host                                                | Shape                                    | Use it when                                                                                 |
| --------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `cdn.jsdelivr.net/npm/<pkg>@1.2.3/+esm`             | anything, built as a module              | always, first                                                                               |
| `cdn.jsdelivr.net/npm/<pkg>@1.2.3/<file>`           | npm as published, file for file          | a classic script that installs a global, a stylesheet, an asset a library fetches by path   |
| `esm.sh/<pkg>@1.2.3?deps=react@x,react-dom@x`       | built as a module, one React             | a React component library, whose graph needs one React resolved through every package in it |
| `unpkg.com/<pkg>@1.2.3/<file>`                      | the same mirror, what most READMEs print | you're copying a library's own documented script tag                                        |
| `cdnjs.cloudflare.com/ajax/libs/<lib>/1.2.3/<file>` | hand-curated, minified builds            | the library never shipped to npm, or only its single-file build is useful                   |

## Four ways to load a library

**A module import, in the page's one module script.** This is the default. Adding `/+esm` after the package name, or after a file inside it, asks jsDelivr for that file built as a module, with its dependencies resolved to pinned URLs on the same host. Top-level `await` works in a module, and `.catch` is the offline fallback.

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

A namespace import (`Plot.plot`, `Plot.barY`) is the whole module, a named export is destructured, and a default export is `.default`. Any dependency the package needs comes along with it, which is why Plot no longer needs d3 loaded first. When two modules import the same pinned package, they share one copy, so a library's add-on (such as three's `examples/jsm` controls) shares the library with the page that imports both.

**A file as published, by its path.** Use this for a build that installs a global instead of exporting one. Load it with a classic `<script src>` before the module script, and guard it with `typeof X === "undefined"`. Use it when the package ships only that kind of build (sql.js), or when a library has to be a global for its own plugins (Leaflet's, Tabulator's).

```html
<script src="https://cdn.jsdelivr.net/npm/sql.js@1.14.2/dist/sql-wasm.js"></script>
```

Never add `/+esm` to one of these. Wrapped as a module, a build that expects `window` and Node's `fs` gets a stand-in for `fs` that doesn't work, and a build that installs a global exports nothing.

**A stylesheet or an asset, by its path.** A package's files sit at their own paths, so a stylesheet is a `<link>`, and a library that fetches its own assets gets pointed at the package's folder.

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

**A React component library, from esm.sh.** Its build imports `react` by bare name, and so does every package in its graph, each with its own peer version range. A mirror's module build resolves each range separately, so one import graph arrives with several copies of React and fails on the first hook. esm.sh's `?deps=react@<v>,react-dom@<v>` pins one React through the whole graph. Import React and ReactDOM from the same host at the same pinned versions, and mount with `createElement`, since there's no JSX without a build step.

```js
const React = await import("https://esm.sh/react@19.2.5");
const { createRoot } = await import("https://esm.sh/react-dom@19.2.5/client");
const { Excalidraw } =
  await import("https://esm.sh/@excalidraw/excalidraw@0.18.1?deps=react@19.2.5,react-dom@19.2.5");
createRoot(host).render(React.createElement(Excalidraw, props));
```

A page that loads this way won't run inside the strict frames described above, so it has to say what it shows there instead. An import map does the same thing in one place: a `<script type="importmap">` that maps `react`, `react-dom/` and the library to their pinned URLs, followed by bare names in the module after it. Use one when a page imports the same package from several places. A page that imports each package once doesn't need it.

## Libraries the kits use

| Library     | Shape                                                       | Kit                |
| ----------- | ----------------------------------------------------------- | ------------------ |
| MapLibre GL | classic script by path, stylesheet; styles from OpenFreeMap | `kits/map/`        |
| Excalidraw  | esm.sh with `?deps`, stylesheet, assets                     | `kits/whiteboard/` |
| dialkit     | module, `/vanilla/+esm`, stylesheet                         | `kits/playground/` |

Chart.js (`/auto/+esm`, `.default`), Observable Plot (a module namespace), and Tabulator and sql.js (classic scripts by path) load the same ways.

## A font of its own

A Google Font loads like a library, with a `<link>` to `fonts.googleapis.com`. A font the page needs that Google Fonts doesn't have, such as a brand face or one the user has installed, goes into the file the way an image does. Write a `@font-face` whose `src` names the font file by its path in `url()`, and `page.mjs` reads it, checks that it's a WOFF2, WOFF, OTF or TTF under 400 KB, and puts the bytes in. A `@font-face` with only `local()` fails the check, because `local()` only finds a font on a computer that has it installed. It looks right on the machine that made the page and falls back for every reader.

```css
@font-face {
  font-family: "Duplicate Round";
  font-weight: 500;
  src: url("fonts/DuplicateRound-Medium.woff2") format("woff2");
}
```

An installed font is a file in the system's font folders: `~/Library/Fonts` and `/Library/Fonts` on macOS, `%LOCALAPPDATA%\Microsoft\Windows\Fonts` and `C:\Windows\Fonts` on Windows, and `~/.local/share/fonts` and `/usr/share/fonts` on Linux. Find it there by name. Each file holds one weight and style, so a page that uses three weights names three files. Subset each file to the characters the page uses and save it as WOFF2 beside the page, which shrinks a desktop OTF from hundreds of KB to a few dozen:

```
pip install fonttools brotli
pyftsubset "<font file>" --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+20AC" --layout-features="*" --flavor=woff2 --output-file=fonts/<name>.woff2
```

## Weight

The foundation's fonts come to about 100 KB, and a charting library adds about the same again. Excalidraw is 1.2 MB, which is worth it for a board, since the board is the whole page. Say on the page what it shows while a library loads, and what it shows if the library never arrives.
