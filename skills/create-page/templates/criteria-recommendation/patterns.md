# Patterns: the vocabulary the examples use

Canonical spellings for the pieces a criteria recommendation keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  Criteria and weights
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">
  What mattered, and how much
</h2>
```

Tones for the kicker: `text-brand-700` for the winner, `text-muted-foreground` for supporting sections.

## Weights table with bars

One row per criterion: the weight as a number, the weight as a bar, and the reason for that weight. The bar is relative to the heaviest criterion, and the caption says so; the numbers sum to 100.

```html
<table class="w-full text-sm">
  <tbody class="divide-y divide-border align-top">
    <tr>
      <td class="py-2.5 pr-3 font-medium">Resolve performance</td>
      <td class="w-10 py-2.5 pr-3 text-right font-mono tabular-nums">30</td>
      <td class="w-32 py-3 pr-4">
        <div class="h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div
            class="h-full rounded-full bg-brand-500"
            style="width: 100%"
          ></div>
        </div>
      </td>
      <td class="py-2.5 text-muted-foreground">
        Why this weight, in a clause.
      </td>
    </tr>
  </tbody>
</table>
```

A page that wants the weights inside the score grid instead puts them in a numeric column beside the criterion name and keeps the reasons as a list; the reasons never disappear.

## Score grid

Every option on every criterion, one stated scale, totals computed from what is shown. Either orientation works: options as rows with a bold total column, or criteria as rows with a bold total row. The header carries the weight so the grid can be re-totaled by hand.

```html
<table class="w-full text-sm">
  <thead>
    <tr class="border-b border-border text-left text-xs text-muted-foreground">
      <th class="pb-2 pr-3 font-medium">Option</th>
      <th class="pb-2 text-center font-medium">
        Performance<span class="block font-mono text-[10px]">w 30</span>
      </th>
      <th class="pb-2 pl-3 text-right font-medium">Total</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-border">
    <tr>
      <td class="py-2 pr-3 font-medium">MacBook Pro 14</td>
      <td data-s="8">8</td>
      <td class="py-2 pl-3 text-right font-mono font-semibold tabular-nums">
        79.0
      </td>
    </tr>
  </tbody>
</table>
<p class="mt-2 text-xs text-muted-foreground">
  Scores are 1 to 10. Total is the sum of weight times score, divided by 10.
</p>
```

## Heatmap cell tones

The `data-s` attribute carries the score and a short stylesheet tones the cell from the brand ramp, so a row reads before its numbers do. Never red to green: the palette has one saturated color, and a low score is gray, not an error.

```html
<style>
  [data-s] {
    padding: 0.5rem 0.25rem;
    text-align: center;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
  [data-s="10"],
  [data-s="9"] {
    background: var(--color-brand-500);
    color: #fff;
  }
  [data-s="8"] {
    background: var(--color-brand-300);
    color: var(--color-brand-950);
  }
  [data-s="7"] {
    background: var(--color-brand-200);
  }
  [data-s="6"] {
    background: var(--color-brand-100);
  }
  [data-s="5"] {
    background: var(--color-brand-50);
  }
  [data-s="4"],
  [data-s="3"],
  [data-s="2"],
  [data-s="1"] {
    background: var(--color-gray-100);
    color: var(--color-gray-500);
  }
</style>
```

For a 1 to 5 scale, use five steps of the same ramp. The stylesheet goes in a plain `<style>` after the Tailwind script; it reads the theme's variables, which `@theme static` always emits.

## Dot ratings

A compact grid encodes a 1 to 5 score as five dots rather than a number: one element per cell, the other four dots drawn by `box-shadow`, so the markup stays one line per cell.

```html
<style>
  .dots {
    --on: var(--color-gray-900);
    --off: var(--color-gray-200);
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: 40px;
    border-radius: 50%;
    background: var(--on);
  }
  .dots[data-s="1"] {
    box-shadow:
      10px 0 0 var(--off),
      20px 0 0 var(--off),
      30px 0 0 var(--off),
      40px 0 0 var(--off);
  }
  .dots[data-s="2"] {
    box-shadow:
      10px 0 0 var(--on),
      20px 0 0 var(--off),
      30px 0 0 var(--off),
      40px 0 0 var(--off);
  }
  .dots[data-s="3"] {
    box-shadow:
      10px 0 0 var(--on),
      20px 0 0 var(--on),
      30px 0 0 var(--off),
      40px 0 0 var(--off);
  }
  .dots[data-s="4"] {
    box-shadow:
      10px 0 0 var(--on),
      20px 0 0 var(--on),
      30px 0 0 var(--on),
      40px 0 0 var(--off);
  }
  .dots[data-s="5"] {
    box-shadow:
      10px 0 0 var(--on),
      20px 0 0 var(--on),
      30px 0 0 var(--on),
      40px 0 0 var(--on);
  }
  td.win {
    --on: var(--color-brand-600);
    background: var(--color-brand-25);
  }
</style>
<td class="win">
  <b class="dots" data-s="5" role="img" aria-label="5 of 5"></b>
</td>
```

The winning column takes `win` so its dots turn brand and the column tints; the numbers row under it still carries the totals, because dots alone are not reproducible.

## Ranked total bars

Totals as bars beside or below the grid, longest first, so the ranking is visible before the numbers are read. Only the leader's bar takes the brand tone.

```html
<ol class="flex flex-col gap-2 text-sm">
  <li class="grid grid-cols-[6rem_1fr_3rem] items-center gap-3">
    <span class="font-medium">Raleigh</span>
    <div class="h-2.5 overflow-hidden rounded-full bg-gray-200">
      <div class="h-full rounded-full bg-brand-500" style="width: 80%"></div>
    </div>
    <span class="text-right font-mono font-semibold tabular-nums">80.0</span>
  </li>
</ol>
```

## Winner callout

The winner with its total, where it won, and where it lost. A card, a band, or a single result line; the total is never left out.

```html
<div class="rounded-xl border-2 border-brand-300 bg-card p-5 shadow-sm">
  <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
    Winner · 79.0 of 100
  </p>
  <p class="mt-1 text-xl font-semibold tracking-[-0.02em]">MacBook Pro 14</p>
  <p class="text-sm text-muted-foreground">About $1,799 · seen this week</p>
  <p class="mt-3 text-sm leading-6">
    <strong>Won on</strong> display and battery. <strong>Lost on</strong>
    price and repairability, which together carry 20 of the 100 points.
  </p>
</div>
```

The compact form is one bordered row: `border-l-4 border-brand-500`, the name, the total in mono, one clause.

## Sensitivity presets

Sensitivity is recomputed, never guessed. The static form is prose with the alternative weighting named and every total restated. The interactive form adds preset buttons that re-total a grid whose cells carry `data-s` and whose weight cells carry `data-w`; the default weighting is already in the markup, so the page reads the same with scripts off.

```html
<div class="flex flex-wrap gap-2">
  <button
    type="button"
    data-w="30,25,15,15,10,5"
    aria-pressed="true"
    class="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium aria-pressed:border-brand-500 aria-pressed:bg-brand-50 aria-pressed:text-brand-700"
  >
    Balanced
  </button>
  <button
    type="button"
    data-w="45,10,10,10,20,5"
    aria-pressed="false"
    class="…"
  >
    Growth mode
  </button>
</div>
<script>
  const grid = document.getElementById("matrix");
  const rows = [...grid.tBodies[0].rows];
  const totals = [...grid.tFoot.rows[0].querySelectorAll("[data-total]")];
  function apply(weights) {
    rows.forEach(
      (row, i) => (row.querySelector("[data-w]").textContent = weights[i]),
    );
    const sums = totals.map(
      (_, c) =>
        rows.reduce(
          (sum, row, i) =>
            sum +
            weights[i] * Number(row.querySelectorAll("[data-s]")[c].dataset.s),
          0,
        ) / 10,
    );
    totals.forEach((cell, c) => (cell.textContent = sums[c].toFixed(1)));
  }
  document
    .querySelectorAll("[data-w]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        apply(button.dataset.w.split(",").map(Number)),
      ),
    );
</script>
```

Every preset's result also appears in prose, so a reader with scripts off, or on paper, gets the same answer.

## Link to the thing

Each option that lives at a URL is a link on its name, where the page first names the set: the result strip, before the reader has read a single score. The scoring table below repeats the names as column heads and does not need them again.

```html
<dd class="text-muted-foreground">
  <a href="https://www.mysql.com/">MySQL</a> 75
</dd>
```

The skin styles links in the base layer, so an anchor needs no classes, and a utility on it still wins where a link should read as something else. Color and underline only, never weight or size, so a link inside a heading keeps the type it sits in.

Never a URL you have not read. Where no page for the exact thing exists, no link: a name pointing at the nearest other product is a mistake the reader cannot detect.

## Source footer

Closes every page. What was read, whose scores these are, what is inferred, when.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Sources.</strong> Makers' specification pages
  and three long-form reviews per option. Scores are the author's, on a 1 to 10
  scale, from those pages; nothing was tested by hand. Prices seen this week.
</footer>
```

## Emphasis, sparingly

The bordered card is the focal layer, not the default wrapper. The grid and the winner carry the brand tone; the goal, the reasons, and the sensitivity prose sit directly on the page background with tighter type and no chrome.
