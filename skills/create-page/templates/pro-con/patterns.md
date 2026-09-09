# Patterns: the vocabulary the examples use

Canonical spellings for the pieces a pros and cons page keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-success-700 uppercase">
  The case for
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">What you gain</h2>
```

Tones for the kicker: `text-success-700` for the pros, `text-error-700` for the cons, `text-brand-700` for the bottom line, `text-muted-foreground` for everything else. The two side tones appear on kickers and icons only; a filled green or red panel is a refusal.

## Weight mark

Three dots, filled by how much the point matters to this reader. An unfilled dot is `bg-gray-300`. Explain the scale once on the page, near the first list, and set the weights for the reader's situation rather than in general.

```html
<span
  class="flex shrink-0 items-center gap-1 pt-2"
  title="Matters"
  aria-label="Weight: matters"
>
  <span class="size-1.5 rounded-full bg-foreground"></span>
  <span class="size-1.5 rounded-full bg-foreground"></span>
  <span class="size-1.5 rounded-full bg-gray-300"></span>
</span>
```

A phrase works as well, under the point rather than beside it, for a stacked page with long points:

```html
<p class="mt-1 text-xs leading-5 text-muted-foreground">
  <span class="font-medium text-foreground">How much it matters:</span>
  decides it, because the tax money has nowhere else to come from.
</p>
```

Pick one form per page. The scale is three steps: decides it, matters, minor.

## Weighted point row

Icon, title and one checkable line, weight mark. The icon is the only place the side's tone appears on the row.

```html
<li class="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] gap-3 py-3">
  <i class="ph ph-plus-circle mt-0.5 text-lg text-success-700"></i>
  <div class="text-sm leading-6">
    <p class="font-medium">No state income tax</p>
    <p class="text-muted-foreground">
      About $8,900 a year at your salary, against this year's Illinois rate.
    </p>
  </div>
  <!-- weight mark -->
</li>
```

Cons use `ph ph-minus-circle` in `text-error-700`. Rows sit in a `<ul class="divide-y divide-border">` with no card around them.

## Two-column split

The archetype: pros on the left, cons on the right, side by side from the `sm` breakpoint and stacked below it. Each column is a section with its own kicker so the page still reads in order on a phone.

```html
<div class="grid gap-10 sm:grid-cols-2 sm:gap-8">
  <section id="pros">
    <p class="text-xs font-medium tracking-[0.12em] text-success-700 uppercase">
      The case for
    </p>
    <ul class="mt-2 divide-y divide-border">
      <!-- weighted point rows -->
    </ul>
  </section>
  <section id="cons">
    <p class="text-xs font-medium tracking-[0.12em] text-error-700 uppercase">
      The case against
    </p>
    <ul class="mt-2 divide-y divide-border">
      <!-- weighted point rows -->
    </ul>
  </section>
</div>
```

Stacked is the alternative when the points are long: pros as a numbered list, then cons, each point carrying its weight as a phrase beneath. Two bordered cards side by side is the compact form for short points.

## Good for, bad for pair

Describe readers, not features: a person the pros win for, a person the cons win for. Two short paragraphs, or icon-led lists when the readers are several.

```html
<div class="grid gap-6 sm:grid-cols-2">
  <div>
    <p class="text-xs font-medium tracking-[0.12em] text-success-700 uppercase">
      Good for
    </p>
    <p class="mt-2 text-sm leading-6">
      A couple whose life happens at home and outdoors, with a plan to bank the
      difference rather than spend it.
    </p>
  </div>
  <div>
    <p class="text-xs font-medium tracking-[0.12em] text-error-700 uppercase">
      Bad for
    </p>
    <p class="mt-2 text-sm leading-6">
      Anyone whose week is on foot and whose friends are within a mile.
    </p>
  </div>
</div>
```

## Bottom-line strip

The position, its condition, and the next step. Dark ground when the page has been light and quiet; a bordered box when the page carries serif headings; a left-bordered band for a dense page.

```html
<div class="rounded-xl bg-gray-900 p-6 text-white">
  <p class="text-xs font-medium tracking-[0.12em] text-brand-300 uppercase">
    Bottom line
  </p>
  <p class="mt-2 text-lg leading-7 font-semibold">
    Move if the yard and the winter are what you are after and you are ready to
    own a car.
  </p>
  <p class="mt-2 text-sm leading-6 text-gray-300">
    Before you sign anything: spend a week there in August with the dog.
  </p>
</div>
```

The bordered alternative is the same content on `bg-card` with `border-2 border-brand-300`; the band is `border-l-4 border-brand-500 bg-card shadow-sm`. Nothing but the sources follows it.

## Balance bar

One stacked bar with one segment per point, pros in brand and cons in gray, widths in proportion to the weights on the page, with totals under the ends and a caption saying what the tilt means. The bar has to add up to the weights below it.

```html
<div class="flex h-3 w-full gap-px overflow-hidden rounded-full">
  <div class="bg-brand-600" style="width: 16.7%"></div>
  <div class="bg-brand-500" style="width: 11.1%"></div>
  <div class="bg-brand-400" style="width: 5.6%"></div>
  <div class="bg-gray-500" style="width: 16.7%"></div>
  <div class="bg-gray-400" style="width: 11.1%"></div>
</div>
<div class="mt-2 flex justify-between text-xs font-medium">
  <span class="text-brand-700">For · 6</span>
  <span class="text-gray-600">Against · 5</span>
</div>
```

## Inline SVG scale

A pan balance whose beam tilts toward the heavier side. The tilt is the weight difference times three degrees, capped at twelve; the pans counter-rotate so they hang straight. Colors come from the skin's variables, which `@theme static` emits even when no utility uses them.

```html
<svg
  viewBox="0 0 240 120"
  class="h-auto w-56"
  role="img"
  aria-label="Balance tilted toward the case for, 10 to 8"
>
  <line
    x1="120"
    y1="30"
    x2="120"
    y2="104"
    stroke="var(--color-gray-400)"
    stroke-width="3"
    stroke-linecap="round"
  />
  <line
    x1="84"
    y1="106"
    x2="156"
    y2="106"
    stroke="var(--color-gray-400)"
    stroke-width="3"
    stroke-linecap="round"
  />
  <g transform="rotate(-6 120 30)">
    <line
      x1="30"
      y1="30"
      x2="210"
      y2="30"
      stroke="var(--color-gray-700)"
      stroke-width="3"
      stroke-linecap="round"
    />
    <g transform="rotate(6 30 30)">
      <path
        d="M30 30 v22 M14 52 h32"
        stroke="var(--color-brand-600)"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
    </g>
    <g transform="rotate(6 210 30)">
      <path
        d="M210 30 v22 M194 52 h32"
        stroke="var(--color-gray-400)"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
    </g>
  </g>
  <circle cx="120" cy="30" r="4" fill="var(--color-gray-700)" />
</svg>
```

A negative angle tilts the left pan down. Label the pans with the totals beneath the figure, and never tilt a scale the page's weights do not justify.

## Link to the thing

Both sides are things the reader can go look at, so both get a link where the heading first names them, the thing being moved to and the thing being moved from. The tallies and the case headings below repeat the names and stay plain.

```html
<h1 class="mt-2 text-3xl font-semibold tracking-[-0.03em]">
  Moving a 300-product store from
  <a href="https://woocommerce.com/pricing/">WooCommerce</a> to
  <a href="https://www.shopify.com/pricing">Shopify</a>
</h1>
```

The skin styles links in the base layer, so an anchor needs no classes, and a utility on it still wins where a link should read as something else. Color and underline only, never weight or size, so a link inside a heading keeps the type it sits in.

Never a URL you have not read. Where no page for the exact thing exists, no link: a name pointing at the nearest other product is a mistake the reader cannot detect.

## Source footer

Closes every page. What was read, when figures were seen, what was assumed about the reader, what is inferred.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Sources.</strong> Read in full: the state
  revenue page, climate normals for both cities, and current rental listings.
  Rents seen this month. The salary is an assumption from the prompt.
</footer>
```

## Emphasis, sparingly

The bordered card is the focal layer, not the default wrapper. Pros and cons sit directly on the page background unless the page is compact enough to want them as two cards. Reserve toned fills for the bottom line, and keep success and error to icons and kickers.
