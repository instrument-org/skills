---
name: tldr-brief
description: A TLDR brief as one HTML page, with a headline verdict, five to seven bullets with bold lead-ins, do and do not, one chart or table, and links deeper. Use when a busy reader wants only the takeaways.
---

# TLDR brief

One self-contained HTML page that compresses research into what a busy reader needs on one screen. It reads like the smart-brevity item a good newsletter sends, or the TLDR box at the top of a long report: a headline that is the verdict, a handful of bullets that each carry one fact and why it matters, what to do and what not to do, one figure at most, and links for the reader who wants more. It is not a summary of everything that was read; it is the part that changes what the reader does.

## When to reach for it

Reach for it after deep research when the reader asked for the short version, when the person who will act on the research is not the person who asked for it, or when a long page already exists and needs a top. Reach for it unprompted when a conversation has produced more findings than anyone will reread; a page of bullets with lead-ins beats a scroll of chat.

Do not reach for it when the reader wants the reasoning shown, when the material is a choice among options with a pick to defend, or when the takeaway is one sentence and needs no page. A brief that runs past one screen at laptop width has stopped being a brief; write a briefing memo instead.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who reads this and what they will do next, the one sentence they must leave with, and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per slot the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the slots. Write the headline last, from the bullets, so it is the verdict they add up to rather than the topic. Cut until the page fits one screen at laptop width, or comes close: the reader will not scroll to find the point.
5. Check it against the refusals below, open it, and look at it once at a laptop width. Fix what you see, then stop.

Write for a reader with ninety seconds. Every bullet is one fact and one consequence; a bullet with two facts is two bullets, and a bullet with no consequence is a footnote.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **Headline verdict.** The conclusion, as the title, in a sentence that can be repeated in a meeting. Not the topic; the answer.
- **Bullets.** Five to seven, each with a bold lead-in that names its job (Why it matters, The catch, By the numbers, What's next), one fact, and the consequence for this reader. Order by what changes their decision most.
- **Do and do not.** A pair of short lists, side by side: the actions to take and the mistakes the research says people make.
- **Chart or table.** One at most, small, and only when a picture or a grid says something the bullets cannot: a trend, a set of dates, a cost under three designs. A page may have none.
- **Go deeper.** Three to five links, each with a clause on what it is good for, for the reader who wants the long version.
- **Sources.** What was read, when, and what on the page is inferred rather than sourced.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer. Fixed for this shape in particular: the headline is the verdict, every bullet has a lead-in, and the whole page aims at one screen.

Free, and expected to differ between two pages made a day apart: the column count, the register (a newsletter item, an executive one-pager, a newspaper front), the device that carries the bullets (a list, a grid of small cards, short paragraphs with run-in heads), whether the figure is a chart or a table or absent, where the do and do not pair sits (the bottom, a sidebar, beside the headline), the density, and the type (sans or serif headline).

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: lead-in bullets, do and do not columns, a tiny inline SVG bar chart, the go-deeper list, the source footer. It is vocabulary, not a layout.

The look is one light theme, on purpose; a page never switches with the reader's system theme. A brief carries no photographs: it is text, one figure, and links, and the figure is inline SVG or a table so the file stays small and opens anywhere.

## Refusals

A headline that names the topic rather than the verdict. Bullets without lead-ins, or lead-ins that are all the same word. More than seven bullets, or a bullet that hides two facts. A do list with no do not list, or the reverse. Two charts. A chart that repeats a bullet. A page that needs two screens at laptop width when a cut would fit it in one. Links with no clause on why to follow them. Sources that are not sources. A thing that lives at a URL named in plain text, or a link whose text describes the destination rather than naming the thing. Any `<link>` or `<script>` beyond the ones the starter carries, and any image that is not inline data.

## Honesty about research

Say on the page what was actually read and what was not. Label figures with when they were seen and whether they are measured, reported, or estimated. A brief compresses, and compression is where claims get sharper than the evidence; when a bullet's fact is less certain than its wording, soften the wording, not the layout. When the research is thin, the page says so in the footer rather than performing certainty.
