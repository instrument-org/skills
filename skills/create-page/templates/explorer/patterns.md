# Patterns: the explorer's own vocabulary

Everything in `references/` still applies. These are the pieces only a page whose subject is a dataset needs, and each one is written so the page survives its library not arriving.

## The data, inline

One array of arrays, not objects: at this size the key names would be most of the file. Name the column indices once and use the names.

```html
<script>
  // [mag, lat, lon, depthKm, unixSeconds, place]
  const Q = [[7.8,-8.55,121.45,10,1786...,"84 km SSW of Nikolski, Alaska"], …];
  const MAG = 0, LAT = 1, LON = 2, DEP = 3, TIME = 4, PLACE = 5;
</script>
```

Round on the way in rather than on the way out: three decimal places of latitude is 110 meters, one decimal of a magnitude is what the feed published. A page that stores more precision than it shows is carrying bytes to no one's benefit.

## The grid, with a table underneath it

Render the plain table first, from the same array, and let the library replace it. The order matters: written this way the rows are on the page before the network is consulted, and a failed load costs the reader sorting rather than data.

```html
<div id="grid-host">
  <div id="grid-fallback" class="overflow-auto" style="max-height: 26rem">
    <!-- filled by script with the most interesting hundred rows -->
  </div>
</div>
<script>
  if (typeof Tabulator !== "undefined") {
    document.querySelector("#grid-fallback").remove();
    const table = new Tabulator("#grid-host", {
      data: ROWS,
      columns: COLUMNS,
      height: "26rem",
      layout: "fitColumns",
      initialSort: [{ column: "mag", dir: "desc" }],
      placeholder: "Nothing matches those filters.",
    });
    table.on("dataFiltered", (filters, rows) => showCount(rows.length));
  }
</script>
```

Column definitions carry their own filter. `headerFilter: "number"` with `headerFilterFunc: ">="` gives a threshold box, `"input"` a contains-match, and `"list"` with `headerFilterParams: { valuesLookup: true, clearable: true }` builds its dropdown from the data so it cannot drift from it.

Spreadsheet-style selection is four options rather than any code, and it is what makes a grid feel like a place you can take something out of: drag across cells, shift-click to extend, and copy with the usual keys.

```js
selectableRange: true,
selectableRangeColumns: true,   // click a heading to take the column
selectableRangeRows: true,      // and the row numbers for a whole row
clipboard: "copy",              // copy only; these pages are never edited
clipboardCopyRowRange: "range",
clipboardCopyConfig: { columnHeaders: false },
```

Leave `selectableRangeClearCells` off. It lets Delete blank a cell, which on a page whose whole point is that it carries the data is a way to lose rows with no way back.

Always show a live count beside the grid, because a filtered grid with no count quietly lies about how much there is. Take it from the rows `dataFiltered` hands you rather than asking the table: `tableBuilt` can fire before your handler is attached, and `getDataCount` on a table that is not built yet returns zero, which reads as an empty grid.

## Tabulator wears its own look, so restate the surfaces

The stylesheet is structural and cosmetic at once, and its colors are hardcoded hex that does not move with the theme: white headers, `#ddd` dividers and a grey hover, which on a dark page are the stark white lines you will notice immediately. Load the `tabulator_simple` build for the structure and restate every surface in the page's tokens. The `!important` on the sort arrows is deliberate: the library's own selectors are long enough to win otherwise.

```html
<style>
  .tabulator {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-card);
    color: var(--color-foreground);
    font-family: inherit;
    font-size: 13px;
  }
  .tabulator .tabulator-header,
  .tabulator .tabulator-footer {
    background: var(--color-muted);
    border-color: var(--color-border);
    color: var(--color-muted-foreground);
    font-weight: 500;
  }
  .tabulator .tabulator-header .tabulator-col {
    background: transparent;
    border-right: 1px solid var(--color-border);
  }
  .tabulator .tabulator-header .tabulator-col.tabulator-sortable.tabulator-col-sorter-element:hover {
    background-color: var(--color-accent);
  }
  .tabulator .tabulator-col-sorter .tabulator-arrow {
    border-bottom-color: var(--color-gray-400) !important;
    border-top-color: var(--color-gray-400) !important;
  }
  .tabulator [aria-sort="ascending"] .tabulator-col-sorter .tabulator-arrow,
  .tabulator [aria-sort="descending"] .tabulator-col-sorter .tabulator-arrow {
    border-bottom-color: var(--color-brand-500) !important;
    border-top-color: var(--color-brand-500) !important;
  }
  .tabulator-row,
  .tabulator-row.tabulator-row-even {
    background-color: var(--color-card);
    border-bottom: 1px solid var(--color-border);
    color: var(--color-foreground);
  }
  .tabulator-row:hover {
    background-color: var(--color-muted) !important;
    cursor: pointer;
  }
  .tabulator-row .tabulator-cell {
    border-right: 1px solid var(--color-border);
  }
  .tabulator-row .tabulator-cell:last-of-type {
    border-right: none;
  }
  .tabulator .tabulator-header input,
  .tabulator .tabulator-header select {
    border: 1px solid var(--color-input);
    border-radius: var(--radius-sm);
    background: var(--color-background);
    padding: 2px 5px;
    color: var(--color-foreground);
    font-family: inherit;
  }
  .tabulator .tabulator-col-title {
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 11px;
  }
  /* Range selection draws in the library's own blue. */
  .tabulator-range-overlay .tabulator-range {
    border: 1px solid var(--color-brand-500);
  }
  .tabulator-range-overlay .tabulator-range.tabulator-range-active:after {
    background-color: var(--color-brand-500);
  }
  .tabulator-range-highlight {
    background-color: var(--color-accent) !important;
    color: var(--color-foreground) !important;
  }
  .tabulator-cell.tabulator-range-selected:not(.tabulator-range-only-cell-selected) {
    background-color: var(--color-brand-50) !important;
  }
  .tabulator .tabulator-col-resize-guide {
    background-color: var(--color-brand-500);
  }
</style>
```

## The breakdown: two selects, never a query box

A reader with a dataset has questions and not a language. Give them a dimension and a measure, build the query from that, run it, and print what you built underneath in small mono type so the machinery is legible without being homework.

```js
const GROUPS = {
  region: ["Region", "region"],
  depthband: ["Depth band", "CASE WHEN depth < 70 THEN 'shallow' ELSE 'deep' END"],
};
const MEASURES = {
  events: ["Number of events", "count(*)"],
  avgmag: ["Average magnitude", "round(avg(mag), 2)"],
};
const sql =
  "SELECT " + g[1] + " AS label, " + m[1] +
  " AS value FROM rows GROUP BY label ORDER BY value DESC LIMIT 14;";
```

Answer it with a horizontal bar chart and the same numbers as a table beside it. `indexAxis: "y"` is right here nearly always: the labels are names, and names read across.

## SQLite, built in the page

The engine comes from the CDN; the rows are already in the file. Build the table at load and never fetch a database.

```js
initSqlJs({ locateFile: (f) => "https://cdn.jsdelivr.net/npm/sql.js@1.14.2/dist/" + f })
  .then((SQL) => {
    db = new SQL.Database();
    db.run("CREATE TABLE rows (mag REAL, place TEXT, region TEXT, depth REAL);");
    const stmt = db.prepare("INSERT INTO rows VALUES (?,?,?,?)");
    db.run("BEGIN");
    for (const q of Q) stmt.run([q[MAG], q[PLACE], regionOf(q), q[DEP]]);
    db.run("COMMIT");
    stmt.free();
    summarize();
  })
  .catch(() => saySoAndCarryOn());
```

Wrap the inserts in one transaction: without it, two thousand rows take seconds instead of milliseconds, because each statement commits on its own.

## A map whose container is the fallback

The list of places goes inside the map element as its own content, styled to be read. The library empties it on success. Nothing else on the page has to know whether the map arrived.

```html
<div id="map" class="h-[30rem] overflow-auto rounded-xl border border-border bg-card p-5 print:hidden">
  <p class="text-sm text-muted-foreground">The map needs the network. Here is the same route as a list.</p>
  <ol id="fallback-places" class="mt-3 space-y-1.5 text-sm"></ol>
</div>
```

With more than a few hundred markers, pass `preferCanvas: true` and use `L.circleMarker`; individual DOM markers stop being smooth somewhere around a thousand.

## Linking the views

The grid and the map and the chart are the same rows, so choosing in one should move the others. A row click that flies the map to that record and scrolls it into view costs six lines and is the moment a reader realizes the page is one thing rather than four.

```js
table.on("rowClick", (event, row) => {
  const d = row.getData();
  if (!map) return;
  map.setView([d.lat, d.lon], Math.max(map.getZoom(), 5));
  document.querySelector("#map").scrollIntoView({ behavior: "smooth", block: "center" });
});
```

## Glance tiles

The stat tile from `references/charts.md`, generated from the data rather than typed, so the figures cannot drift from the rows. Four is the right number; the fourth is where the surprising one goes, and it takes the toned figure.

```js
const biggest = Q.reduce((a, b) => (b[MAG] > a[MAG] ? b : a));
```
