# Patterns: the vocabulary the examples use

Canonical spellings for the pieces a scorecard keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose. Every score on a page shares one scale, and the tone rule is the same everywhere: brand green for strong, `warning` for middling, `error` for weak, gray for the track behind a score.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  Overall
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">How it scored</h2>
```

Tones for the kicker: `text-brand-700` for the focal one, `text-muted-foreground` for supporting sections, `text-warning-700` for the walk-away callout.

## Overall grade badge

The biggest thing on the page. A square badge carrying the grade, the scale beside it, and one line on what the grade means. Letters and numbers both fit; the badge tone follows the grade.

```html
<div class="flex items-center gap-5">
  <div
    class="flex size-24 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-5xl font-semibold tracking-[-0.04em] text-white shadow-sm"
  >
    B+
  </div>
  <div>
    <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
      Overall
    </p>
    <p class="mt-1 text-lg font-semibold">
      Adopt it, with two rules set on day one.
    </p>
    <p class="mt-1 text-sm text-muted-foreground">
      Mean of six dimensions, none weighted. The weakest is search.
    </p>
  </div>
</div>
```

For a number, the badge reads `7.8` with a smaller `/ 10` beside it: `<span class="text-5xl">7.8</span><span class="ml-1 text-lg text-white/70">/10</span>`. Badge tones: `bg-brand-600` for the top of the scale, `bg-warning-500` for the middle, `bg-error-500` for the bottom; a `bg-gray-900` badge is the neutral choice when the page wants the color spent elsewhere.

## Dimension row with a bar

One per dimension. Label, grade, a short bar on the same scale, and the evidence line under it. The bar's width is the score as a percent of the scale.

```html
<li
  class="grid gap-2 border-b border-border py-3 sm:grid-cols-[11rem_1fr] sm:gap-5"
>
  <div>
    <p class="text-sm font-semibold">Search and findability</p>
    <div class="mt-1.5 flex items-center gap-2">
      <span class="w-7 font-mono text-sm font-medium text-warning-700">C+</span>
      <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          class="h-full rounded-full bg-warning-500"
          style="width: 60%"
        ></div>
      </div>
    </div>
  </div>
  <p class="text-sm leading-6 text-muted-foreground">
    The one specific fact that earned the grade.
  </p>
</li>
```

A letter scale maps to bar widths: A 100, A- 92, B+ 84, B 76, B- 68, C+ 60, C 52, C- 44, D 36, F 20.

## Dot rating

Five dots for a coarse scale, filled from the left. Reads at any size and needs no legend.

```html
<span class="flex items-center gap-1" role="img" aria-label="4 of 5">
  <i class="size-2.5 rounded-full bg-brand-600"></i>
  <i class="size-2.5 rounded-full bg-brand-600"></i>
  <i class="size-2.5 rounded-full bg-brand-600"></i>
  <i class="size-2.5 rounded-full bg-brand-600"></i>
  <i class="size-2.5 rounded-full bg-gray-200"></i>
</span>
```

Half steps: a dot with `bg-brand-300`. Ten-point scores round to the nearest half.

## Inline SVG dial

A three-quarter arc gauge with the score in the center. The track and the value are the same circle drawn twice; only the dash length differs. Radius 24 gives a circumference of 150.8, and the 270-degree track is 113.1 of it, so the value's dash length is `score / scale * 113.1`. The skin is `@theme static`, so `var(--color-brand-500)` resolves inside the SVG.

```html
<svg viewBox="0 0 56 56" class="size-20" role="img" aria-label="7.5 out of 10">
  <circle
    cx="28"
    cy="28"
    r="24"
    fill="none"
    stroke="var(--color-gray-200)"
    stroke-width="5"
    stroke-linecap="round"
    stroke-dasharray="113.1 150.8"
    transform="rotate(135 28 28)"
  />
  <circle
    cx="28"
    cy="28"
    r="24"
    fill="none"
    stroke="var(--color-brand-500)"
    stroke-width="5"
    stroke-linecap="round"
    stroke-dasharray="84.8 150.8"
    transform="rotate(135 28 28)"
  />
  <text
    x="28"
    y="33"
    text-anchor="middle"
    font-family="Inter, sans-serif"
    font-size="15"
    font-weight="600"
    fill="currentColor"
  >
    7.5
  </text>
</svg>
```

Dash lengths for a ten-point scale: 5.0 is 56.5, 6.0 is 67.9, 7.0 is 79.2, 8.0 is 90.5, 9.0 is 101.8. Swap the value stroke to `var(--color-warning-500)` below 6 and `var(--color-error-500)` below 4.

## Segmented heat strip

Every dimension in one wide bar, each segment toned by its score, labels beneath. For a compact page where the shape of the grades matters more than any one number.

```html
<div class="flex gap-0.5 overflow-hidden rounded-lg">
  <div
    class="flex h-12 flex-1 items-center justify-center bg-brand-600 font-mono text-sm font-medium text-white"
  >
    82
  </div>
  <div
    class="flex h-12 flex-1 items-center justify-center bg-brand-300 font-mono text-sm font-medium text-white"
  >
    71
  </div>
  <div
    class="flex h-12 flex-1 items-center justify-center bg-warning-300 font-mono text-sm font-medium text-warning-900"
  >
    58
  </div>
  <div
    class="flex h-12 flex-1 items-center justify-center bg-error-300 font-mono text-sm font-medium text-error-900"
  >
    41
  </div>
</div>
<div
  class="mt-2 grid grid-cols-4 gap-0.5 text-center text-xs text-muted-foreground"
>
  <span>Sign-up</span><span>First value</span><span>Empty states</span
  ><span>Invite</span>
</div>
```

Tones on a 100-point scale: 75 and up `bg-brand-600`, 60 to 74 `bg-brand-300`, 45 to 59 `bg-warning-300`, under 45 `bg-error-300`.

## Strengths and weaknesses columns

Two columns, equal weight, three to five items each. Icons are optional; when used, one Phosphor regular icon per row, never an emoji.

```html
<div class="grid gap-6 sm:grid-cols-2">
  <div>
    <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
      Strengths
    </p>
    <ul class="mt-2 space-y-1.5 text-sm leading-6">
      <li class="flex items-start gap-2.5">
        <i class="ph ph-plus mt-1 text-lg text-brand-700"></i
        ><span>Specific, and checkable.</span>
      </li>
    </ul>
  </div>
  <div>
    <p class="text-xs font-medium tracking-[0.12em] text-warning-700 uppercase">
      Weaknesses
    </p>
    <ul class="mt-2 space-y-1.5 text-sm leading-6">
      <li class="flex items-start gap-2.5">
        <i class="ph ph-minus mt-1 text-lg text-warning-700"></i
        ><span>Specific, and whether it is a dealbreaker.</span>
      </li>
    </ul>
  </div>
</div>
```

## Walk-away callout

For a page grading a purchase or a hire: the conditions under which the grade stops mattering. Warning-toned, never a red error.

```html
<div class="rounded-xl border-l-4 border-warning-500 bg-card p-5 shadow-sm">
  <p class="text-xs font-medium tracking-[0.12em] text-warning-700 uppercase">
    Walk away if
  </p>
  <ul class="mt-2 space-y-1.5 text-sm leading-6">
    <li class="flex items-start gap-2.5">
      <i class="ph ph-warning mt-1 text-lg text-warning-700"></i
      ><span>The one condition, checkable on the spot.</span>
    </li>
  </ul>
</div>
```

## Comparables strip

Two or three peers on the same scale, subject first and bordered. Each card: name, the grade, one line on where it wins or loses. A small table with a column per peer does the same job when the reader wants every dimension side by side.

```html
<div class="grid gap-3 sm:grid-cols-3">
  <div class="rounded-xl border-2 border-brand-300 bg-card p-4 shadow-sm">
    <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
      This one
    </p>
    <p class="mt-1 text-sm font-semibold">2019 Outback, 61,000 mi</p>
    <p class="font-mono text-2xl font-semibold">7.8</p>
    <p class="mt-1 text-xs leading-5 text-muted-foreground">
      Where it wins, in a clause.
    </p>
  </div>
  <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
    <p
      class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
    >
      Peer
    </p>
    <p class="mt-1 text-sm font-semibold">2019 Forester, 59,000 mi</p>
    <p class="font-mono text-2xl font-semibold">7.4</p>
    <p class="mt-1 text-xs leading-5 text-muted-foreground">
      Where it loses, in a clause.
    </p>
  </div>
</div>
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

Closes every page. What was read, inspected, or measured, when figures were seen, what is inferred, and the credit for any photo.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Sources.</strong> The listing, the history
  report, and a pre-purchase inspection at an independent shop. Prices seen on
  the day of writing. The fuel figure is the maker's, not measured.
</footer>
```

## Emphasis, sparingly

The grade badge is the focal layer. Dimension rows, evidence, and comparables sit directly on the page background with tighter type and no chrome; the bordered card is reserved for the subject in the comparables strip and for the walk-away callout. Reserve the warning and error tones for scores that earned them, so a page of strong grades reads green and a page of weak ones does not.
