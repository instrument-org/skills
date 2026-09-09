# Patterns: the vocabulary the examples use

Canonical spellings for the pieces an explainer keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  How it works
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">
  Four things happen, in a loop
</h2>
```

Tones for the kicker: `text-brand-700` for the focal section, `text-muted-foreground` for supporting ones. A serif long read may set headings as small caps instead: `font-serif text-lg [font-variant-caps:small-caps] tracking-[0.06em]`.

## Short-version box

The mechanism in three or four sentences, near the top, in a box the eye lands on first. Brand-tinted ground, a kicker, and prose; never bullets, because the point is that the sentences connect.

```html
<div class="rounded-xl border border-brand-100 bg-brand-25 p-5 sm:p-6">
  <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
    The short version
  </p>
  <p class="mt-2 text-base leading-7">
    First sentence names the thing. Second says what it does. Third says how, in
    one clause. Fourth says what that means for the reader.
  </p>
</div>
```

A quieter alternative for a serif page: the same content between hairlines, `border-y border-border py-5`, with no fill.

## Numbered step

One thing that happens and the reason it happens. The number is the landmark; the title is the event; the paragraph is the why.

```html
<li class="flex gap-4">
  <span
    class="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 font-mono text-sm text-white"
    >1</span
  >
  <div>
    <p class="font-semibold">The outdoor coil absorbs heat</p>
    <p class="mt-1 text-sm leading-6 text-muted-foreground">
      What happens, and why it happens, in two sentences.
    </p>
  </div>
</li>
```

For a walk-through, a step may carry a worked example under its paragraph: a bordered row in `rounded-lg border border-border bg-card px-4 py-3 text-sm` with the inputs on the left and the result in `font-mono` on the right. The example uses figures the reader gave or the topic fixed, and says which.

## Inline SVG diagram

Boxes, arrows, and labels, hand-placed, drawn with the skin's tokens so it matches the page. The skin's `@theme static` means `fill-card`, `stroke-border`, `fill-brand-500`, and `fill-muted-foreground` resolve inside the SVG; text inherits the page font. Give it a `role="img"` and an `aria-label` that says what it shows, and a caption under it saying how to read it.

```html
<svg
  viewBox="0 0 640 220"
  class="w-full"
  role="img"
  aria-label="Two boxes with a loop between them, hot side on top, cold side below"
>
  <defs>
    <marker
      id="arrow"
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="7"
      markerHeight="7"
      orient="auto-start-reverse"
    >
      <path d="M0 0L10 5L0 10z" class="fill-brand-500" />
    </marker>
  </defs>
  <!-- A part: card fill, hairline stroke, label inside. -->
  <rect
    x="20"
    y="60"
    width="180"
    height="100"
    rx="10"
    class="fill-card stroke-border"
  />
  <text
    x="110"
    y="105"
    text-anchor="middle"
    class="fill-foreground text-[13px] font-semibold"
  >
    Outdoor unit
  </text>
  <text
    x="110"
    y="125"
    text-anchor="middle"
    class="fill-muted-foreground text-[11px]"
  >
    coil, fan, compressor
  </text>
  <!-- A flow: brand for the side that carries what matters, gray for the return. -->
  <path
    d="M200 90H440"
    class="stroke-brand-500"
    stroke-width="3"
    fill="none"
    marker-end="url(#arrow)"
  />
  <path
    d="M440 130H200"
    class="stroke-gray-400"
    stroke-width="2"
    stroke-dasharray="6 5"
    fill="none"
  />
  <text
    x="320"
    y="82"
    text-anchor="middle"
    class="fill-brand-700 text-[11px] font-medium"
  >
    hot vapor
  </text>
  <text
    x="320"
    y="148"
    text-anchor="middle"
    class="fill-muted-foreground text-[11px]"
  >
    cold liquid
  </text>
  <rect
    x="440"
    y="60"
    width="180"
    height="100"
    rx="10"
    class="fill-card stroke-border"
  />
  <text
    x="530"
    y="105"
    text-anchor="middle"
    class="fill-foreground text-[13px] font-semibold"
  >
    Indoor unit
  </text>
</svg>
```

Rules of thumb: parts are `rx="10"` rectangles with a bold label and an optional muted subtitle; flows are 3-unit strokes with one arrowhead, brand for the flow the explanation is about and `stroke-gray-400` dashed for the return; step numbers on the diagram are small circles (`r="11"`, `fill-brand-600`, white `text-[11px]` number) that match the numbered steps beside it; text is `text-[11px]` to `text-[13px]` at a `viewBox` about 640 wide, so it reads at laptop width without a chart library. Six boxes is about the limit; past that, the mechanism wants two diagrams or prose.

## Misconception pair

What you might think, and what is actually the case. The two halves stay visibly paired; the correction is the payload and takes the darker tone.

```html
<div class="grid gap-2 py-4 sm:grid-cols-2 sm:gap-6">
  <div>
    <p
      class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
    >
      You might think
    </p>
    <p class="mt-1 text-sm leading-6 text-muted-foreground">
      The belief, stated the way the reader would state it.
    </p>
  </div>
  <div>
    <p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
      In fact
    </p>
    <p class="mt-1 text-sm leading-6">
      What is actually the case, and the one detail that makes it so.
    </p>
  </div>
</div>
```

A serif page may set the belief as a pull quote instead: `<blockquote class="border-l-2 border-brand-300 pl-5 font-serif text-xl leading-8">` with the correction as an ordinary paragraph under it.

## Further-reading list

Three to five links, each with a clause on what the reader gets there. Primary sources first.

```html
<ul class="space-y-1.5 text-sm leading-6">
  <li class="flex items-start gap-2.5">
    <i class="ph ph-arrow-up-right mt-1 text-base text-brand-700"></i
    ><span
      ><a
        href="https://example.org"
        class="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
        >The primary source</a
      >, for the rule as written rather than as summarized.</span
    >
  </li>
</ul>
```

## Icon-led list

One Phosphor regular icon per row as a landmark, never two, never an emoji. Used for the why-it-matters section when its items are things to look for or ask.

```html
<li class="flex items-start gap-2.5">
  <i class="ph ph-magnifying-glass mt-1 text-lg text-brand-700"></i
  ><span>The thing to look for, in a clause.</span>
</li>
```

## Glossary strip

Optional, at the end of a long read: five terms at most, each in a sentence, set as a definition list in a bordered strip so the reader finds it without reading for it.

```html
<dl
  class="grid gap-x-8 gap-y-3 rounded-xl border border-border bg-card p-5 text-sm sm:grid-cols-2"
>
  <div>
    <dt class="font-semibold">Term</dt>
    <dd class="mt-0.5 leading-6 text-muted-foreground">
      What it means, in one sentence.
    </dd>
  </div>
</dl>
```

## Source footer

Closes every page. What was read, what was simplified, what is illustrative.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Sources.</strong> Read in full: the maker's
  technical guide and two engineering explainers. The cycle is simplified: the
  reversing valve and the defrost cycle are mentioned but not drawn.
  Illustrative: figures are representative, not verified.
</footer>
```

## Emphasis, sparingly

The short-version box and the diagram are the focal layer; everything else sits directly on the page background with a kicker and no chrome. Reserve the brand tone for the kicker of the focal section, the arrows that carry the mechanism, the step numbers, and links.
