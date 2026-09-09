---
name: timeline
description: A timeline as one HTML page: dated entries on a spine with eras, turning points, and a now marker, or a changelog or a plan by week. Use when order in time explains a history, a set of versions, or what happens when.
---

# Timeline

One self-contained HTML page that shows change over time, for the cases where chronology is the explanation: how a law, a product, or a market got to where it is; which versions existed when; what happens in which week of a plan. It reads like the history timeline pages and roadmaps people already know from the web: a spine of dated entries, eras that group them, the few moments after which things were different, and a marker for where we are now. It is not a list of facts sorted by date, and it is not a status report; every entry says what followed from it.

## When to reach for it

Reach for it when the user asks for a history, a timeline, a changelog, a roadmap, or a plan with dates: how EU privacy law evolved, how our pricing changed, what happens when in a hiring process, which releases shipped what. "How did we get here", "walk me through the history", "what changed when", "what happens when", and "show me the plan by week" are the phrases. Reach for it unprompted when research you have already done only makes sense in order, because the reader needs to see that one event caused the next; a paragraph of dates in the conversation is the weaker answer.

Do not reach for it when the order does not matter (a comparison, a recommendation), when there are two events rather than a sequence, when the user wants a status update on one moment rather than a span, or when the answer is a single date.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who reads this and what they will do next, the span and the one thing the reader must see about it, and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per slot the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the slots with the research. Sections may be reordered, merged, or renamed, but each intent below must be answered somewhere on the page, and the scope and the first era must be visible without scrolling.
5. Check it against the refusals below, open it, and look at it once at a laptop width. Fix what you see, then stop.

Write the page for the reader's next action. A history ends in what holds today; a plan ends in what happens next and who does it; a changelog ends in the current state, so the reader can act from the last entry.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **Scope.** The span with its first and last date, whose story this is, and why it matters now, as three facts the reader can check before the first entry.
- **The events, dated.** Every entry carries a date at the precision the source gives (a day, a month, a year), a name, and one line on what it changed for the reader. Oldest first unless the page is a changelog read from the latest. Group into era bands when the span has chapters, and name each era for what was true during it.
- **Turning points.** The two to four entries after which things were different, called out so they are seen before the rest is read. Usually on the spine itself; a separate list only when the spine is a table or a grid.
- **Where we are now.** A marker on the spine for the present, then what holds today and what is already scheduled, with scheduled dates labeled as scheduled and drawn differently from dates that have passed.
- **Sources.** What was read, which dates come from a published text and which from memory or inference, and when the page was written, since "now" moves.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer.

Free, and expected to differ between two pages made a day apart: the direction of time (a vertical spine, a horizontal span chart, weeks as columns, a table read down), whether eras are bands, chips, or column groups, the device that carries a turning point (a toned card on the spine, a marked row, a flagged cell), what the now marker looks like, the density, the type (sans for a history, serif for a plan), and any interaction, which must be progressive so the page reads with scripts off.

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: spine entries, era bands, turning-point callouts, now markers, an inline SVG span chart, changelog rows. It is vocabulary, not a layout.

The look is one light theme, on purpose. A page may choose a toned surface within the palette for one element, and that choice renders the same everywhere; it never switches with the reader's system theme.

## Refusals

A page that could be any of the examples with the words swapped. Entries with no consequence, so the page is a list of dates. Every entry a turning point, or none. A now marker missing from a page whose span reaches the present. Scheduled dates drawn the same as dates that have passed. Eras named by their years alone. A span chart with no scale, or one that is an image rather than inline SVG. Invented precision: a day when the source gave a month, a figure the research did not carry. Every entry a bordered card. A thing that lives at a URL named in plain text, or a link whose text describes the destination rather than naming the thing. Any `<link>` or `<script>` beyond the ones the starter carries, and any image whose `src` is a URL or a relative path rather than inline data: the file has to open from a USB stick, which a hyperlink does nothing to prevent. A file over about 1.5 MB.

## Honesty about research

Say on the page which dates come from a published text, which are scheduled and could move, and which are the author's reconstruction. Date the page itself, because the now marker is only right on the day it was written. When a proposal could change a date already on the spine, the entry says so rather than picking an outcome. A thin honest timeline with its gaps named is useful; a confident invented one is worse than nothing, because a reader will plan around it.
