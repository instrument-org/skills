# Charts: quantifying honestly and cheaply

Pick the lightest form that answers the question. Hand-rolled HTML/SVG covers ranked bars, shares, and trends in a few lines, and everything on the page must be local, so these recipes are the whole charting story.

**The honesty rule, always:** name the normalization base next to the marks ("bars normalized to 74, the corpus size"), and never draw a value at a different size than its number. If a slice is too small to see at true scale, say so in text rather than inflating it.

## Form chooser

- Ranked quantities → bar rows
- Part of a whole → segmented meter, or a waffle when units matter
- Trend over time → sparkline; add tick labels and gridlines when axes matter
- Phases on a shared clock → timeline bars
- One important number → stat tile (big figure, one-line caption)

## Stat tile

```html
<div class="rounded-xl border border-border bg-card p-5 shadow-sm">
  <p class="text-3xl font-semibold tracking-[-0.03em]">
    412<span class="ml-1 text-lg text-muted-foreground">h</span>
  </p>
  <p class="mt-1 text-xs leading-5 text-muted-foreground">
    what the figure is, plus the comparison that gives it meaning
  </p>
</div>
```

A toned figure (`text-error-700`) marks the tile carrying the problem.

## Bar rows (generated, never hand-repeated)

```html
<div id="bars" class="space-y-2"></div>
<script>
  const barData = [
    ["checkout", 42],
    ["search", 28],
    ["uploads", 17],
  ];
  const barMax = 42; // state the base in the caption
  document.querySelector("#bars").innerHTML = barData
    .map(
      ([label, n]) =>
        '<div class="flex items-center gap-3">' +
        '<span class="w-32 shrink-0 text-right font-mono text-xs text-muted-foreground">' +
        label +
        "</span>" +
        '<div class="h-4 flex-1 overflow-hidden rounded bg-muted"><div class="h-4 rounded" style="width:' +
        (n / barMax) * 100 +
        '%;background:var(--color-brand-500)"></div></div>' +
        '<span class="w-10 shrink-0 text-right font-mono text-xs">' +
        n +
        "</span></div>",
    )
    .join("");
</script>
```

Inline `style="background: var(--color-…)"` resolves lazily at paint, so it is safe in generated markup regardless of when Tailwind compiles.

## Segmented meter

```html
<div class="flex h-2 gap-[3px] overflow-hidden rounded-full">
  <span class="flex-[45] bg-success-500"></span>
  <span class="flex-[8] bg-warning-500"></span>
  <span class="flex-[1] bg-error-500"></span>
</div>
```

The `flex-[n]` trick keeps segments proportional with no percentage math. Caption the total.

## Sparkline (generated SVG)

```html
<svg
  id="spark"
  viewBox="0 0 560 110"
  class="w-full"
  role="img"
  aria-label="What the line shows, including the peak"
></svg>
<script>
  const PTS = [3, 1, 0, 5, 11, 14, 2, 8];
  const W = 560,
    H = 110,
    P = 14,
    MAX = Math.max(...PTS);
  const x = (i) => P + (i * (W - 2 * P)) / (PTS.length - 1);
  const y = (v) => P + (1 - v / MAX) * (H - 2 * P);
  document.querySelector("#spark").innerHTML =
    '<polyline fill="none" stroke-width="2" style="stroke:var(--color-brand-500)" points="' +
    PTS.map((v, i) => x(i) + "," + y(v)).join(" ") +
    '"/>' +
    PTS.map((v, i) =>
      v
        ? '<circle r="2.5" cx="' +
          x(i) +
          '" cy="' +
          y(v) +
          '" style="fill:var(--color-brand-600)"/>'
        : "",
    ).join("");
</script>
```

Label at least the endpoints and the peak with small `<text>` marks, or the line is decoration.

## Timeline bars

Rows sharing one time axis: a relative container per row, absolutely positioned bars with `left`/`width` percentages computed from the shared span, and the span named in the caption. Ticks are a top row of mono labels absolutely positioned at the same percentage offsets. Same honesty rule.

## Theme colors in a canvas

SVG takes theme colors directly, through a `fill-*`/`stroke-*` class or `style="fill: var(--color-…)"`, because both are CSS and CSS resolves the token. A `<canvas>` does not: `ctx.fillStyle` wants a color string, and every token in the skin is a `light-dark(a, b)` pair, so reading one back hands you that function as text.

```js
getComputedStyle(document.body).getPropertyValue("--color-gray-100");
// "light-dark(#f5f5f4, #1c1917)" -- not a color canvas can use
```

The trap is what happens next. Assigning an unparseable value to `fillStyle` throws nothing and logs nothing; the context silently keeps whatever it had, so a drawing comes out entirely in the last color that happened to parse and the only symptom is that it looks wrong. Resolve through a real property instead, where the browser does the work:

```js
const probe = document.createElement("span");
probe.style.display = "none";
document.body.appendChild(probe);
let tones = new Map();
const tone = (name) => {
  if (!tones.has(name)) {
    probe.style.color = "var(" + name + ")";
    tones.set(name, getComputedStyle(probe).color); // "rgb(245, 245, 244)"
  }
  return tones.get(name);
};
// The reader can switch theme with the page open, so the cache goes with it.
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  tones = new Map();
  draw();
});
```

Same for any other JavaScript that takes a color string rather than setting CSS. Two notes: the saturated middle of each ramp (400 through 600) is one value in both themes and so survives being read raw, which is exactly why a page that only uses those looks fine until the first gray is drawn; and `getComputedStyle(probe).color` returns `rgb(…)`, so build a translucent variant with `replace` into `rgba(…)` rather than appending hex digits.

## No charting library

A page loads the fonts, the icon set, and the pinned Tailwind build, and nothing else; `check:ideas` fails a page that reaches anywhere further. So there is no Chart.js here and the recipes above are the whole charting story. For axis-heavy needs, generate labeled SVG -- ticks as a text row at computed offsets, gridlines as low-opacity lines -- which the sparkline recipe extends to naturally.

A chart is also the easiest place to imply precision the research does not have. Draw a value at its own size or not at all, name the base beside the marks, and prefer a coarse scale to a decimal that was never measured.
