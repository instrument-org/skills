# Patterns: the vocabulary the examples use

Canonical spellings for the pieces an FAQ keeps reaching for. Each is a starting point to restyle, never a required structure; the examples combine them differently on purpose.

## Kicker and heading

```html
<p class="text-xs font-medium tracking-[0.12em] text-brand-700 uppercase">
  Health
</p>
<h2 class="mt-2 text-xl font-semibold tracking-[-0.02em]">
  Coverage, plans, and what you pay
</h2>
```

Tones for the kicker: `text-brand-700` for the group the reader is most likely here for, `text-muted-foreground` for the rest. A group heading may be the kicker alone when the group's name says enough.

## Jump list

The groups, in order, each an anchor to its heading. A row on a narrow screen; on a wide one it may become a column that stays put beside the questions. `scroll-mt-8` on every target keeps a heading clear of the top edge when a link lands on it.

```html
<nav aria-label="On this page" class="lg:sticky lg:top-8 lg:self-start">
  <p
    class="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase"
  >
    On this page
  </p>
  <ol
    class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm lg:flex-col lg:gap-y-2"
  >
    <li>
      <a href="#health" class="text-muted-foreground hover:text-foreground"
        >Health</a
      >
    </li>
    <li>
      <a href="#retirement" class="text-muted-foreground hover:text-foreground"
        >401(k)</a
      >
    </li>
  </ol>
</nav>
```

A compact page sets the same links as pills: `rounded-full border border-border bg-card px-3 py-1 text-xs font-medium`. A customer-facing page sets them as a row between hairlines under the header.

## Question heading with anchor

The question in the reader's own words, with an id so it can be linked and a link icon that appears on hover. The heading level follows the group heading's.

```html
<div id="q-coverage-start" class="group scroll-mt-8 py-5">
  <h3 class="flex items-baseline gap-2 text-base font-medium">
    When does my health coverage start?
    <a
      href="#q-coverage-start"
      class="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
      aria-label="Link to this question"
      ><i class="ph ph-link text-sm"></i
    ></a>
  </h3>
  <!-- the answer -->
</div>
```

## Answer-first paragraph

The first sentence is the answer and carries the foreground color; the rest is the condition, the exception, and the next step, in muted type. A reader who stops after one sentence has the answer.

```html
<p class="mt-2 text-sm leading-6 text-muted-foreground">
  <span class="text-foreground"
    >The first of the month after your start date.</span
  >
  Enrollment closes 30 days after you start; miss it and the next chance is open
  enrollment in November.
</p>
```

A card layout adds a "what to do" line under the answer, with one icon as its landmark:

```html
<p class="mt-3 flex items-start gap-2 text-sm leading-6">
  <i class="ph ph-arrow-right mt-1 text-base text-brand-700"></i
  ><span><strong class="font-medium">What to do:</strong> the step.</span>
</p>
```

## Details/summary item

Native `details` and `summary`, so it opens with scripts off. The caret turns with the `open` state through Tailwind's `group-open` variant. An id on the `details` lets a link land on it; the script below opens the targeted one and the page reads the same without it.

```html
<details
  id="q-below-zero"
  class="group scroll-mt-8 border-b border-border py-3"
>
  <summary
    class="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-medium"
  >
    Does a heat pump work below zero?
    <i
      class="ph ph-caret-down mt-0.5 shrink-0 text-base text-muted-foreground transition-transform group-open:rotate-180"
    ></i>
  </summary>
  <p class="mt-2 text-sm leading-6 text-muted-foreground">
    Yes, if it is a cold-climate model. The rest of the answer.
  </p>
</details>
```

```html
<script type="module">
  // A link to a question opens it; with scripts off the reader clicks once more.
  const openTarget = () => {
    const target = document.getElementById(location.hash.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
  };
  openTarget();
  addEventListener("hashchange", openTarget);
</script>
```

## Still-stuck box

Closes the questions. Who to ask, where, what to have ready, and a response time when one is known. One bordered card on the page background; on a page of open answers it is the only card.

```html
<div
  class="rounded-xl border border-border bg-card p-5 shadow-sm sm:flex sm:items-start sm:gap-4"
>
  <i class="ph ph-chat-circle-text shrink-0 text-2xl text-brand-700"></i>
  <div>
    <p class="text-base font-semibold">Still stuck?</p>
    <p class="mt-1 text-sm leading-6 text-muted-foreground">
      Ask in #benefits, where People Ops answers within a business day. Have
      your start date and the plan you are asking about.
    </p>
  </div>
</div>
```

## Per-answer source link

Small links under an answer, to a numbered entry in the footer or to the source itself. Only when the answers come from different places; a page with one source names it once in the footer.

```html
<p class="mt-2 text-xs text-muted-foreground">
  Sources:
  <a
    href="#src-1"
    class="text-brand-700 underline decoration-brand-200 underline-offset-2"
    >NEEP list</a
  >
  ·
  <a
    href="#src-2"
    class="text-brand-700 underline decoration-brand-200 underline-offset-2"
    >Maine field study</a
  >
</p>
```

## Source footer

Closes every page. What was read, when, and where the sources disagree, which one the page followed.

```html
<footer
  class="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"
>
  <strong class="text-foreground">Sources.</strong> The benefits guide, the plan
  summaries, and the handbook's leave policy, read this month. Where they
  differ, the plan documents win over this page; ask us to fix the page.
</footer>
```

A page with per-answer source links numbers them here: an `<ol>` with an id on each `<li>` the links target, and a paragraph after it on where the sources disagree.

## Emphasis, sparingly

Answers sit directly on the page background with hairlines between them; the bordered card is for the still-stuck box and, on a card layout, for each question. A tinted band marks the few questions everyone asks, never a whole group.
