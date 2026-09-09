# Patterns: the vocabulary the examples use

Canonical spellings for the pieces a comparison matrix keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  Comparison matrix
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">
  Six tools on thirteen attributes
</h2>
```

Tones for the kicker: `text-brand-700` for the page's own, `text-muted-foreground` for supporting sections such as footnotes and how to read this.

## Matrix plumbing

The table's own rules live in a `<style>` in the body so each cell in the source stays one short tag. Everything resolves against the skin's tokens, which the `static` theme guarantees exist. Put `<!-- prettier-ignore -->` before the `<table>` so a formatter leaves one row per source line; a matrix reads better that way.

```html
<style>
  .matrix {
    width: 100%;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
  }
  .matrix th,
  .matrix td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid var(--color-border);
  }
  .matrix thead th {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--color-card);
    border-bottom: 2px solid var(--color-gray-300);
  }
  .matrix th:first-child,
  .matrix td:first-child {
    position: sticky;
    left: 0;
    z-index: 5;
    background: var(--color-card);
    border-right: 1px solid var(--color-border);
  }
  .matrix thead th:first-child {
    z-index: 15;
  }
  .matrix tbody th {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-gray-800);
  }
  .matrix td.good {
    background: var(--color-brand-50);
    color: var(--color-brand-900);
  }
  .matrix td.weak {
    background: var(--color-warning-50);
    color: var(--color-warning-900);
  }
  .matrix sup {
    margin-left: 0.125rem;
    font-family: var(--font-mono);
    font-size: 0.625rem;
    color: var(--color-brand-700);
  }
</style>
```

The skeleton. The wrapper scrolls sideways on a narrow screen and stops being a scroll container once the table fits, because a sticky header inside an `overflow-x: auto` box sticks to that box rather than to the page. Pick the breakpoint at which the table's `min-w` fits the container.

```html
<div
  class="overflow-x-auto rounded-xl border border-border bg-card shadow-sm lg:overflow-visible"
>
  <!-- prettier-ignore -->
  <table class="matrix min-w-[60rem] text-xs leading-5">
    <colgroup><col style="width: 11rem" /><col /><col /><col /></colgroup>
    <thead>
      <tr>
        <th>Attribute</th>
        <th><span class="block text-sm font-semibold">Option A</span><span class="block font-normal text-muted-foreground">Plan · $19 per user</span></th>
      </tr>
    </thead>
    <tbody>
      <tr class="band"><th colspan="4">Cost</th></tr>
      <tr><th>Monthly cost, 12 seats</th><td class="good">$240</td><td>$288</td><td class="weak">None<sup>3</sup></td></tr>
    </tbody>
  </table>
</div>
```

`table-layout: fixed` with a `<colgroup>` gives the option columns equal width; set the first column's width there and leave the rest blank.

## Cell tone key

Three tones and no more. Each is relative to the brief on the page, not to the product in general, and the legend says so.

- `good`: a brand tint. Strong for this reader's need.
- no class: plain. Fine, present, nothing that decides anything.
- `weak`: the warning tint. A real weakness for this brief; never red, because a weakness is not an error.

A cell that reads "None" is often `weak` and sometimes plain: no Gantt view is plain for a two-person shop and weak for a studio scheduling forty jobs.

## Band rows

Attributes grouped under a label that spans the table. The band's cell inherits the sticky first column, so its label stays visible when the table scrolls sideways.

```css
.matrix tr.band th {
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
  background: var(--color-gray-100);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-gray-600);
}
```

## Collapsible bands

For a page that should read short and open deep: one header table that sticks, then one `<details>` per band holding its own table. Every table shares the same `colgroup` and `table-layout: fixed`, so the columns line up across them. The band that matters most opens by default; the page reads without scripts because `<details>` needs none.

```html
<div class="overflow-x-auto lg:overflow-visible">
  <div class="min-w-[54rem]">
    <div class="sticky top-0 z-20 border-b-2 border-gray-300 bg-background">
      <table class="matrix">
        <colgroup>
          …
        </colgroup>
        <thead>
          …
        </thead>
      </table>
    </div>
    <details open>
      <summary
        class="cursor-pointer list-none px-3 py-2.5 text-xs font-semibold tracking-[0.1em] text-gray-600 uppercase select-none"
      >
        <i class="ph ph-caret-right caret"></i> Size and weight
      </summary>
      <table class="matrix">
        <colgroup>
          …
        </colgroup>
        <tbody>
          …
        </tbody>
      </table>
    </details>
  </div>
</div>
```

```css
summary::-webkit-details-marker {
  display: none;
}
details[open] > summary .caret {
  transform: rotate(90deg);
}
```

## Best-in-line mark

One mark on the best cell in a row (or a column, when the matrix is transposed), and none when it is a tie. A glyph the CSS adds, so the cell's source stays `class="good best"`.

```css
.matrix td.best::before {
  content: "★";
  margin-right: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-brand-600);
}
```

The legend carries the same glyph with "best in the row; no star when it is a tie."

## Transposed matrix

Options as rows when there are few of them and many attributes, or when each option deserves a sentence. The header row holds the attributes and the first column holds the option names; the last column is a plain-toned summary with `min-w-[13rem]` and `text-sm`, and it is the row read for you. The sticky rules are the same; the best mark reads down a column instead of across a row.

## Legend chips

Swatches that match the cell tones exactly, plus the mark and the superscript, in one wrapping row above the matrix.

```html
<div
  class="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground"
>
  <span class="inline-flex items-center gap-2"
    ><span class="size-3.5 rounded-sm bg-brand-100 ring-1 ring-brand-300"></span
    >Strong for this brief</span
  >
  <span class="inline-flex items-center gap-2"
    ><span class="size-3.5 rounded-sm bg-card ring-1 ring-gray-300"></span
    >Fine</span
  >
  <span class="inline-flex items-center gap-2"
    ><span
      class="size-3.5 rounded-sm bg-warning-100 ring-1 ring-warning-300"
    ></span
    >A real weakness</span
  >
  <span class="inline-flex items-center gap-2"
    ><span class="text-brand-600">★</span>Best in the row; no star for a
    tie</span
  >
  <span class="inline-flex items-center gap-2"
    ><sup class="font-mono text-[10px] text-brand-700">1</sup>Footnote, keyed
    per option below</span
  >
</div>
```

A second legend line, when the attributes need it: each band or column named with a clause on what it measures and why it is here.

## Keyed footnotes

Grouped per option, numbered straight through the page in the order the superscripts appear. One line each; the number is the same mono brand tone the cells use.

```html
<div
  class="grid gap-x-8 gap-y-5 text-sm leading-6 sm:grid-cols-2 lg:grid-cols-3"
>
  <div>
    <p class="font-semibold">Option A</p>
    <!-- prettier-ignore -->
    <p class="mt-1 text-muted-foreground"><sup class="font-mono text-[10px] text-brand-700">1</sup> The tier boundary, the seat pack, the add-on, in one line.</p>
  </div>
</div>
```

## Header photos

A small photo of each option, one per column, all at 4:3, in the header cell above the name. Sourced from the maker's product page, or from a Creative Commons search with the credit in the footer; a photo of a different product than the one named is a lie the reader cannot detect, so a representative photo says so in the caption.

```html
<th>
  <img
    src="data:image/jpeg;base64,…"
    alt="Sony a6700"
    width="480"
    height="360"
    class="aspect-[4/3] w-full rounded-md object-cover"
  />
  <span class="mt-1.5 block text-sm font-semibold">Sony a6700</span>
  <span class="block text-xs font-normal text-muted-foreground"
    >$1,398 body</span
  >
</th>
```

Python, with Pillow: crop to 4:3, resize to 480 wide, JPEG at quality 72, then inline.

```python
import base64, io, urllib.request
from PIL import Image

def inline_photo(url: str) -> str:
    raw = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})).read()
    image = Image.open(io.BytesIO(raw)).convert("RGB")
    w, h = image.size
    if w / h > 4 / 3:
        nw = int(h * 4 / 3); image = image.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w * 3 / 4); image = image.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    out = io.BytesIO()
    image.resize((480, 360)).save(out, "JPEG", quality=72, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(out.getvalue()).decode()
```

## Icon-led list

One Phosphor regular icon per row as a landmark, never two, never an emoji. The how-to-read section is usually this.

```html
<li class="flex items-start gap-2.5">
  <i class="ph ph-rows mt-1 text-lg text-brand-700"></i
  ><span>The claim, in a clause.</span>
</li>
```

## Source footer

Closes every page. What was read, when prices were seen, which prices are quotes, what is inferred, and the photo credits when there are photos.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Sources.</strong> Vendor pricing and feature
  pages for all six, seen the week of writing at the annual rate. Nothing was
  trialed. Two of the prices are quotes, and the footnotes say which.
</footer>
```

## Emphasis, sparingly

The matrix is the focal layer and the only bordered card on the page. The legend, the footnotes, and the reading guide sit directly on the background with tighter type and no chrome, so the eye lands on the table and the rest reads as its apparatus.
