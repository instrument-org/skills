# Patterns: the vocabulary the examples use

Canonical spellings for the pieces a case study keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose. The rule that runs through all of them: a figure never appears without its caveat, and a quote never appears without its role.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  Approach
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">
  What they did, in order
</h2>
```

Tones for the kicker: `text-brand-700` for the focal section, `text-muted-foreground` for the rest. A numbered variant for the report register puts a mono number before the heading: `<span class="font-mono text-sm text-muted-foreground">02</span>`.

## Results strip

Two to four figures the story itself supplied, each with the caveat under it in the same tile. The caveat is not optional and is not smaller than the reader can read; it is the part that keeps the figure honest.

```html
<dl class="grid gap-4 sm:grid-cols-3">
  <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
    <dt
      class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
    >
      Revenue
    </dt>
    <dd class="mt-1 text-3xl font-semibold tracking-[-0.03em] tabular-nums">
      $2.1M <span class="text-muted-foreground">to</span> $2.2M
    </dd>
    <dd class="mt-2 text-xs leading-5 text-muted-foreground">
      Year over year. Two new retainers landed in the same period, so the change
      and the pricing move cannot be separated.
    </dd>
  </div>
</dl>
```

A page that has no figures worth a tile states the results in words and skips the strip. A page in the engineering register may prefer a table with Before, After, and Caveat columns, one row per metric.

## Attributed pull quote

A sentence someone in the story said, attributed to their role. A name appears only when the source is public; an anonymized or invented source gets the role and nothing else.

```html
<figure class="my-8 border-l-4 border-brand-500 pl-5">
  <blockquote class="text-lg leading-8 font-medium tracking-[-0.01em]">
    The first month I was terrified of Fridays. By the third, Friday was the day
    clients stopped expecting an answer and started sending better briefs.
  </blockquote>
  <figcaption class="mt-2 text-sm text-muted-foreground">
    Producer, the studio
  </figcaption>
</figure>
```

The magazine variant drops the border, sets the quote in `font-serif text-2xl leading-10` at full width so it breaks a run of columns, and puts a short rule above the attribution.

## Before/after pair

Two short columns with the same number of lines, so the reader compares row for row. Icons are landmarks: `ph-x` on the left, `ph-check` on the right, muted and brand.

```html
<div
  class="grid gap-6 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2"
>
  <div>
    <p
      class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
    >
      Before
    </p>
    <ul class="mt-2 space-y-1.5 text-sm leading-6">
      <li class="flex items-start gap-2.5">
        <i class="ph ph-x mt-1 text-base text-muted-foreground"></i>
        <span>Orders in a paper book by the register.</span>
      </li>
    </ul>
  </div>
  <div>
    <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
      After
    </p>
    <ul class="mt-2 space-y-1.5 text-sm leading-6">
      <li class="flex items-start gap-2.5">
        <i class="ph ph-check mt-1 text-base text-brand-700"></i>
        <span>One order page, capped per day at oven capacity.</span>
      </li>
    </ul>
  </div>
</div>
```

The engineering variant is a table with a row per concern (store, indexing, query path, consistency, on-call, cost) and Before and After columns, in `text-sm` with mono for identifiers.

## Lessons list

Numbered, three to six, each one sentence the reader could act on. A page that has learned something it would do differently says so in the same list rather than hiding it.

```html
<ol class="space-y-3 text-sm leading-6">
  <li class="flex items-start gap-3">
    <span
      class="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-900 font-mono text-xs text-white"
      >1</span
    >
    <span
      ><strong>Measure before you change anything.</strong> Eight weeks of time
      tracking found the eleven hours a week the four-day week was paid for
      with.</span
    >
  </li>
</ol>
```

## Apply-this box

The one section written for the reader rather than about the subject. Conditions under which the case transfers and under which it does not, then the first step. Brand-tinted so it reads as the destination of the page.

```html
<div class="rounded-xl border-2 border-brand-300 bg-brand-25 p-5">
  <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
    Apply this
  </p>
  <div class="mt-3 grid gap-5 text-sm leading-6 sm:grid-cols-2">
    <div>
      <p class="font-semibold">This transfers when</p>
      <ul class="mt-1 space-y-1">
        <li class="flex items-start gap-2.5">
          <i class="ph ph-check mt-1 text-base text-brand-700"></i
          ><span
            >A condition the reader can check about their own situation.</span
          >
        </li>
      </ul>
    </div>
    <div>
      <p class="font-semibold">It does not when</p>
      <ul class="mt-1 space-y-1">
        <li class="flex items-start gap-2.5">
          <i class="ph ph-x mt-1 text-base text-muted-foreground"></i
          ><span>A condition that breaks the analogy.</span>
        </li>
      </ul>
    </div>
  </div>
  <p class="mt-4 border-t border-brand-100 pt-3 text-sm leading-6">
    <strong>First step.</strong> The one thing to do this week if the conditions
    hold.
  </p>
</div>
```

## Source footer

Closes every page. Where the story came from, what is quoted, what is reconstructed, and whether the case is composite or illustrative.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Sources.</strong> Two interviews with the
  founders, the studio's time-tracking export for the trial period, and its
  hiring records. Quotes are from the interviews; the pre-trial delivery figure
  is reconstructed from project files. Illustrative: this story and its figures
  are representative, not verified.
</footer>
```

## Emphasis, sparingly

The bordered card is for the results strip, the before/after pair, and the apply-this box, because those are what a reader who skims will take away. Narrative sections sit directly on the page background. Brand tone is spent on the apply-this box and the focal kicker; a page with three toned boxes has no focal point.
