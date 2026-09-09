# Patterns: the vocabulary the examples use

Canonical spellings for the pieces a recommendation guide keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  Our pick
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">
  What most people should buy
</h2>
```

Tones for the kicker: `text-brand-700` for the focal one, `text-muted-foreground` for supporting sections, `text-warning-700` for flaws.

## Verdict strip

The pick as a band the eye lands on first. Dark or brand ground, name, price, one reason.

```html
<div class="rounded-xl bg-brand-600 p-6 text-white shadow-sm">
  <p class="text-xs font-medium tracking-[0.12em] text-white/70 uppercase">
    Our pick
  </p>
  <p class="mt-1 text-2xl font-semibold tracking-[-0.02em]">Sony WH-CH720N</p>
  <p class="mt-1 text-sm text-white/80">About $120 · seen this week</p>
  <p class="mt-3 max-w-xl text-sm leading-6 text-white/90">
    The one reason, in a sentence a reader can repeat to a friend.
  </p>
</div>
```

A lighter alternative for a page that wants a quieter top: the same content on `bg-card` with `border-2 border-brand-300`.

## Pick card

One per pick. The role is the kicker, the name is the heading, the "wins when" line is the payload.

```html
<div class="rounded-xl border border-border bg-card p-5 shadow-sm">
  <p
    class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
  >
    Runner-up
  </p>
  <p class="mt-1 text-lg font-semibold">Name</p>
  <p class="text-sm text-muted-foreground">About $90</p>
  <p class="mt-3 text-sm leading-6">
    <strong>Wins when</strong> the reader cares more about X than Y.
  </p>
</div>
```

The top pick's card may take `border-2 border-brand-300`; the others stay plain so the hierarchy is visible before it is read.

## Ranked ledger

For a dense page: the picks as rows rather than cards. Rank circle, name, price, one clause.

```html
<li class="flex items-start gap-3 border-b border-border py-3">
  <span
    class="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-900 font-mono text-xs text-white"
    >1</span
  >
  <div class="min-w-0 flex-1">
    <p class="text-sm font-semibold">
      Name
      <span class="ml-2 font-normal text-muted-foreground">About $120</span>
    </p>
    <p class="mt-0.5 text-sm leading-6 text-muted-foreground">
      The one clause on when it wins.
    </p>
  </div>
</li>
```

## Flaw callout

A remark attached to the flow, warning-toned, never a red error.

```html
<div class="rounded-xl border-l-4 border-warning-500 bg-card p-5 shadow-sm">
  <p class="text-xs font-medium tracking-[0.12em] text-warning-700 uppercase">
    Flaws, not dealbreakers
  </p>
  <ul class="mt-2 space-y-1.5 text-sm leading-6">
    <li class="flex items-start gap-2.5">
      <i class="ph ph-warning mt-1 text-lg text-warning-700"></i
      ><span>Specific, checkable, and not a reason to skip it.</span>
    </li>
  </ul>
</div>
```

## Criteria table

What mattered, in order. The weight column is optional; the order is not.

```html
<table class="w-full text-sm">
  <thead>
    <tr class="border-b border-border text-left text-xs text-muted-foreground">
      <th class="pb-2 pr-4 font-medium">Criterion</th>
      <th class="pb-2 font-medium">Why it is here</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-border align-top">
    <tr>
      <td class="py-2 pr-4 font-medium">Comfort over a workday</td>
      <td class="py-2 text-muted-foreground">
        Because the reader wears them eight hours.
      </td>
    </tr>
  </tbody>
</table>
```

## Skipped list

One line each: name, the reason, nothing more.

```html
<ul class="space-y-2 text-sm leading-6">
  <li class="flex items-start gap-2.5">
    <i class="ph ph-x mt-1 text-lg text-muted-foreground"></i
    ><span><strong>Name.</strong> The reason it was set aside.</span>
  </li>
</ul>
```

## Icon-led list

One Phosphor regular icon per row as a landmark, never two, never an emoji.

```html
<li class="flex items-start gap-2.5">
  <i class="ph ph-check mt-1 text-lg text-brand-700"></i
  ><span>The claim, in a clause.</span>
</li>
```

## Link to the thing

A pick the reader can go buy is a link on its own name: in the verdict, in the pick card's title, on each runner-up in the ledger, and on each option in the skipped list, which is where someone who disagrees with the pick goes next. Link where the page first names each one; the name repeated in the reasoning below does not need it again.

```html
<p class="mt-1 text-xl font-semibold tracking-[-0.02em]">
  <a href="https://www.copper.com/pricing">Copper</a>, Starter plan
</p>
```

The skin styles links in the base layer, so an anchor needs no classes, and a utility on it still wins where a link should read as something else. Color and underline only, never weight or size, so a link inside a heading or a pick title keeps the type it sits in.

Never a URL you have not read. Where no page for the exact thing exists, no link: a name pointing at the nearest other product is a mistake the reader cannot detect.

## Source footer

Closes every page. What was read, when prices were seen, what is inferred.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Sources.</strong> Read in full: three
  long-form reviews and the makers' spec pages. Prices seen on the day of
  writing. The battery figures are the makers' claims, not measured.
</footer>
```

## Sticky pick bar

Optional, for a long page: the pick's name and price pinned to the bottom edge once the verdict has scrolled away. Progressive: the page reads fine without it.

```html
<div class="fixed inset-x-0 bottom-4 z-10 flex justify-center px-4">
  <div
    class="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm shadow-xl"
  >
    <span class="font-semibold">Our pick</span
    ><span class="text-muted-foreground">Name · About $120</span
    ><a href="#verdict" class="font-medium text-brand-700"
      >Back to the verdict</a
    >
  </div>
</div>
```

## Emphasis, sparingly

The bordered card is the focal layer, not the default wrapper. Sections that support rather than decide sit directly on the page background with tighter type and no chrome. Reserve toned fills and colored borders for the few elements carrying the verdict.
