# Patterns: the vocabulary the examples use

Canonical spellings for the pieces a how-to guide keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  Before you start
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">
  What to have ready
</h2>
```

Tones for the kicker: `text-brand-700` for the focal one, `text-muted-foreground` for supporting sections, `text-warning-700` for pitfalls and stop conditions.

## Goal row

The goal as a row of facts the eye lands on first: time, cost, difficulty, and what done looks like. Sits under the title, before anything else.

```html
<dl class="flex flex-wrap gap-x-8 gap-y-3 border-y border-border py-4 text-sm">
  <div>
    <dt
      class="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase"
    >
      Time
    </dt>
    <dd class="mt-0.5 font-semibold">About 90 minutes</dd>
  </div>
  <div>
    <dt
      class="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase"
    >
      Cost
    </dt>
    <dd class="mt-0.5 font-semibold">$0 with the gear you have</dd>
  </div>
  <div>
    <dt
      class="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase"
    >
      Difficulty
    </dt>
    <dd class="mt-0.5 font-semibold">Intermediate</dd>
  </div>
</dl>
```

## Time chip

One per step, in the step's heading row. The time is the procedure's, never a guess dressed as a figure; a range is fine.

```html
<span
  class="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
  ><i class="ph ph-clock"></i>10 min</span
>
```

A difficulty chip uses the same spelling with `ph-gauge` and a word: easy, moderate, hard.

## Prerequisites list

Tools, materials, access, and facts, grouped so the reader gathers them in one trip. One Phosphor regular icon per row as a landmark, never two, never an emoji.

```html
<div class="grid gap-6 sm:grid-cols-2">
  <div>
    <p
      class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
    >
      Tools
    </p>
    <ul class="mt-2 space-y-1.5 text-sm leading-6">
      <li class="flex items-start gap-2.5">
        <i class="ph ph-wrench mt-1 text-lg text-brand-700"></i
        ><span
          ><strong>Basin wrench.</strong> The one tool the job cannot be done
          without.</span
        >
      </li>
    </ul>
  </div>
</div>
```

## Step card

One per step. The number is the landmark, the action line is what the reader looks for after looking away, the paragraph is for the first read. The time chip sits on the heading row.

```html
<li class="rounded-xl border border-border bg-card p-5 shadow-sm">
  <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
    <span
      class="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground font-mono text-sm text-background"
      >3</span
    >
    <h3 class="text-base font-semibold">Free the old faucet from underneath</h3>
    <span
      class="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
      ><i class="ph ph-clock"></i>20 to 40 min</span
    >
  </div>
  <p class="mt-3 text-sm leading-6">
    The paragraph: what to do, in the order the hands do it.
  </p>
</li>
```

## Step rail

For a wide screen: the numbers in a gutter to the left of the steps, joined by a line, so the reader can count where they are. The card body is the step card without its own number.

```html
<ol
  class="relative space-y-6 lg:before:absolute lg:before:top-2 lg:before:bottom-2 lg:before:left-[1.1rem] lg:before:w-px lg:before:bg-border"
>
  <li class="lg:grid lg:grid-cols-[3.5rem_minmax(0,1fr)] lg:gap-4">
    <span
      class="relative z-10 flex size-9 items-center justify-center rounded-full bg-foreground font-mono text-sm text-background"
      >1</span
    >
    <div
      class="mt-3 rounded-xl border border-border bg-card p-5 shadow-sm lg:mt-0"
    >
      …
    </div>
  </li>
</ol>
```

## Timeline row

For a playbook run against a clock: a monospace time in the left column and the script in the right. The time is when the segment starts; the chip says how long it runs.

```html
<li
  class="grid gap-2 border-t border-border py-5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-6"
>
  <p class="font-mono text-sm text-brand-700 sm:pt-0.5">0:10</p>
  <div>
    <h3 class="text-base font-semibold">Read and cluster</h3>
    <p class="mt-2 text-sm leading-6">What the facilitator does.</p>
  </div>
</li>
```

## Inline pitfall callout

A warning attached to the step where the mistake happens, warning-toned, inside the step's card. Never a red error, and never collected at the end.

```html
<div class="mt-4 rounded-lg border-l-4 border-warning-500 bg-warning-50 p-4">
  <p
    class="flex items-center gap-1.5 text-xs font-medium tracking-[0.12em] text-warning-700 uppercase"
  >
    <i class="ph ph-warning text-base"></i>Where people get locked out
  </p>
  <p class="mt-1.5 text-sm leading-6 text-warning-900">
    Specific, checkable, and what to do instead.
  </p>
</div>
```

## Stop callout

The condition under which the reader should not continue and who to call instead. Sits before the first step, error-toned because it is the one place red is earned.

```html
<div class="rounded-xl border border-error-300 bg-error-50 p-5">
  <p
    class="flex items-center gap-1.5 text-xs font-medium tracking-[0.12em] text-error-700 uppercase"
  >
    <i class="ph ph-hand-palm text-base"></i>Stop and call a plumber if
  </p>
  <ul class="mt-2 space-y-1 text-sm leading-6 text-error-900">
    <li>A shutoff valve will not turn, or drips from its stem once closed.</li>
  </ul>
</div>
```

## Code block

Console commands, settings values, and scripts the reader can paste or copy field by field. The code well, monospace, no line numbers. A comment on the right explains, a highlighted token names what to change.

```html
<pre
  class="mt-3 overflow-x-auto rounded-lg bg-code p-4 font-mono text-[13px] leading-6 text-code-foreground"
><code>VLAN ID        <span class="text-code-accent">20</span>
Gateway        192.168.20.1/24   <span class="text-code-muted"># pick a subnet you do not use</span></code></pre>
```

Prose, menu paths in a sentence, and anything the reader cannot paste stay out of code blocks.

## Say block

For a playbook: the words the reader says out loud, as a quotation so the eye separates the script from the stage directions.

```html
<blockquote
  class="mt-3 border-l-2 border-brand-500 pl-4 text-sm leading-6 text-gray-700 italic"
>
  "Seven minutes, silent, one idea per note."
</blockquote>
```

## Done checklist

Observable results as real checkboxes, so the reader can tick them. Each names a result, never a step. A tally line is optional and progressive: the boxes tick with scripts off.

```html
<ul class="space-y-2">
  <li>
    <label
      class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3"
    >
      <input type="checkbox" class="mt-1 size-4 shrink-0 accent-brand-600" />
      <span class="text-sm leading-6"
        >A phone on the new Wi-Fi gets a 192.168.20.x address.</span
      >
    </label>
  </li>
</ul>
```

## Source footer

Closes every page. What was read, what version or model the steps assume, whether the procedure was run, what is inferred.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Sources.</strong> The maker's help center on
  the two features used and two long forum threads. Written against Network app
  8.x; menus move between versions. Not run on the reader's hardware.
</footer>
```

## Emphasis, sparingly

The step cards are the focal layer, not every section. Prerequisites, variations, and sources sit directly on the page background with tighter type and no chrome. Warning tone is spent on pitfalls, error tone on the stop condition, and brand tone on the numbers, the checkboxes, and one kicker.
