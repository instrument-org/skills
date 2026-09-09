# Patterns: the vocabulary the examples use

Canonical spellings for the pieces a should-I page keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  What it depends on
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">
  Five things to check against your case
</h2>
```

Tones for the kicker: `text-brand-700` for the focal one, `text-muted-foreground` for supporting sections, `text-warning-700` for risks.

## Short-answer badge

The answer as the first thing the eye lands on. One of three tones, chosen by the answer and never by taste: success for yes, error for no, warning for it depends. Every other saturated color on the page is brand green.

```html
<div class="rounded-xl border-2 border-warning-300 bg-warning-50 px-6 py-5">
  <p class="text-xs font-medium tracking-[0.12em] text-warning-700 uppercase">
    Short answer
  </p>
  <p class="mt-1 text-4xl font-semibold tracking-[-0.03em] text-warning-900">
    It depends
  </p>
  <p class="mt-2 text-sm leading-6 text-warning-900/80">
    One sentence on what it depends on.
  </p>
</div>
```

The same block in success uses `border-success-300 bg-success-50 text-success-700 text-success-900`; in error, `border-error-300 bg-error-50 text-error-700 text-error-900`. Two other forms: a pill for a compact page, `inline-flex items-center gap-2 rounded-full border border-error-300 bg-error-50 px-4 py-1.5 text-lg font-semibold text-error-700` with a `ph-x-circle` icon in front of the word; and the word set large for a long read, `font-serif text-5xl text-success-900` inside a rounded pill on `bg-success-50`, with a `ph-check-circle` beside it.

## Factor checklist row

One row per factor, stated as a condition the reader can tick against their own case. A real checkbox, so the page reads the same with scripts off; a script may count the ticks and say what they add up to.

```html
<label
  class="flex cursor-pointer items-start gap-3 border-b border-border py-3"
>
  <input type="checkbox" class="mt-1 size-4 shrink-0 accent-brand-600" />
  <span class="text-sm leading-6">
    <strong>Your contract renews within 90 days.</strong>
    <span class="text-muted-foreground">
      Leaving mid-term forfeits the rest of the year.
    </span>
  </span>
</label>
```

For a page where the reader reads rather than ticks, drop the input and lead the row with a mono figure (`font-mono text-xs text-muted-foreground`) or a `ph-scales` icon. For factors that branch, make the row two sentences: "If your house is…, then…" and "If instead…, then…", the second in `text-muted-foreground`.

## Persona card

"If you are… then…". The condition is the kicker, the answer is the chip, the reasoning is the payload. Cards in a grid when there are three or four; rows with the chip in a narrow column when there are more or the page is dense.

```html
<div class="rounded-xl border border-border bg-card p-5 shadow-sm">
  <p
    class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
  >
    If you stay 3 years
  </p>
  <p
    class="mt-2 inline-flex rounded-full bg-error-50 px-2.5 py-0.5 text-xs font-semibold text-error-700"
  >
    No
  </p>
  <p class="mt-3 text-sm leading-6">
    The reason, with a number in it the reader can check.
  </p>
</div>
```

Chips: `bg-success-50 text-success-700` for yes, `bg-error-50 text-error-700` for no, `bg-warning-50 text-warning-700` for a narrow or conditional yes. The card whose situation matches the reader's may take `border-2` in its chip's tone so the eye finds it first.

## Next-step box

The one thing to do this week, what it costs, and what it tells the reader. Brand-toned, because it is the page's only call to action.

```html
<div class="rounded-xl bg-brand-600 p-5 text-white shadow-sm">
  <p class="text-xs font-medium tracking-[0.12em] text-white/70 uppercase">
    Next step
  </p>
  <p class="mt-1 text-lg font-semibold">
    Get three Loan Estimates on the same day
  </p>
  <p class="mt-2 text-sm leading-6 text-white/90">
    Costs an hour and one credit pull. Tells you the real closing costs and
    whether the rate carries points.
  </p>
</div>
```

Quieter, for a long read: `border-2 border-brand-300 bg-card` with the kicker in `text-brand-700`. For a not-yet answer, a "revisit when" variant lists the dated conditions that reopen the question:

```html
<div class="rounded-xl border-l-4 border-brand-500 bg-card p-4 shadow-sm">
  <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
    Revisit when
  </p>
  <ul class="mt-2 space-y-1 text-sm leading-6">
    <li class="flex items-start gap-2.5">
      <i class="ph ph-calendar-blank mt-1 text-base text-brand-700"></i
      ><span>A condition with a date or a count in it.</span>
    </li>
  </ul>
</div>
```

## FAQ item

Native `details` and `summary`, so it opens with scripts off. The caret turns with the `open` state through Tailwind's `group-open` variant.

```html
<details class="group border-b border-border py-3">
  <summary
    class="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium"
  >
    Will it keep up at 20 below?
    <i
      class="ph ph-caret-down text-base text-muted-foreground transition-transform group-open:rotate-180"
    ></i>
  </summary>
  <p class="mt-2 text-sm leading-6 text-muted-foreground">
    The answer in a sentence or two.
  </p>
</details>
```

For a page that wants every answer visible, a definition list with the question in `font-medium` and the answer under it does the same job with no disclosure; a compact page sets it in two columns.

## Link to the thing

The question names what the reader would be moving to and away from, and both are links there, since a reader who is not yet sure what either costs goes to check before reading the answer. Link the page that carries the number the page argues about, which is usually pricing rather than a marketing home page.

```html
<h1 class="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
  Should we move 40 people from <a href="https://slack.com/pricing">Slack</a> to
  <a
    href="https://www.microsoft.com/en-us/microsoft-teams/compare-microsoft-teams-business-options"
    >Microsoft Teams</a
  >?
</h1>
```

The skin styles links in the base layer, so an anchor needs no classes, and a utility on it still wins where a link should read as something else. Color and underline only, never weight or size, so a link inside a heading keeps the type it sits in.

Never a URL you have not read. Where no page for the exact thing exists, no link: a name pointing at the nearest other product is a mistake the reader cannot detect.

## Source footer

Closes every page. What the numbers rest on, what was assumed, when rates and prices were seen.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Sources.</strong> Payments computed on the
  balance and rates the reader gave; closing costs assumed at 2 percent. Rate
  quotes seen this week and stale by next. The reader's loan balance is assumed.
</footer>
```

## Emphasis, sparingly

The badge is the focal layer, and the next-step box is the only other filled surface. Sections that support rather than decide sit directly on the page background with a kicker and no chrome. Reserve toned fills and colored borders for the badge, the chips, the risk callout, and the call to action.
