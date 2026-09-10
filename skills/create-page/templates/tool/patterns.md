# Patterns: the tool's own vocabulary

Everything in `references/` still applies to the prose around the tool. These are the pieces only a page that computes needs.

## One render function, called on every event

Do not update pieces of the page as things change. Recompute the whole output from the controls, every time. It is fast enough for anything this size, it cannot drift, and it means there is one place to read to know what the page does.

```js
const $ = (id) => document.querySelector("#" + id);

const draw = () => {
  const value = Number($("thing").value) || 0;
  // read every control, compute, write every output
};

for (const control of document.querySelectorAll(
  "#tool input, #tool select, #tool textarea",
)) {
  control.addEventListener("input", draw);
  control.addEventListener("change", draw);
}
draw(); // The worked example, before anyone has touched anything.
```

Binding both `input` and `change` covers the whole range of controls in one line: text and range fire `input`, a select fires `change`, a checkbox fires both.

## Controls that read as controls

```html
<label class="block">
  <span
    class="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase"
    >What is left to pay</span
  >
  <div
    class="mt-2 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2"
  >
    <span class="text-sm text-muted-foreground">$</span>
    <input
      id="balance"
      type="number"
      value="280000"
      class="w-full bg-transparent text-sm outline-none"
    />
  </div>
</label>
```

The unit lives in the box beside the number rather than in the label, so the reader can see what they are typing without looking away. Label the thing in the reader's words: "What is left to pay", not "Principal".

A range needs its value visible or it is a mystery dial:

```html
<span class="flex items-baseline justify-between">
  <span class="…uppercase">Extra every month</span>
  <span id="extra-value" class="font-mono text-[15px] font-semibold">$200</span>
</span>
<input
  id="extra"
  type="range"
  value="200"
  min="0"
  max="1000"
  step="25"
  class="mt-2 w-full accent-brand-600"
/>
```

Chips for a set the reader picks from, which beats a multi-select every time:

```js
`<button data-zone="${zone}" class="rounded-full border px-2.5 py-1 text-[12px] font-medium ${
  chosen.has(zone)
    ? "border-brand-500 bg-brand-50 text-brand-700"
    : "border-border bg-card text-muted-foreground"
}">${name}</button>`;
```

## The answer, sized like an answer

Two or three tiles, the figure at `text-[26px]`, the units and the comparison underneath in small type. Tint the tiles that carry the result and leave the input echo plain, so the eye lands on the output rather than on the recap.

Where the verdict is categorical rather than numeric, say it in a sentence at the top of the block and pick the tone from the result:

```js
const verdict =
  worst === 2
    ? [
        "Everyone is inside a normal day",
        "border-brand-200 bg-brand-50",
        "text-brand-700",
        "ph-check-circle",
      ]
    : worst === 1
      ? [
          "Someone is at the edge of their day",
          "border-warning-300 bg-warning-50",
          "text-warning-900",
          "ph-warning",
        ]
      : [
          "There is no good window — this is the least bad one",
          "border-error-300 bg-error-100",
          "text-error-700",
          "ph-x-circle",
        ];
```

The third branch is the one that makes the tool trustworthy: it returns an answer and calls it bad, rather than ranking three bad options and presenting the top one as a result.

## Copy, and what to do when it is refused

```js
$("copy").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(text);
    button.innerHTML = '<i class="ph ph-check text-base"></i>Copied';
    setTimeout(
      () => (button.innerHTML = '<i class="ph ph-copy text-base"></i>Copy'),
      1600,
    );
  } catch {
    button.innerHTML =
      '<i class="ph ph-selection-all text-base"></i>Select it below';
  }
});
```

The clipboard is refused in a sandboxed frame and in some privacy settings, and it throws rather than failing quietly. Catch it and point at the text, which should already be on the page and selectable. Never let the only copy of the output live behind a button.

## Time zones without a library

`Intl` knows the real rules, including daylight saving, and is already in the browser:

```js
const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  day: "numeric",
  hourCycle: "h23",
}).formatToParts(instant);
```

`formatToParts` rather than `format`, so the pieces come back as data instead of a string to re-parse. `hourCycle: "h23"` because `hour12: false` gives 24 for midnight in some engines and 0 in others. And half-hour zones are real: Kolkata is not on the hour grid, so a strip drawn in whole hours has to show the minutes somewhere.

Fix the date the tool computes against, print it, and say why:

```js
const WHEN = [2026, 3, 14]; // 14 April 2026, a Tuesday.
```

Half the world's clocks move twice a year, so an overlap computed "today" is a different answer next month. A fixed date makes the page reproducible and checkable; today's date makes it quietly wrong later.

## Guessing, and saying so

Where a tool infers something about its input, it says what it inferred and on what basis, in one sentence, above the result:

```
Split on runs of two or more spaces, which gave the most consistent columns.
10 rows × 4 columns, first row used as the heading.
```

A wrong guess produces plausible output, and plausible wrong output is worse than an error. Prefer a rule that can be stated in a sentence over one that cannot: "the separator whose column count varies least" is checkable by a reader; a weighted score over four heuristics is not.

Show the rows that did not fit rather than padding them:

```js
`<tr class="${row.length !== width ? "bg-warning-50" : ""}">`;
```

## A chart, if the answer moves

Chart.js, pinned, with the same numbers in a table under it. The trap worth knowing before you start is in `references/charts.md`: a canvas cannot read a `light-dark()` token, so resolve colors through a hidden probe element and rebuild them when the theme changes. Everything else is ordinary.

Redraw by mutating the existing chart rather than rebuilding it, or every keystroke leaks a chart:

```js
if (chart) {
  chart.data = data;
  return chart.update();
}
chart = new Chart($("curve"), { type: "line", data, options });
```
