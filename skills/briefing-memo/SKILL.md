---
name: briefing-memo
description: A briefing memo as one HTML page, with the bottom line up front, context, key facts, two or three options with cost and risk, a recommendation, and open questions. Use when someone must decide and wants a brief first.
---

# Briefing memo

One self-contained HTML page that puts a decision in front of the person who has to make it: the bottom line first, then the situation, the facts that matter, two or three options with what each costs, risks, and forecloses, a recommendation with a first step, and the questions still open. It reads like a good internal strategy note or a policy brief, written to be acted on rather than admired. It is not a report of everything known, and it is not a recommendation guide with picks; it frames one decision and takes a position on it.

## When to reach for it

Reach for it when the user asks to be briefed, asks for a memo, or asks what to do about a situation with real stakes: whether to move a warehouse, how to answer a competitor's price cut, whether to run a pilot. "Brief me on", "write up the options", "what should we do about", and "I need to decide by Friday" are the phrases. Reach for it unprompted when research you have already done has surfaced a choice with two or three real paths and a deadline; a paragraph of pros and cons in the conversation is the weaker answer.

Do not reach for it when the user is choosing a product or vendor from a field of options (that is the recommendation guide), when the answer is one sentence, when there is no decision maker and nothing to decide, or when the material is a status update.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who decides and by when, the bottom line in one sentence, and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per slot the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the slots with the research. Sections may be reordered, merged, or renamed, but each intent below must be answered somewhere on the page, and the bottom line must be visible without scrolling.
5. Check it against the refusals below, open it, and look at it once at a laptop width. Fix what you see, then stop.

Write the page for the decision, not for the research. The bottom line names the recommended option and the date a decision is needed by, so the reader can act from the first screen.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **Bottom line up front.** The recommendation, the one reason, and the date by which the decision is needed, in a form the eye lands on first.
- **Context.** What changed, why it is on the desk now, and what happens if nothing is decided.
- **Key facts.** The numbers and constraints the options are judged against, as a tight list. Each is specific enough to be checked, and dated when it will move.
- **Options.** Two or three, never one and rarely four, in parallel: the same fields for each (what it is, cost, risk, what it forecloses), so they can be compared line for line. The recommended one is marked, not hidden.
- **Recommendation.** Which option, why that one over the others, and the first steps with an owner and a date each.
- **Open questions.** Numbered, each with what would answer it and who owns finding out. Not everything unknown; the ones whose answer could change the recommendation.
- **Annex or sources.** What was read, what was measured, what is estimated, and when the figures were seen.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer.

Free, and expected to differ between two memos made a day apart: the layout and column count, whether the memo header is a ruled block or one line, the device that carries the bottom line (a boxed paragraph, a toned strip across the top, a sidebar card), whether the options are cards, a table, or a run of short sections, the density, and the register, from paper-calm to urgent. Any interaction must be progressive so the page reads with scripts off.

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: memo header blocks, bottom line boxes, numbered section headings, option columns, recommendation strips, open question lists. It is vocabulary, not a layout.

The look is one light theme, on purpose. A page may choose a toned surface within the palette for one element, and that choice renders the same everywhere; it never switches with the reader's system theme.

## Refusals

A page that could be any of the examples with the words swapped. A bottom line that hedges, or that names no option and no date. One option, or four. Options whose fields differ so they cannot be compared. Key facts that are adjectives rather than numbers. A recommendation with no first step and no owner. Open questions that are rhetorical. Every section a bordered card. A thing that lives at a URL named in plain text, or a link whose text describes the destination rather than naming the thing. Any `<link>` or `<script>` beyond the ones the starter carries, and any image whose `src` is a URL or a relative path rather than inline data: the file has to open from a USB stick, which a hyperlink does nothing to prevent. A file over about 1.5 MB.

## Honesty about research

Say on the page what was read and measured and what was estimated. Date every figure that will move: prices, rents, rates, pipeline. When a number is a range because the research is thin, show the range rather than the midpoint. A thin honest memo with its open questions named is useful; a confident invented one is worse than nothing, because someone will decide on it.
