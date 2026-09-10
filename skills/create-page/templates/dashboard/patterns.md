# Patterns: the dashboard's own vocabulary

Everything in `references/` still applies, and `references/charts.md` is the one to read alongside this. These are the pieces only a page that reports a period needs.

## The tile, and its comparison

```html
<div class="rounded-xl border border-border bg-card p-4">
  <p
    class="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase"
  >
    Takings
  </p>
  <p class="mt-1 text-[28px] font-semibold tracking-[-0.02em]">£128,400</p>
  <p class="mt-0.5 flex items-center gap-1.5 text-[12px]">
    <i class="ph ph-trend-up text-sm text-brand-600"></i>
    <span class="font-medium text-brand-700">+9.1%</span>
    <span class="text-muted-foreground">on Q3 last year</span>
  </p>
</div>
```

Three lines: what it is, what it is, and what it is against. The third line is the one that makes the tile worth its space, and it names the baseline in words rather than assuming the reader knows which one you picked.

The tile that is a problem takes a tint and the others stay plain:

```html
<div class="rounded-xl border border-warning-300 bg-warning-50 p-4">…</div>
```

One tinted tile in four is a signal. Four tinted tiles are wallpaper.

## Plot, wired for this skin

```js
const PLOT = {
  style: {
    background: "transparent",
    color: "currentColor",
    fontFamily: "inherit",
    fontSize: "12px",
  },
  marginLeft: 52,
  marginRight: 16,
};
const GREEN = "var(--color-brand-500)";
const GREY = "var(--color-gray-400)";

const chart = (id, options) => {
  if (typeof Plot === "undefined") return;
  const host = document.querySelector("#" + id);
  let drawn = 0;
  const render = () => {
    const pad = getComputedStyle(host);
    const width = Math.round(
      host.clientWidth -
        parseFloat(pad.paddingLeft) -
        parseFloat(pad.paddingRight),
    );
    if (width <= 0 || width === drawn) return;
    drawn = width;
    host.replaceChildren(Plot.plot({ width, ...PLOT, ...options }));
  };
  render();
  new ResizeObserver(render).observe(host);
};
```

Three things are doing work here. `background: "transparent"` and `color: "currentColor"` stop Plot painting its own white card and black type over a dark page; without them a dark reader gets a white rectangle. And the early return is the offline contract: the host element already contains a sentence describing the chart, so a page whose libraries never arrive reads as prose with a table under it.

And the width, which is the one that looks like polish and is not. **Plot has no idea how wide its container is.** It draws at 640 and stops, so a chart in a card that is 940 wide sits in the left two thirds of it with dead space beside it, which reads as a rendering fault and is the most common way one of these pages looks unfinished. Measure the host, subtract its padding, and measure again when it changes. Redrawing changes the host's contents, which is exactly what a `ResizeObserver` watches, so the guard on the measured width is not an optimization: without it the thing loops.

Because Plot draws SVG, `fill: "var(--color-brand-500)"` works directly on a mark. There is no probe, no resolved-color cache, and no redraw on a theme change: this is the whole reason to prefer it over canvas on a page that follows the reader's theme.

## Small multiples

The most useful chart a readout has, and one option:

```js
facet: { data: tidy, x: "category" },
marks: [Plot.frame({ stroke: "var(--color-border)" }), Plot.lineY(tidy, { x: "quarter", y: "value" })];
```

Two traps, both of which produce a chart that looks fine and is wrong:

- **Write the domain out.** A band scale orders its values however they sort, and `"Q4 24"` through `"Q3 26"` sorts alphabetically. A line across an alphabetical time axis is a zigzag that reads as volatility. `x: { domain: QUARTERS }`.
- **Filter through the mark, not the array.** Inside a facet, Plot pairs rows with panels by index, so handing a mark a pre-filtered array puts its marks in the wrong panels. Use `Plot.dot(all, { filter: (d) => …, … })`.

And drop the x ticks when panels sit shoulder to shoulder: one panel's last label lands against the next one's first, and the span belongs in the sentence above the chart rather than repeated six times under it.

## Two periods, side by side

Grouped bars are a facet, not a bar option:

```js
fx: { domain: MONTHS, label: null },
x: { axis: null, domain: ["Boiler, last year", "Heat pump, this year"] },
marks: [Plot.barY(pairs, { fx: "month", x: "year", y: "cost", fill: "year" })];
```

One small panel per month, the pair ordered inside it, and the inner axis turned off because the legend already names the two.

## A distribution, and the sentence beside it

```js
Plot.barX(BANDS, { y: (d) => d[0], x: (d) => d[1], fill: (d, i) => (i >= 5 ? "var(--color-warning-500)" : GREY) }),
Plot.text(BANDS, { y: (d) => d[0], x: (d) => d[1], text: (d) => `${d[1]} · ${Math.round((d[1] / total) * 100)}%`, dx: 46, fill: "currentColor" }),
```

Print the value at the end of the bar and leave `marginRight` for it, or the label on the longest bar — the one the chart exists to show — is the one that gets clipped. Order the bands with an explicit `y: { domain: … }`; a band scale will otherwise alphabetize `"1 to 2 h"` above `"under 5 min"`.

A cumulative column in the table under it is worth more than another chart: "85% within an hour, 96% within eight" is the whole finding in two numbers.

Resist a log axis for a distribution of times. It flatters the shape, and bars cannot sit on a log baseline anyway because a log scale has no zero. Linear, in the units people say out loud, and let the small values be slivers: that is the finding rather than a rendering problem.

## A slope that survives the weather

Where a before-and-after has an obvious confounder, the scatter is the honest chart: put the driver on x, the outcome on y, and let the two regressions say what the totals cannot.

```js
Plot.dot(daily, { x: "t", y: "kwh", stroke: "year", r: 1.8, strokeOpacity: 0.55 }),
Plot.linearRegressionY(daily, { x: "t", y: "kwh", stroke: "year", ci: 0, strokeWidth: 2 }),
```

The slope is the measurement, the total is the anecdote, and both belong on the page.

## Tables that cannot drift from the tiles

Build the table from the same array the chart reads, and derive totals rather than typing them:

```js
const row = (label, values) =>
  `<tr><td>${label}</td>${values.map((v) => `<td class="font-mono">${money(v)}</td>`).join("")}` +
  `<td class="font-mono font-semibold">${money(values.reduce((a, b) => a + b, 0))}</td></tr>`;
```

A hand-typed tile beside a computed table will disagree eventually, usually after the data is revised and the tile is not. Where a sentence names a count, have the script write it:

```html
There were <b id="cold-days">—</b> such days this year.
```

```js
document.querySelector("#cold-days").textContent = daily.filter(
  (d) => d.t < -2,
).length;
```
