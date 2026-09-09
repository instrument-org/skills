# Patterns: the vocabulary the examples use

Canonical spellings for the pieces a TLDR brief keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  What applies when
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">
  Four dates, two of them yours
</h2>
```

Tones for the kicker: `text-brand-700` for the focal one, `text-muted-foreground` for supporting sections, `text-warning-700` for the catch.

## Headline as verdict

The title is the conclusion. It is long for a title and short for a paragraph: one sentence, sometimes two, that a reader could repeat in a meeting.

```html
<h1
  class="mt-3 text-3xl font-semibold leading-[1.15] tracking-[-0.03em] sm:text-4xl"
>
  You are a deployer, not a high-risk provider. Two obligations land by August
  2026, and both are about a week of work.
</h1>
<p class="mt-4 text-base leading-7 text-muted-foreground">
  One line on who this is for, how long it takes to read, and where the long
  version lives.
</p>
```

A serif headline (`font-serif font-medium`) moves the page toward a newspaper; the sans headline reads as a newsletter item. Pick one per page.

## Lead-in bullet

One fact, its consequence, and a bold lead-in that names the bullet's job. The lead-in is a label, not a heading: it sits inline and the sentence runs on from it.

```html
<li class="text-base leading-7">
  <strong class="font-semibold">Why it matters:</strong> the fact, then what it
  means for this reader, in one or two sentences.
</li>
```

Lead-ins that earn their place: The big picture, Why it matters, By the numbers, The catch, Yes, but, What's next, The bottom line. Use each at most twice; a page where every lead-in is "Why it matters" has no lead-ins. "The catch" is the one a reader looks for, so a page rarely omits it.

The run-in head, for a serif page: the lead-in as small caps in the sans face, and the bullet as a short paragraph.

```html
<p class="font-serif text-[15px] leading-7">
  <span
    class="mr-1.5 font-sans text-[15px] font-semibold tracking-[0.06em] [font-variant-caps:all-small-caps]"
  >
    The catch.
  </span>
  The fact, then the consequence.
</p>
```

## Bullet card

For a page that wants the bullets as a grid rather than a list: one small card each, the lead-in as the kicker. Cards are the same height only if the text is; keep the bullets to similar lengths.

```html
<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
  <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
    Where it is law
  </p>
  <p class="mt-1.5 text-sm leading-6">The fact, then the consequence.</p>
</div>
```

The catch, as the one warning-toned card in the grid, spanning the full row when it is the bullet the reader must not miss:

```html
<div
  class="rounded-xl border-l-4 border-warning-500 bg-warning-50 p-4 sm:col-span-2"
>
  <p class="text-xs font-medium tracking-[0.12em] text-warning-700 uppercase">
    The catch
  </p>
  <p class="mt-1.5 text-sm leading-6">Specific and checkable.</p>
</div>
```

## Do and do not

Two columns, the same length, imperative mood. A check for do, an x for do not, one Phosphor icon per row and never an emoji.

```html
<div class="grid gap-6 sm:grid-cols-2">
  <div>
    <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
      Do
    </p>
    <ul class="mt-2 space-y-1.5 text-sm leading-6">
      <li class="flex items-start gap-2.5">
        <i class="ph ph-check mt-1 text-base text-brand-700"></i
        ><span>The action, with enough detail to start tomorrow.</span>
      </li>
    </ul>
  </div>
  <div>
    <p
      class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
    >
      Do not
    </p>
    <ul class="mt-2 space-y-1.5 text-sm leading-6">
      <li class="flex items-start gap-2.5">
        <i class="ph ph-x mt-1 text-base text-muted-foreground"></i
        ><span>The mistake, and in a clause why people make it.</span>
      </li>
    </ul>
  </div>
</div>
```

As a boxed sidebar on a two-column page, the same two lists stack inside `rounded-xl border border-border bg-card p-5`, with the do list first.

## Tiny bar chart

Inline SVG, hand-placed, a few bars. The skin's `@theme static` means `fill-brand-500` and `stroke-border` resolve inside the SVG; text inherits the page font. Give the chart an `aria-label` that says what the bars show, and a caption under it that says the source and what the reader should take from it. One chart per page, and only when it says something a bullet cannot.

```html
<svg
  viewBox="0 0 300 130"
  class="mt-3 w-full"
  role="img"
  aria-label="Fires per year, 30 in 2019 rising to 277 in 2024"
>
  <g class="fill-brand-500">
    <rect x="10" y="100" width="36" height="10" rx="2" />
    <rect x="58" y="96" width="36" height="14" rx="2" />
    <rect x="106" y="76" width="36" height="34" rx="2" />
    <rect x="154" y="39" width="36" height="71" rx="2" />
    <rect x="202" y="23" width="36" height="87" rx="2" />
    <rect x="250" y="20" width="36" height="90" rx="2" />
  </g>
  <line x1="10" x2="286" y1="110.5" y2="110.5" class="stroke-border" />
  <g class="fill-foreground text-[11px] font-medium" text-anchor="middle">
    <text x="28" y="95">30</text>
    <text x="268" y="15">277</text>
  </g>
  <g class="fill-muted-foreground text-[11px]" text-anchor="middle">
    <text x="28" y="125">2019</text>
    <text x="268" y="125">2024</text>
  </g>
</svg>
```

Bars are 36 wide on a 48 pitch; the baseline is `y=110` and heights scale so the tallest bar is 90. Value labels sit five units above each bar. Six bars is about the limit; past that, use a table.

## Compact table

For dates, tiers, or a cost under a few designs. Header in the muted tone, rows divided by hairlines, the column that answers the reader's question last so the eye lands on it.

```html
<table class="w-full text-sm">
  <thead>
    <tr class="border-b border-border text-left text-xs text-muted-foreground">
      <th class="pb-2 pr-4 font-medium">Date</th>
      <th class="pb-2 pr-4 font-medium">What starts</th>
      <th class="pb-2 font-medium">For you</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-border align-top">
    <tr>
      <td class="py-2 pr-4 font-mono text-xs whitespace-nowrap">Aug 2, 2026</td>
      <td class="py-2 pr-4">Transparency rules</td>
      <td class="py-2 font-medium">Disclose the AI in the UI.</td>
    </tr>
  </tbody>
</table>
```

## Go deeper

Three to five links, each with a clause on what the reader gets there. The clause is the point; a bare list of URLs is a bookmarks folder.

```html
<ul class="space-y-1.5 text-sm leading-6">
  <li class="flex items-start gap-2.5">
    <i class="ph ph-arrow-up-right mt-1 text-base text-brand-700"></i
    ><span
      ><a
        href="https://example.org"
        class="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
        >The regulation text</a
      >, for Article 50 and Annex III, the two pages worth reading in
      full.</span
    >
  </li>
</ul>
```

## Source footer

Closes every page. What was read, when figures were seen, what is inferred.

```html
<footer
  class="mt-12 border-t border-border pt-5 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Sources.</strong> Read in full: the regulation
  text and two client notes on small-business obligations. Dates are from the
  regulation; the delay proposal is reported, not adopted. No lawyer reviewed
  this page.
</footer>
```

## Emphasis, sparingly

The bordered card is the focal layer, not the default wrapper. On a one-column page nothing needs a card; the lead-ins carry the hierarchy. On a grid page every bullet is a card and the catch is the only toned one. Reserve brand green for kickers, icons, the chart, and links, and the warning tone for the catch alone.
