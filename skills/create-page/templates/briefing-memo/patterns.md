# Patterns: the vocabulary the examples use

Canonical spellings for the pieces a briefing memo keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Memo header block

To, From, Date, Re, as a ruled definition list under the title. The labels are small mono capitals in a narrow column; the Re line is the one that carries a sentence.

```html
<dl
  class="mt-6 grid grid-cols-[4rem_1fr] gap-x-4 gap-y-1.5 border-y border-foreground py-4 text-sm"
>
  <dt
    class="pt-0.5 font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase"
  >
    To
  </dt>
  <dd>Dana Whitfield, CEO</dd>
  <dt
    class="pt-0.5 font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase"
  >
    From
  </dt>
  <dd>Marcus Lee, VP Operations</dd>
  <dt
    class="pt-0.5 font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase"
  >
    Date
  </dt>
  <dd>September 8, 2026</dd>
  <dt
    class="pt-0.5 font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase"
  >
    Re
  </dt>
  <dd>
    Whether to move fulfillment from Oakland to Reno before the lease ends
  </dd>
</dl>
```

A page in a hurry collapses this to one line of `text-xs text-muted-foreground` beside the title, with the same four labels.

## Bottom line box

The recommendation, the one reason, and the decision date, boxed so the eye lands on it first. A heavy neutral border reads as a memo; a toned strip reads as urgent.

```html
<div class="border-2 border-foreground p-5">
  <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
    Bottom line up front
  </p>
  <p class="mt-2 font-serif text-lg leading-7">
    Do X, because Y. Decision needed by <strong>November 15</strong>.
  </p>
</div>
```

The urgent variant spans the page above the title: `border-b-4 border-warning-500 bg-warning-50`, with the kicker in `text-warning-700` and a `ph ph-warning` icon before it. Warning is a tone for time pressure, never for the recommendation itself.

## Numbered section heading

Memo sections are numbered so they can be referred to in the meeting. The number is mono and muted; the heading is serif on a calm page and sans on a tight one.

```html
<h2 class="flex items-baseline gap-3 font-serif text-xl font-medium">
  <span class="font-mono text-sm text-muted-foreground">1.</span>Context
</h2>
```

Tight variant: `<h2 class="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">01 · Context</h2>`.

## Key fact list

Numbers first, then the clause. Each fact is one line the reader can check, ruled from the next.

```html
<ul class="divide-y divide-border text-sm leading-6">
  <li class="py-2">
    <strong>900 orders a day</strong>, 5.5 days a week, peaking at 1,600 in
    November and December.
  </li>
</ul>
```

For a page that wants the money visible before a word of context, the same facts become a row of stat tiles: `rounded-lg border border-border bg-card p-4`, the figure in `font-mono text-2xl`, the clause in `text-xs text-muted-foreground`.

## Option column

One per option, in parallel, with the same three fields in the same order so the reader compares line for line. The recommended one is marked with a brand border and a kicker; the others stay plain.

```html
<div class="flex flex-col border border-border p-4">
  <p
    class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
  >
    Option A
  </p>
  <p class="mt-1 font-serif text-lg leading-6 font-medium">
    Stay and renew early
  </p>
  <p class="mt-2 text-sm leading-6 text-muted-foreground">
    What it is, in a sentence.
  </p>
  <dl class="mt-4 space-y-3 border-t border-border pt-4 text-sm leading-6">
    <div>
      <dt
        class="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase"
      >
        Cost
      </dt>
      <dd>A number, dated.</dd>
    </div>
    <div>
      <dt
        class="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase"
      >
        Risk
      </dt>
      <dd>What goes wrong, and how likely.</dd>
    </div>
    <div>
      <dt
        class="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase"
      >
        Forecloses
      </dt>
      <dd>What can no longer be chosen afterward.</dd>
    </div>
  </dl>
</div>
```

The same fields work as table columns on a dense page (the recommended row on `bg-brand-25`) or as a compact three-cell row under a headed paragraph when the options are a run of short sections.

## Recommendation strip

Which option and why, then the first steps with an owner and a date each. Brand-toned, because it is the one place the page commits.

```html
<div class="border-l-4 border-brand-500 bg-brand-25 p-5">
  <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
    Recommendation
  </p>
  <p class="mt-2 font-serif text-lg leading-7">
    Option C, because of the one reason.
  </p>
  <ol class="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6">
    <li>
      The first step. <span class="text-muted-foreground">Owner, by date.</span>
    </li>
  </ol>
</div>
```

A sidebar page carries the same content as a sticky card on `bg-brand-600 text-white`, so the answer stays in view while the argument scrolls.

## Open questions list

Numbered, each with what would answer it and who owns finding out. The urgent variant is a checklist with square icons and a date on each row.

```html
<ol class="list-decimal space-y-3 pl-5 text-sm leading-6">
  <li>
    The question, as a question? What would answer it, and what changes if the
    answer is no.
    <span class="text-muted-foreground">Owner, by date.</span>
  </li>
</ol>
```

## Source footer

Closes every page as the annex. What was read, what was measured, what is estimated, and when the figures were seen.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Annex.</strong> Read: the lease, three
  listings seen this week, the Q2 P&amp;L. Not done: no site visit. Rents and
  the move cost are estimates with the ranges shown.
</footer>
```

## Emphasis, sparingly

The bordered box is the focal layer, not the default wrapper: the bottom line and the recommendation get it, the rest sits directly on the page with a heading and a rule. One toned fill per page carries time pressure or the commitment, never both in the same color.
