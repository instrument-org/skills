# Patterns: the vocabulary the examples use

Canonical spellings for the pieces an itinerary keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  Day 2 · Friday
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">
  Belém by the river
</h2>
```

Tones for the kicker: `text-brand-700` for the focal one, `text-muted-foreground` for supporting sections, `text-warning-700` for a warning such as a closure day.

## Day card

One per day. The day number and weekday are the kicker, the day's theme is the heading, the time-of-day blocks are the payload. A line under the heading says how the day moves (on foot, by tram, by train).

```html
<article class="rounded-xl border border-border bg-card p-5 shadow-sm">
  <div class="flex items-baseline justify-between gap-4">
    <p class="font-mono text-xs text-muted-foreground">Day 1 · Thursday</p>
    <p class="text-xs text-muted-foreground">On foot</p>
  </div>
  <h3 class="mt-1 text-lg font-semibold tracking-[-0.02em]">Alfama on foot</h3>
  <ol class="mt-3 divide-y divide-border text-sm">
    <!-- time-of-day blocks -->
  </ol>
</article>
```

A grid of day cards (`grid gap-4 sm:grid-cols-2`) suits a short trip of similar days; a long trip with city changes wants a timeline instead.

## Time-of-day block

Morning, afternoon, evening, and any rest between them. The label column is fixed so the eye can run down it; the place is bold, the rest is muted.

```html
<li class="grid grid-cols-[4.5rem_1fr] gap-3 py-2.5">
  <span
    class="pt-0.5 text-xs font-medium tracking-[0.1em] text-brand-700 uppercase"
    >Morning</span
  >
  <div>
    <p class="font-medium">
      Miradouro de Santa Luzia, then down through the lanes
    </p>
    <p class="mt-0.5 leading-6 text-muted-foreground">
      What to do there, roughly how long, and how to reach the next block.
    </p>
  </div>
</li>
```

A rest block (a nap, a siesta, a free hour) takes a tint so it reads as planned rather than empty: `-mx-5 bg-yellow-50 px-5` inside a card, with `ph-moon` as its icon.

## Timeline spine

For a trip that moves between cities: one vertical line, a node per day, a larger node per city change, a thin row per train leg. The line is a `before:` pseudo-element so the list stays a list.

```html
<ol
  class="relative before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-0.5 before:bg-border before:content-['']"
>
  <li class="relative pb-8 pl-9">
    <span
      class="absolute top-0 -left-1 flex size-6 items-center justify-center rounded-full bg-brand-600 text-white ring-4 ring-background"
      ><i class="ph-fill ph-map-pin text-xs"></i
    ></span>
    <!-- city change: name, nights, base -->
  </li>
  <li class="relative pb-8 pl-9">
    <span
      class="absolute top-1 left-0 size-4 rounded-full border-2 border-brand-600 bg-background ring-4 ring-background"
    ></span>
    <!-- a day: kicker, heading, time-of-day blocks -->
  </li>
  <li class="relative pb-8 pl-9">
    <span
      class="absolute top-2 left-1 size-2 rounded-full bg-gray-400 ring-4 ring-background"
    ></span>
    <p
      class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground"
    >
      <i class="ph ph-train text-base"></i><span>Kyoto → Osaka</span
      ><span>JR special rapid</span><span>about 30 min</span>
    </p>
  </li>
</ol>
```

## Book-ahead tag

A small pill beside anything that sells out or needs a timed entry. It says how far ahead when that matters.

```html
<span
  class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
  ><i class="ph ph-ticket"></i>Book ahead · weeks</span
>
```

A second tone for the unverified: `bg-warning-50 text-warning-700` with `ph-clock` and the text "confirm hours".

## Places list

Every place on the page once, with what it is and the day it belongs to. Keyed to the days by a small mono day marker, never by repeating the day's text.

```html
<ul class="divide-y divide-border text-sm">
  <li class="grid grid-cols-[3rem_1fr] gap-3 py-2">
    <span class="font-mono text-xs text-muted-foreground">D1</span>
    <span
      ><strong>Castelo de São Jorge.</strong> The castle on the hill above the
      base; ramparts, peacocks, and the view.</span
    >
  </li>
</ul>
```

As a rail beside each day's narrative, the list is an `<ol>` numbered in walking order and the day marker is dropped, because the column already says which day.

## Logistics strip

Getting around, book ahead, carry: three cells in one band, so the traveler finds them without reading the days.

```html
<div
  class="grid gap-px overflow-hidden rounded-xl border border-border bg-border text-sm sm:grid-cols-3"
>
  <div class="bg-card p-4">
    <p
      class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
    >
      Getting around
    </p>
    <ul class="mt-2 space-y-1 leading-6">
      <li>…</li>
    </ul>
  </div>
  <div class="bg-card p-4"><!-- Book ahead --></div>
  <div class="bg-card p-4"><!-- Carry --></div>
</div>
```

The same band with four cells carries the trip at a glance: days, base, pace, who.

## Rain-plan callout

One box for the whole trip, naming the swap for each day, plus the tired-day rule. Brand-tinted, never a red warning.

```html
<div class="rounded-xl bg-brand-25 p-5">
  <p
    class="flex items-center gap-2 text-xs font-medium tracking-[0.12em] text-brand-700 uppercase"
  >
    <i class="ph ph-cloud-rain text-base"></i>If it rains
  </p>
  <ul class="mt-2 space-y-1.5 text-sm leading-6">
    <li>
      <strong>Any day.</strong> The named indoor place and how it slots in.
    </li>
    <li><strong>Tired.</strong> Drop the afternoon block, keep the evening.</li>
  </ul>
</div>
```

## Source footer

Closes every page. What was read, when hours and prices were seen, what is inferred, and the photo credit when there is one.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Sources.</strong> Read in full: the official
  sites of every ticketed place and two current guides to the city. Hours and
  prices seen on the day of writing. Times on the page are rough.
</footer>
```

## Emphasis, sparingly

The bordered card is the focal layer, not the default wrapper. Sections that support rather than direct sit directly on the page background with tighter type and no chrome. Reserve toned fills for the rest blocks and the rain plan, and the brand tone for the kicker, the day nodes, and the book-ahead tags.
