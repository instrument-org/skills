---
name: faq
description: An FAQ as one HTML page, the questions people really ask about a topic, grouped, each answered in its own block, with a still-stuck next step. Use when the user wants questions and answers, a help page, or an FAQ.
---

# FAQ

One self-contained HTML page that answers the questions people actually ask about a topic, each in a block the reader can skim to, search for, or send on its own. It reads like the FAQ page on a product site or the hub of a help center: a line on who asks, a jump list of groups, question headings that read as the question, answers that begin with the answer, and a way out when the page did not have it. It is not an explainer that builds an argument top to bottom, and it is not a list of features phrased as questions.

## When to reach for it

Reach for it when the same questions keep arriving about one topic and the reader wants them answered once, findably: a benefits page for new hires, a customer FAQ for a change in pricing or policy, the questions a homeowner brings to a contractor. Reach for it unprompted when a conversation has produced a run of question-shaped answers about one subject; a page a reader can search beats a transcript they have to reread.

Do not reach for it when the reader has one question (answer it), when the material is a decision with a verdict to defend (that is a should-I or a recommendation guide), or when the answers depend on each other so much that they have to be read in order (that is an explainer or a how-to).

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who reads this and what they are trying to get done, the three questions they most need answered, and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per intent the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the sections with the research. Groups may be reordered, merged, or renamed, but each intent below must be answered somewhere on the page, and the jump list must be visible without scrolling.
5. Check it against the refusals below, open it, and look at it once at a laptop width. Fix what you see, then stop.

Write each answer for the reader who arrived at it from a search and will read nothing else. The first sentence is the answer; the rest is the condition, the exception, and the next step.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **Who asks.** The topic in a sentence and the reader who brings these questions, so the answers can assume what that reader already knows and skip what they do not need.
- **Jump list.** The groups, in order, each a link to its heading. On a wide screen it may sit beside the questions and stay put; on a narrow one it is a row at the top.
- **Questions and answers.** Grouped under three to six headings. Every question is a heading in the words a reader would type, with an id so it can be linked; every answer begins with the answer, then the condition or exception, then what to do. Open blocks when the reader will read several; a details/summary accordion when the list is long and they will open one.
- **Still stuck.** The next step when the page did not have it: who to ask, where to go, what to have ready. Named people or channels, and a response time when one is known.
- **Sources.** What the answers rest on and when it was read; where sources disagree, which one the page followed and why. Per-answer source links when the answers come from different places.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer.

Free, and expected to differ between two pages made a day apart: the layout and column count, whether the jump list is a sticky column or a row, whether answers are open or disclosed, the grouping and its order, the density, the register (a calm internal page, a compact reference, a customer-facing notice), the components, and any interaction, which must be progressive so the page reads with scripts off.

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: the jump list, the question heading with its anchor, the answer-first paragraph, the details/summary item, the still-stuck box, the per-answer source link. It is vocabulary, not a layout.

The look is one light theme, on purpose. A page may choose a darker surface within the palette, and that choice renders the same everywhere; it never switches with the reader's system theme, because a page that has to look right in two themes is a page that looks wrong in one of them.

## Refusals

A page that could be any of the examples with the words swapped. Questions nobody asks, written to introduce a feature. An answer that opens with background instead of the answer. An answer that says "it depends" and stops. Groups of one. A jump list that does not match the headings. A still-stuck section that says "contact support" and names no one. Two answers on the same page that contradict each other. Numbers the topic did not supply. A thing that lives at a URL named in plain text, or a link whose text describes the destination rather than naming the thing. Any `<link>` or `<script>` beyond the ones the starter carries, and any image whose `src` is a URL or a relative path rather than inline data: the file has to open from a USB stick, which a hyperlink does nothing to prevent. A file over about 1.5 MB.

## Honesty about research

Say on the page what the answers rest on and when it was read: a policy document, a plan summary, a maker's spec page, a field study. When two sources answer differently, say so under the answer and say which one the page followed. When an answer assumes something about the reader's situation, say what it assumed. When the research is thin, the page says so in the footer rather than performing certainty; a thin honest FAQ is useful, a confident invented one is worse than nothing.
