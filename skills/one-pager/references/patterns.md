# Patterns: the vocabulary the examples use

Canonical spellings for the pieces a one-pager keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  The ask
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">
  Approve the pilot by the ninth
</h2>
```

Tones for the kicker: `text-brand-700` for the ask and the proposal, `text-muted-foreground` for supporting sections, `text-warning-700` for risks.

## Headline pair

The headline names the thing; the subhead is the one sentence a reader repeats to a colleague. Together they answer "what it is" before anything else is read. A meta list beside them (owner, decider, date) keeps the header from being only type.

```html
<header class="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
  <div class="max-w-3xl">
    <p class="text-xs font-medium tracking-[0.14em] text-brand-700 uppercase">
      One-pager · For the exec team
    </p>
    <h1 class="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
      A customer advisory board for Meridian
    </h1>
    <p class="mt-3 text-base leading-7 text-muted-foreground">
      Twelve customers, four sessions a year, one owner: the roadmap heard by
      the people who pay for it before engineers are assigned.
    </p>
  </div>
  <dl
    class="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-xs leading-5 text-muted-foreground"
  >
    <dt class="font-medium tracking-[0.1em] uppercase">Owner</dt>
    <dd class="text-foreground">Product</dd>
    <dt class="font-medium tracking-[0.1em] uppercase">Decision by</dt>
    <dd class="text-foreground">October 9</dd>
  </dl>
</header>
```

A community or editorial register swaps the `h1` to `font-serif` at a larger size and drops the meta list.

## Three-column band

Problem, proposal, outcome, side by side so the reader sees the argument's shape before reading a word. Hairline dividers from a `gap-px` grid on a `bg-border` ground; the outcome column may take a `bg-brand-25` fill as the only tone in the band.

```html
<section
  class="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3"
>
  <div class="bg-card p-5">
    <p
      class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
    >
      Problem
    </p>
    <p class="mt-2 text-sm leading-6">What is wrong today, with evidence.</p>
  </div>
  <div class="bg-card p-5">
    <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
      Proposal
    </p>
    <p class="mt-2 text-sm leading-6">What would exist, concretely.</p>
  </div>
  <div class="bg-brand-25 p-5">
    <p
      class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
    >
      Outcome
    </p>
    <p class="mt-2 text-sm leading-6">What is different after.</p>
  </div>
</section>
```

A technical page replaces the band with a before-and-after pair: two columns, monospace `before` and `after` labels, one short list each, the after column on `bg-brand-25`.

## Costs-and-returns pair

Two short lists under matched kickers, side by side. Figures stay in the units the prompt gave; a figure the reader can check sits in `font-mono` so it reads as a number, not a word.

```html
<section class="grid gap-6 sm:grid-cols-2">
  <div>
    <p
      class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
    >
      What it costs
    </p>
    <ul class="mt-2 space-y-1.5 text-sm leading-6">
      <li class="flex items-start gap-2.5">
        <i class="ph ph-minus mt-1 text-base text-muted-foreground"></i
        ><span
          ><span class="font-mono text-[13px]">8 engineer-weeks</span> to build:
          two engineers, four weeks.</span
        >
      </li>
    </ul>
  </div>
  <div>
    <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
      What it returns
    </p>
    <ul class="mt-2 space-y-1.5 text-sm leading-6">
      <li class="flex items-start gap-2.5">
        <i class="ph ph-plus mt-1 text-base text-brand-700"></i
        ><span
          >About <span class="font-mono text-[13px]">25 hours a week</span> back
          to ops, from the inputs shown above.</span
        >
      </li>
    </ul>
  </div>
</section>
```

## Ask box

The decision, boxed with the only heavy border on the page. Left: the ask as a sentence with a date. Right: the two or three parts a yes consists of, so the reader can agree to each.

```html
<div
  class="grid gap-4 rounded-xl border-2 border-brand-300 bg-card p-5 shadow-sm sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:gap-6"
>
  <div>
    <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
      The ask
    </p>
    <p class="mt-1 text-lg font-semibold tracking-[-0.02em]">
      Approve the board by October 9, before annual planning opens.
    </p>
  </div>
  <ul
    class="space-y-1.5 text-sm leading-6 sm:border-l sm:border-border sm:pl-6"
  >
    <li class="flex items-start gap-2.5">
      <i class="ph ph-check mt-1 text-base text-brand-700"></i
      ><span>A yes on the charter and the twelve-seat cap.</span>
    </li>
  </ul>
</div>
```

A page for a board or a committee may instead list the things the reader can say yes to, each as its own line with a numeral, in one bordered card.

## Risks strip

The risks in a row, each a small cell: the risk in a bold line, the handling under it. Warning tone on the kicker only; the cells stay plain.

```html
<p class="text-xs font-medium tracking-[0.12em] text-warning-700 uppercase">
  Risks, and how each is handled
</p>
<ul
  class="mt-2 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
>
  <li class="bg-card p-4">
    <p class="text-sm font-semibold">The loudest accounts steer it.</p>
    <p class="mt-1 text-xs leading-5 text-muted-foreground">
      Seats by segment, not revenue; one decision per session, with options.
    </p>
  </li>
</ul>
```

A page with room for prose lays the same content out as a list, one risk and its handling per line.

## Next-step line

One line after the ask, so a yes has somewhere to go. An arrow icon, a bold lead-in, the first three things that happen.

```html
<p class="flex items-start gap-2.5 text-sm leading-6">
  <i class="ph ph-arrow-right mt-1 text-base text-brand-700"></i
  ><span
    ><strong>Next step.</strong> If yes on the ninth: the shortlist goes to the
    sponsor the following week, and the first session is on the calendar before
    planning opens.</span
  >
</p>
```

## Icon-led list

One Phosphor regular icon per row as a landmark, never two, never an emoji.

```html
<li class="flex items-start gap-2.5">
  <i class="ph ph-check mt-1 text-lg text-brand-700"></i
  ><span>The claim, in a clause.</span>
</li>
```

## Source footer

Closes every page. Who prepared it, where each figure came from, what is an estimate.

```html
<footer
  class="mt-12 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Provenance.</strong> Prepared by Product for
  the exec team. Time estimates are the owner's, to be confirmed with the
  sponsor; the renewal notes are from the account team's summaries.
</footer>
```

## Emphasis, sparingly

The ask box is the focal layer, not the default wrapper. The band and the risks strip use hairlines, not shadows; everything else sits directly on the page background with a kicker and no chrome. Reserve the brand tone for the proposal kicker, the outcome fill, and the ask.
