---
name: should-i
description: A decision explainer as one HTML page, with a plain yes, no, or it depends, what it turns on, guidance by situation, risks, and the next step. Use when the user asks should I, is it worth it, or do I need.
---

# Should I…?

One self-contained HTML page that answers a yes-or-no question the way a good advice column does: the short answer first and said plainly, then what it turns on, then what to do. It reads like the "should you refinance right now" pieces on personal finance sites: it takes the question seriously, narrows it to the reader's case, and ends with a step rather than a shrug. It is not a comparison of options, and it is not a list of considerations that leaves the deciding to the reader.

## When to reach for it

Reach for it when the user asks a question with a yes, a no, or an it-depends at the end: should I refinance, is it worth upgrading, do I need an LLC, should we switch tools. Reach for it unprompted when research you have already done ends in an answer to a question shaped like that; the answer in the chat is the weaker form, because the reader cannot check their own case against it.

Do not reach for it when the question is which of several options to pick (that is a recommendation guide), when the answer is one sentence the reader will not act on, or when the honest answer is that a different question should be asked; say that in the conversation instead.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who reads this and what they will do next, the short answer and the tone it earns, and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per intent the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the sections with the research. They may be reordered, merged, or renamed, but each intent below must be answered somewhere on the page, and the short answer must be visible without scrolling.
5. Check it against the refusals below, open it, and look at it once at a laptop width. Fix what you see, then stop.

Write the page for the reader's next action. The short answer is one of three phrases; the sentence under it names the condition that would flip it.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **The question.** Restated in the reader's own terms, with the constraints they gave and the ones the answer had to assume. Often the header carries it.
- **Short answer.** Yes, no, or it depends, in a badge the eye lands on first, in the tone the answer earns: success for yes, error for no, warning for it depends. One sentence under it says why, and one names what would flip it.
- **What it depends on.** Three to five factors, each stated so the reader can check their own case against it: a threshold, a date, a count, never "your circumstances".
- **By situation.** The recommendation for each case the factors split into, in the form "if you are… then…". Each carries its own short answer, and they may disagree with the headline; that is the point of the section.
- **Risks.** What goes wrong when the reader takes the answer and their case differs, and what cannot be undone.
- **Next step.** The one concrete thing to do this week, what it costs in time or money, and, when the answer was not yet, what would reopen the question.
- **Questions people ask.** Three to five, answered in a sentence or two each, including the one the reader is quietly hoping for.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette, with brand green and the one tone the short answer earns as the only saturated colors, the spacing scale, a single self-contained file, and a provenance footer.

Free, and expected to differ between two pages made a day apart: the layout and column count, the section order, the form the badge takes (a block, a pill, a stamp, the word set large), the density, the register (a compact memo or a long read), the components, and any interaction, which must be progressive so the page reads with scripts off.

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: the short-answer badge, the factor checklist, the persona card, the next-step box, the FAQ item. It is vocabulary, not a layout.

The look is one light theme, on purpose. A page may choose a darker surface within the palette, and that choice renders the same everywhere; it never switches with the reader's system theme, because a page that has to look right in two themes is a page that looks wrong in one of them.

## Refusals

A page that could be any of the examples with the words swapped. A short answer that hedges inside the badge ("probably", "mostly yes"); the hedge lives in the sentence under it. "It depends" with no factors a reader can check, or with more than five. Personas that all reach the same answer. A next step that amounts to "do more research". Risks that are the factors restated. A FAQ padded with questions nobody asks. A thing that lives at a URL named in plain text, or a link whose text describes the destination rather than naming the thing. Any `<link>` or `<script>` that fetches from the network beyond the ones the starter carries, and any image whose `src` is a URL or a relative path rather than inline data: the file has to open from a USB stick, which a hyperlink does nothing to prevent. A file over about 1.5 MB. A small inline script is fine where the page reads without it, and a refusal where the page does not.

## Honesty about research

Say on the page what the numbers rest on: which figures were computed, from what inputs, and which were assumed because the reader did not say. Label prices, rates, and rules with when they were seen; a rate quote is stale in a week and a tax credit in a year. When the research is thin, the page says so in the footer rather than performing certainty; a thin honest answer is useful, a confident invented one is worse than nothing.
