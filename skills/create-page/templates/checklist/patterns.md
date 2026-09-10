# Patterns: the vocabulary the examples use

Canonical spellings for the pieces a checklist keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  Six weeks out
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">
  Notice, movers, and the big decisions
</h2>
```

Tones for the kicker: `text-brand-700` for the focal group, `text-muted-foreground` for supporting sections, `text-warning-700` for a group of things that go wrong.

## Checkbox row

The unit of the page. A real `<input>` inside a `<label>`, so the whole line is the hit target, it ticks with scripts off, and it prints as a box. The input is a `peer`, so the text span dims and strikes on `peer-checked:` with no script.

```html
<label class="grid cursor-pointer grid-cols-[auto_1fr] gap-x-3 py-2.5">
  <input type="checkbox" class="peer mt-1 size-4 accent-brand-600" />
  <span
    class="text-sm leading-6 peer-checked:text-muted-foreground peer-checked:line-through"
    >Give the landlord written notice.</span
  >
</label>
```

A grid rather than a flex row, so a tip line can sit under the text in the second column as a sibling of the input and pick up its own `peer-checked:` state. Rows stack inside `divide-y divide-border` for a ruled list, or `space-y-1` for an open one. Keep every item one line at laptop width; a second line is a tip, not part of the item.

## Group heading

A group is a heading and its rows. As a card when the groups are few and the reader works one at a time; as a bare heading with a rule when the page is dense.

```html
<section
  class="rounded-xl border border-border bg-card p-5 shadow-sm print:break-inside-avoid print:shadow-none"
>
  <div class="flex items-baseline justify-between gap-4">
    <h2 class="text-base font-semibold tracking-[-0.01em]">Four weeks out</h2>
    <p class="text-xs text-muted-foreground">
      Paperwork and the things with lead time
    </p>
  </div>
  <div class="mt-3 divide-y divide-border">
    <!-- checkbox rows -->
  </div>
</section>
```

An icon-led group puts one Phosphor regular icon before the heading, never two, never an emoji:

```html
<h2 class="flex items-center gap-2 text-lg font-semibold">
  <i class="ph ph-t-shirt text-xl text-brand-700"></i>Clothes
</h2>
```

## Priority pill

The mark for the few items that cost money, cannot be undone, or block the rest. One kind per page, with a legend near the top; the pill sits after the item text.

```html
<span
  class="ml-2 inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 align-middle text-[11px] font-medium text-brand-700"
  >Costs money if missed</span
>
```

A denser page uses a single glyph instead, with the same legend: `<i class="ph ph-flag text-brand-600"></i>`. Either way the legend says what the mark means in a clause the reader can check the item against.

## Tip line

A line under an item that usually goes wrong: what goes wrong, then what to check. It is a third child of the label, placed in the grid's second column, so it dims with the item but is never struck through.

```html
<span
  class="col-start-2 mt-0.5 text-xs leading-5 text-muted-foreground peer-checked:opacity-60"
  >Ask for a final bill at the old address and a start at the new one the day
  before you arrive; the gap is where the deposit goes.</span
>
```

A priority pill inside the text span is `inline-flex`, which keeps the strike off it when the item is ticked.

A page with many tips can gather them in a column of their own, numbered, with a small brand-toned superscript on each item that has one: `<sup class="ml-0.5 font-medium text-brand-700">3</sup>`.

## Counter

One line that says how many are ticked. Written as a count of items so it reads with scripts off; the script rewrites it on every change.

```html
<p id="count" class="text-sm text-muted-foreground">37 items</p>
```

```html
<script type="module">
  // Counts the ticked boxes. With scripts off the line reads as written and
  // the boxes still tick.
  const boxes = [...document.querySelectorAll("main input[type=checkbox]")];
  const count = document.getElementById("count");
  const update = () => {
    const done = boxes.filter((box) => box.checked).length;
    count.textContent = `${done} of ${boxes.length} done`;
  };
  for (const box of boxes) box.addEventListener("change", update);
</script>
```

For a list the reader returns to over days, ticks may persist in `localStorage` under a key named for the page; wrap both the read and the write in `try` so a browser that refuses storage still ticks. That is the whole of the script budget: a counter, a bar if the page wants one, persistence if the process is long.

## Print stylesheet

The page has to land on one or two sheets with no chrome. Tailwind's `print:` variant hides and unstyles element by element; a short `<style media="print">` in the head sets the sheet.

```html
<style media="print">
  @page {
    margin: 0.6in;
  }
  body {
    background: #fff;
  }
</style>
```

On elements: `print:hidden` on the sticky bar and anything interactive that has no paper meaning; `print:static` on anything sticky; `print:shadow-none print:border-gray-300` on cards; `print:break-inside-avoid` on every group so a heading never lands alone at the foot of a page; `print:columns-2` where a single column would run to three sheets. Checkboxes print as boxes on their own. Test in print preview, not by guessing.

## Leave-out list

A checklist sometimes owes the reader what not to do: what to leave at home, what not to ship. A plain list with an x mark, never a checkbox, so it cannot be ticked by mistake.

```html
<li class="flex items-start gap-2.5">
  <i class="ph ph-x mt-1 text-lg text-muted-foreground"></i
  ><span>A hair dryer. Every hotel and ryokan has one.</span>
</li>
```

## Source footer

Closes every page. What the list was drawn from, what it assumes, how it prints, and that the items are illustrative when they are.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Based on.</strong> Your lease's notice clause
  and the usual order of a local move. Rules on deposits and notice vary by
  state and lease; the items with money on them say where to check. Prints on
  two sheets at Letter. Illustrative: items are representative, not verified.
</footer>
```

## Emphasis, sparingly

The rows are the page; everything else is furniture. Reserve toned fills for the priority mark and one focal panel at most. A page where every group is a shaded card with a colored heading reads as a dashboard, not a list.
