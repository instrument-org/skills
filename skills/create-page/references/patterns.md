# Patterns: the recurring vocabulary

Canonical spellings for the elements pages of every template reach for. Each is a starting point, not a uniform: restyle freely, and let form follow the material. What these end is respelling, not variety.

## Section heading

```html
<h2 class="text-xl font-semibold tracking-[-0.02em]">
  What the section answers
</h2>
```

Give every section an `id`, so a heading can be linked to and sent on its own. The heading states what the section says rather than naming its topic, since it is the line most likely to be the only one read.

To mark the sections, put a Phosphor icon first inside the `h2`:

```html
<h2
  id="the-pattern"
  class="flex items-baseline gap-2 text-xl font-semibold tracking-[-0.02em]"
>
  <i class="ph ph-repeat shrink-0 text-lg text-gray-400"></i>Eleven reactions
  that keep coming back
</h2>
```

`gap-2` and `items-baseline` sit the glyph on the heading's baseline; `text-gray-400` keeps it a landmark rather than a second piece of emphasis competing with the words. Mark every section or none. The icon names the section's subject, never its genre, which is the difference between a landmark and decoration.

## Kicker label

The small uppercase label above a heading or opening a card. One spelling; vary only the color for tone.

```html
<p
  class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
>
  The exposure ladder
</p>
```

Tones: `text-muted-foreground` neutral, `text-brand-700` emphasis, `text-error-700`/`text-warning-700`/`text-success-700` status.

## Status pills

Theme tokens only, one shape. Coin the label vocabulary per page (shipped/inference/broken, adopt/skip, tier A/B); keep the spelling.

```html
<span
  class="rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-semibold text-success-700"
  >shipped</span
>
<span
  class="rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-semibold text-warning-700"
  >inference</span
>
<span
  class="rounded-full bg-error-100 px-2.5 py-0.5 text-xs font-semibold text-error-700"
  >broken</span
>
<span
  class="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700"
  >recommended</span
>
<span
  class="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
  >cut</span
>
```

On a dark banner: `bg-amber-400/20 text-amber-300` is the established flag-pill look; keep it for dark surfaces only.

## Step circle and numbered rail

```html
<li class="flex gap-3">
  <span
    class="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-900 font-mono text-xs text-white"
    >1</span
  >
  <span class="text-sm leading-6"
    >The step, stated as what happens, not as a heading.</span
  >
</li>
```

Swap `bg-gray-900` for `bg-brand-600`/`bg-error-500`/`bg-success-700` when the step itself carries status.

## Icon-led list

For a list of short nouns or one-clause claims the reader scans rather than reads. One Phosphor regular icon per row, as a landmark, never two and never an emoji. Brand tone for the focal list, gray for a supporting one.

```html
<ul class="space-y-2 text-sm">
  <li class="flex items-center gap-2.5">
    <i class="ph ph-folder-open text-lg text-brand-700"></i>The workspace folder
  </li>
</ul>
```

When the row is a bold label and a clause, align the icon to the first line: `items-start` on the row, `mt-1` on the icon.

```html
<li class="flex items-start gap-3 text-sm leading-6">
  <i class="ph ph-hand-palm mt-1 text-lg text-brand-700"></i
  ><span><strong>Restraint.</strong> No walls of text.</span>
</li>
```

## Icon chips

A field of labeled things to scan in any order: what a system captures, what a page covers, the inputs to a decision. Each chip is one icon and two to four words; the icon's tone marks the group, so a page can carry two or three fields without a heading between every row.

```html
<div class="flex flex-wrap gap-2">
  <span
    class="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
    ><i class="ph ph-browser text-base text-brand-700"></i>Pages viewed</span
  >
</div>
```

## Paired columns

Two positions on one subject, one card per subject, for a disagreement or a before-and-after. The kicker names the subject; the sides are labeled inline so each half reads as a sentence, and the second side takes the brand tone when it is the author's.

```html
<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
  <p
    class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
  >
    Projects
  </p>
  <div class="mt-2 grid gap-4 text-sm leading-6 sm:grid-cols-2">
    <p>
      <span class="font-semibold">Neil</span> · durable bodies of work. Keep
      them.
    </p>
    <p>
      <span class="font-semibold text-brand-700">Me</span> · groups of reachable
      things. Nearly the same.
    </p>
  </div>
</div>
```

## Bare numbered list

For claims the reader will say out loud: tenets, rules, a plan's steps. The step circle and the sentence are the whole row. A gray explainer after each line reads as a hedge and doubles the scan cost; put the detail in a section below and link the number to it.

```html
<li class="flex gap-3">
  <span
    class="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-900 font-mono text-xs text-white"
    >1</span
  ><span class="text-[15px] leading-7 font-medium"
    >One agent, and you never take turns with it.</span
  >
</li>
```

## Emphasis cards

Three levels on top of the base card (`rounded-xl border border-border bg-card p-5 shadow-sm`):

```html
<!-- verdict: the card IS the finding -->
<div class="rounded-xl border-2 border-success-300 bg-card p-5 shadow-sm">
  …
</div>
<!-- callout: a remark attached to surrounding flow -->
<div class="rounded-xl border-l-4 border-warning-500 bg-card p-5 shadow-sm">
  …
</div>
<!-- tinted panel: a region with a tone, e.g. the failing side of a comparison -->
<div class="rounded-xl border border-error-300 bg-error-50 p-5">…</div>
```

Most sections need no card at all: SKILL.md's volume rule outranks every spelling here.

## Terminal block

One dialect. Dark ground `bg-gray-950`, light text, gray prompt, status colors from the theme's 300 range (they read on dark).

```html
<div
  class="overflow-x-auto rounded-lg bg-gray-950 p-4 font-mono text-xs leading-6 text-gray-100"
>
  <pre><span class="text-gray-500">$</span> agent-reference status
wire-format  <span class="text-warning-300">folder</span> · ready
<span class="text-success-300">&#10003; 6 references resolved</span></pre>
</div>
```

## Code excerpt

Terminal output is a bare `<pre>` with hand-placed spans (above). Real code is `<pre><code class="language-x">` on the same dark surface; nothing highlights it for you, so keep the spans few and structural rather than trying to color a whole language:

```html
<pre
  class="overflow-x-auto rounded-lg bg-gray-950 p-4 text-xs leading-6 text-gray-100"
><code class="language-ts">const spy = new IntersectionObserver(onSee, { rootMargin: "-15% 0px -75% 0px" });</code></pre>
```

Name the language even though nothing reads it: it tells the next person what they are looking at.

## A block wider than the column

The starter's `<main>` is a reading column, which is right for prose and wrong for a matrix. Widen the block, not the column: raise `main`'s own `max-w-3xl` where a template is a wide one by nature, or give the single block that needs the room its own width and let the prose keep its measure.

```html
<!-- The everyday case: a table wider than the page, in a scroll container. -->
<div
  class="overflow-x-auto overflow-y-hidden rounded-xl border border-border bg-card shadow-sm print:overflow-visible xl:overflow-visible"
>
  <table class="min-w-[63rem] text-xs leading-5">
    …
  </table>
</div>
```

Three things earn their place in that one element. `xl:overflow-visible` drops the scroller once the viewport is wide enough to hold the table outright, so a large screen gets the whole thing at once. `print:overflow-visible` does the same on paper, because the container that saves the block on screen is exactly what clips it in a print, and a template whose content is wider than a portrait sheet should also set `@page { size: landscape }` in its own style block.

The third is a trap worth knowing: `overflow-x-auto` alone computes `overflow-y` to `auto` as well. A horizontal scrollbar then steals its own height from the content box, which leaves the block scrollable downward by exactly that much, and a reader scrolling past it spends the gesture there and thinks the page is stuck. It only bites with a mouse attached, because overlay scrollbars take no space, which is why it survives every check made on a trackpad. Always pair the two classes.

Use this for the handful of blocks that need it, never as the default wrapper: a page where everything is wide has no column left to break out of.

## Quoting someone

The distillation is the line, the quote is the support under it. Never the other way round, and never the quote alone.

```html
<figure class="mt-4 border-l-2 border-border pl-4">
  <p class="text-sm leading-6">
    <strong>Horizontal scrollers eat the wheel.</strong> Scrolling past one
    stops the page.
  </p>
  <blockquote class="mt-1 text-xs leading-5 text-muted-foreground">
    &ldquo;my mouse wheel gets trapped on the horizontal rows&rdquo; &middot;
    Sep 2
  </blockquote>
</figure>
```

Clip the quote to the fragment that carries the point and mark the clip with an ellipsis; a paragraph of someone's own words pasted whole is the least-read element on the page, however well it argues. Where many of these stack, they are a table, and the distillation is the first column.

## Decision ending

One card per open decision. The handle is plain words naming the subject; the chip carries the recommendation.

```html
<div class="rounded-xl border border-border bg-card p-5 shadow-sm">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold">1 · Fallback location</p>
      <p class="mt-1 text-sm leading-6 text-muted-foreground">
        What the decision is and what stays true if it is never made.
      </p>
    </div>
    <span
      class="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold whitespace-nowrap text-brand-700"
      >&#128073; the recommendation</span
    >
  </div>
</div>
```

## Evidence footer

Close pages whose claims rest on gathered evidence with provenance: what was read, how counts were made, what is verbatim versus inferred.

```html
<footer
  class="mt-14 max-w-3xl border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Evidence.</strong> All 74 artifacts read in
  full; counts from corpus-wide greps run today; quotes verbatim from session
  logs.
</footer>
```

Illustrative or invented content is disclosed twice: a warning-toned kicker up top and a sentence here.

## Coach marks

Commentary about a depicted thing (a slide, a UI, a transcript) sits outside the depicted surface in a visibly different voice, so content and annotation never blur:

```html
<div class="relative">
  <div class="rounded-lg border border-border bg-card p-4">
    <!-- the depicted thing -->
  </div>
  <p class="mt-2 flex items-start gap-1.5 text-xs leading-5 text-warning-700">
    <i class="ph ph-hand-pointing mt-0.5"></i>
    <span>Annotation about the thing above, never inside it.</span>
  </p>
</div>
```
