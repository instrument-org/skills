---
name: explainer
description: An explainer as one HTML page, with the short version, a definition, how it works in steps or a diagram, why it matters, misconceptions, and further reading. Use when the user asks what something is or how it works.
---

# Explainer

One self-contained HTML page that makes a concept, a system, or a topic understandable. It reads like the "X, explained" article a good news site runs, or the how-it-works piece a maker publishes for customers who want to understand before they buy: a hook that names why the reader is here, the short version in a box, a definition in plain words, the mechanism in numbered steps or a diagram, why it matters to this reader in particular, the things people get wrong, and where to read more. It builds a mental model; it does not make the decision, rank the options, or summarize a document.

## When to reach for it

Reach for it when the user asks what something is, how it works, or why it behaves the way it does: how a heat pump heats, what a 401(k) match is, how container rates are set, what a mesh network does. Reach for it unprompted when a decision or a piece of research is stalling on a concept the reader has not got hold of yet; explaining the mechanism first makes the later page shorter and the reader's questions better.

Do not reach for it when the user wants a verdict (that is a should-I page or a recommendation guide), when the question is which option to pick, when the material is a procedure to follow step by step rather than a mechanism to understand, or when the answer is one sentence. A page that ends in a recommendation is a different page wearing an explainer's kicker.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who reads this and what they will do once they understand, the one sentence they must be able to say back afterward, and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per intent the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the sections. They may be reordered, merged, or renamed, but each intent below must be answered somewhere on the page, and the short version must be visible without scrolling. Write the short version last, from the steps, so it is the mechanism compressed rather than the topic restated.
5. Check it against the refusals below, open it, and look at it once at a laptop width. Fix what you see, then stop.

Write for a reader who is smart and new to this. Every term the page uses gets defined the first time it appears, in the sentence that uses it, not in a glossary the reader has to find; a glossary at the end is a courtesy, not a substitute.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **The hook.** Why the reader is here, in their own situation: the quote in their hand, the line on the form, the word everyone uses and nobody defines. Usually the header carries it. Not a history of the topic.
- **The short version.** The mechanism in three or four sentences, in a box the eye lands on first, written so a reader who stops there still has the model.
- **What it is.** The plain-language definition, one paragraph, with the nearest familiar thing it resembles and the one way it differs from that thing.
- **How it works.** The mechanism as numbered steps, a diagram, or both. Each step is one thing that happens and the reason it happens; a diagram shows the parts and what flows between them, drawn on-theme as inline SVG, never a chart library.
- **Why it matters to you.** The two to four consequences that touch this reader's situation: what to look for, what to ask, what changes now that they understand. Specific to the prompt's reader, not to readers in general.
- **What people get wrong.** Three to five misconceptions as pairs: what you might think, and what is actually the case. Pick the ones this reader is likely to hold, including the one the sales pitch encourages.
- **Further reading.** Three to five places to go deeper, each with a clause on what the reader gets there. Primary sources over summaries.
- **Sources.** What was read, and what on the page is inferred, simplified, or illustrative rather than sourced.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer. Fixed for this shape in particular: the short version sits near the top in a box, the mechanism is numbered or drawn, and misconceptions come in pairs.

Free, and expected to differ between two pages made a day apart: whether a diagram leads or the page is all prose, the measure and the type (an airy sans page with a wide figure, a compact two-column walk-through, a narrow serif long read), how the steps are set (a grid beside the diagram, rows with worked examples, a plain numbered list), whether misconceptions are a two-column grid or pull quotes with the correction under each, the presence of a worked example, a small table, a what-to-do box, or a glossary strip, and any interaction, which must be progressive so the page reads with scripts off.

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: the short-version box, the numbered step, the inline SVG diagram recipe, the misconception pair, the further-reading list, the source footer. It is vocabulary, not a layout.

The look is one light theme, on purpose; a page never switches with the reader's system theme. An explainer carries no photographs: it is text, at most one diagram and one small table, and links, so the file stays small and opens anywhere.

## Refusals

A page that opens with the history of the topic instead of the reader's situation. A short version that restates the title. A definition that uses the term being defined. Steps that are a list of parts rather than a sequence of things happening. A diagram made by a chart library, loaded from a URL, or pasted as a raster image. A diagram with unlabeled boxes or arrows that do not say what flows. Misconceptions with no "in fact" half, or an "in fact" that is a hedge. Why-it-matters written for readers in general rather than the one in the prompt. A number the topic did not supply: a rate, a cost, a percentage invented to sound concrete. A page that ends in a verdict. Further reading with no clause on why to follow each link. A thing that lives at a URL named in plain text, or a link whose text describes the destination rather than naming the thing. Any `<link>` or `<script>` beyond the ones the starter carries, and any image that is not inline data.

## Honesty about research

Say on the page what was actually read and what was simplified. A mechanism explained plainly is a mechanism with detail left out; say which detail, in the footer or beside the step, so a reader who needs the exception knows to look for it. Numbers appear only when the topic itself supplies them, such as a schedule the law fixes or a formula the reader's own document states, and the page labels them as the rule, the example, or the reader's own figure. When the research is thin, the page says so rather than performing certainty; a clear model with an honest edge is worth more than a confident one with a wrong step.
