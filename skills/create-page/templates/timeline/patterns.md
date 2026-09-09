# Patterns: the vocabulary the examples use

Canonical spellings for the pieces a timeline keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  Turning point
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">The GDPR applies</h2>
```

Tones for the kicker: `text-brand-700` for the focal one, `text-muted-foreground` for supporting sections and era names.

## Spine entry

One dated entry on a vertical line. The line is the list item's left border, so it runs unbroken between entries; the dot sits on it; the date sits left of the line at laptop width and above the title on a phone. The `<ol>` carries `sm:ml-32` to leave room for the dates.

```html
<ol class="mt-6 sm:ml-32">
  <li class="relative border-l border-border pb-7 pl-6">
    <p
      class="font-mono text-xs text-muted-foreground sm:absolute sm:top-1 sm:right-full sm:mr-6 sm:w-28 sm:text-right sm:whitespace-nowrap"
    >
      Oct 24, 1995
    </p>
    <span
      class="absolute top-1.5 left-[-5px] size-2.5 rounded-full bg-gray-400 ring-4 ring-background"
    ></span>
    <p class="text-sm font-semibold">Data Protection Directive 95/46/EC</p>
    <p class="mt-1 text-sm leading-6 text-muted-foreground">
      One line on what it changed for the reader.
    </p>
  </li>
</ol>
```

Date precision follows the source: `1995` when only the year is known, `Oct 1995` for a month. A date the page is unsure of says so in the entry rather than being rounded to a day.

## Era band

A chapter break on the spine, spanning the full width so the line is interrupted on purpose. The years sit where the dates sit; the name says what was true during the era, not only when it was.

```html
<li id="era-gdpr" class="mb-6 sm:-ml-32">
  <div
    class="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg bg-gray-100 px-4 py-2.5"
  >
    <span class="font-mono text-xs text-muted-foreground">2016 to 2023</span>
    <span class="text-sm font-semibold">The GDPR years</span>
    <span class="text-sm text-muted-foreground"
      >One law for the whole market, and the fines to make it stick.</span
    >
  </div>
</li>
```

A page whose events are columns groups them the same way with a heading row spanning the columns of the era.

## Turning-point callout

An entry after which things were different. It stays on the spine, so the reader sees where it falls, but the dot is larger and brand-toned, and the content sits on a toned card rather than the bare page.

```html
<li class="relative border-l border-brand-300 pb-7 pl-6">
  <p
    class="font-mono text-xs text-brand-700 sm:absolute sm:top-1 sm:right-full sm:mr-6 sm:w-28 sm:text-right sm:whitespace-nowrap"
  >
    May 25, 2018
  </p>
  <span
    class="absolute top-1 left-[-7px] size-3.5 rounded-full bg-brand-600 ring-4 ring-background"
  ></span>
  <div class="rounded-xl border border-brand-200 bg-brand-25 p-4">
    <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
      Turning point
    </p>
    <p class="mt-1 text-base font-semibold">The GDPR applies</p>
    <p class="mt-2 text-sm leading-6">
      What was different afterwards, in two or three sentences.
    </p>
  </div>
</li>
```

Two to four per page. In a table, the same idea is a row whose first cell carries `border-l-2 border-brand-500` and a small "Turning point" label under the date; in a grid of weeks, it is a flagged line at the foot of the cell with `ph-fill ph-flag`.

## Now marker

The present, on the spine. Everything above it has happened; everything below is scheduled, drawn with a dashed line and hollow dots so the difference is visible before it is read. Name the month, because the marker is only right on the day the page was written.

```html
<li class="relative border-l border-dashed border-brand-400 pb-7 pl-6">
  <span
    class="absolute top-0 left-[-9px] flex size-4 items-center justify-center rounded-full bg-brand-600 ring-4 ring-background"
    ><i class="ph-fill ph-map-pin text-[10px] text-white"></i
  ></span>
  <p
    class="inline-flex items-center gap-2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white"
  >
    You are here
    <span class="font-mono font-normal text-white/80">September 2026</span>
  </p>
</li>
<li class="relative border-l border-dashed border-border pb-7 pl-6">
  <p
    class="font-mono text-xs text-muted-foreground sm:absolute sm:top-1 sm:right-full sm:mr-6 sm:w-28 sm:text-right sm:whitespace-nowrap"
  >
    Jan 12, 2027
  </p>
  <span
    class="absolute top-1.5 left-[-5px] size-2.5 rounded-full border-2 border-gray-400 bg-background"
  ></span>
  <p class="text-sm font-semibold">
    A scheduled event
    <span
      class="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase"
      >scheduled</span
    >
  </p>
</li>
```

In a grid of weeks, the now marker is the current column: a brand pill in its header, a brand top rule where the past columns have a dark one and the future columns a light one.

## Span chart

Spans and overlaps as horizontal bars on a year scale, drawn as inline SVG so the file stays self-contained and the bars pick up the palette. The skin's `@theme static` keeps every `--color-*` variable defined, so `fill="var(--color-brand-500)"` resolves inside the SVG. One row per thing that existed; x is linear in time; a dashed line marks now.

```html
<svg viewBox="0 0 840 120" class="w-full" role="img" aria-label="Plans by year">
  <!-- One gridline per year: x = 120 + (year - 2021) * 120. -->
  <g stroke="var(--color-gray-200)">
    <line x1="120" y1="24" x2="120" y2="116" />
    <line x1="240" y1="24" x2="240" y2="116" />
  </g>
  <g font-family="var(--font-mono)" font-size="11" fill="var(--color-gray-500)">
    <text x="124" y="14">2021</text>
    <text x="244" y="14">2022</text>
  </g>
  <!-- A bar from March 2021 to September 2022: x = 120 + (months since Jan 2021) * 10. -->
  <text
    x="110"
    y="45"
    text-anchor="end"
    font-size="11"
    fill="var(--color-gray-700)"
  >
    Starter
  </text>
  <rect
    x="140"
    y="33"
    width="180"
    height="14"
    rx="3"
    fill="var(--color-gray-300)"
  />
  <!-- A bar that reaches the present: current things take the brand tone. -->
  <text
    x="110"
    y="73"
    text-anchor="end"
    font-size="11"
    fill="var(--color-gray-700)"
  >
    Team
  </text>
  <rect
    x="320"
    y="61"
    width="480"
    height="14"
    rx="3"
    fill="var(--color-brand-500)"
  />
  <!-- Now. -->
  <line
    x1="800"
    y1="20"
    x2="800"
    y2="116"
    stroke="var(--color-brand-600)"
    stroke-dasharray="3 3"
  />
  <text x="804" y="14" font-size="11" fill="var(--color-brand-700)">now</text>
</svg>
```

Retired spans take a gray, current ones the brand tone, an add-on or a partial thing a lighter brand tint; a legend under the chart says which is which. Text inside a bar is white on brand and `gray-800` on gray. Keep the viewBox width fixed and let the page scale it; a chart narrower than about 600 pixels should become a list.

## Changelog row

One change per row, read down: when, what, why, what it did. Dates in mono so they align; the consequence column in words unless the source carried a figure.

```html
<table class="w-full text-sm">
  <thead>
    <tr class="border-b border-border text-left text-xs text-muted-foreground">
      <th class="pb-2 pr-4 font-medium">Date</th>
      <th class="pb-2 pr-4 font-medium">What changed</th>
      <th class="pb-2 pr-4 font-medium">Why</th>
      <th class="pb-2 font-medium">What it did</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-border align-top">
    <tr>
      <td
        class="py-3 pr-4 font-mono text-xs whitespace-nowrap text-muted-foreground"
      >
        2022-09-13
      </td>
      <td class="py-3 pr-4 font-medium">Starter renamed Team, $19 to $29</td>
      <td class="py-3 pr-4 text-muted-foreground">The reason, in a clause.</td>
      <td class="py-3 text-muted-foreground">What followed, in words.</td>
    </tr>
  </tbody>
</table>
```

A turning-point row adds `border-l-2 border-brand-500 pl-3` to its first cell and a "Turning point" label under the date. A changelog read latest-first says so in its kicker.

## Source footer

Closes every page. What was read, which dates are scheduled rather than passed, what is inferred, and when the page was written.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Sources.</strong> The published texts of each
  act and the court judgments named; application dates as published. Dates after
  the now marker are scheduled and could move. Written September 2026.
</footer>
```

## Emphasis, sparingly

The toned card is for turning points, not for entries. Ordinary entries sit on the bare page with a small dot and tight type, so the three or four that matter are visible from across the room. Brand green is spent on the turning points, the now marker, and the bars that reach the present; nothing else.
