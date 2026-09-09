---
name: case-study
description: A case study as one HTML page, with the situation, the challenge, the approach in order, results with caveats, lessons, and how to apply it. Use when the user wants to see how something like their situation played out.
---

# Case study

One self-contained HTML page that shows how a real or realistic situation played out from start to finish, so a reader can learn by analogy or see that an approach works. It reads like the customer stories companies publish and the business school cases teams study: who they were and what they had, what was hard, what they did in the order they did it, what came of it with the figures the story itself supplies, what they learned, and what the reader can take from it. It is not a recommendation and it is not a pitch; it follows one story to the end and lets the reader draw the line to their own.

## When to reach for it

Reach for it when the user asks how someone did something, wants an example of an approach working end to end, or needs to show a skeptical reader that a change has been made before and survived contact with reality: how an agency moved to a four-day week, how a shop added online ordering, how a team replaced a search cluster. "How did X do it", "walk me through a case", "give me an example of this working", "write it up as a case study", and "customer story" are the phrases. Reach for it unprompted when research you have already done turned up one concrete instance whose sequence of events answers the user's question better than a summary would.

Do not reach for it when the user is choosing among options (that is the recommendation guide), when they want a decision framed (the briefing memo), when the material is general advice with no particular situation behind it, or when the story has no ending yet. A case with no results is a plan, not a case.

## Make the page

1. Read `idea.json` for the page's stated purpose, then the two examples in `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
2. Write a three-line brief before any HTML: who reads this and what they hope to take from it, the one result the story turns on, and the one distinctive move this page makes that the two examples did not.
3. Copy `starter.html` to `output/<slug>.html`. It carries the skin, the fonts, the icon set, and one empty section per slot the shape names. Keep the skin block untouched; everything under `<main>` is yours.
4. Fill the slots with the research. Sections may be reordered, merged, or renamed, but each intent below must be answered somewhere on the page, and the reader must know who the story is about and how it ended without scrolling.
5. Check it against the refusals below, open it, and look at it once at a laptop width. Fix what you see, then stop.

Write the page for the reader's situation, not the subject's. Every section ends up pointing at the "apply this" box, so a reader who skips to it still gets the transferable part.

## The shape

Each slot is an intent. Answer it in whatever form suits the material.

- **Context.** Who they were, what they had, and the size of things: people, revenue, volume, stack, whatever the story turns on. Enough that the reader can judge whether this case resembles theirs.
- **Challenge.** What was hard and why it had not been solved already. Specific enough that the approach reads as a response to it rather than a list of good ideas.
- **Approach.** What they did, in the order they did it, with the setbacks kept in. The order is the content: a reader copying the approach needs to know what came first and what was changed after something went wrong.
- **Results.** What changed, carrying only the figures the story itself supplies, each with its caveat beside it: the period, what else moved at the same time, what was estimated rather than measured. Where the story supplies no figure, the result is stated in words, and the page never fills the gap with a plausible number.
- **Lessons.** What they would tell someone starting the same thing, including what they would do differently. Three to six, each one sentence the reader could act on.
- **Apply this.** When this case transfers to the reader's situation and when it does not, as conditions rather than encouragement, with the first step for someone whose situation matches.
- **Sources.** Where the story came from: interviews, records, logs, published accounts. What is quoted, what is reconstructed, and what is inferred.

## What stays fixed, and what must vary

Fixed, because every idea shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer.

Free, and expected to differ between two case studies made a day apart: the register, from business report to magazine feature to engineering write-up, and with it the type (sans or serif, numbered headings or none), the measure and column count, the device that carries the results (a strip of figures with caveats, a table of before and after, a paragraph in words), where the pull quotes sit and how large they are, whether the before/after pair is columns or a table, and whether code or a diagram appears. Any interaction must be progressive so the page reads with scripts off.

Read [`references/patterns.md`](references/patterns.md) for the vocabulary the examples use: results strips, attributed pull quotes, before/after pairs, lessons lists, apply-this boxes. It is vocabulary, not a layout.

The look is one light theme, on purpose. A page may choose a toned surface within the palette, and that choice renders the same everywhere; it never switches with the reader's system theme.

## Refusals

A page that could be any of the examples with the words swapped. A results strip with a figure the story never measured, or a figure with no caveat. A percentage improvement computed from two numbers the page does not show. A pull quote attributed to nobody, or to a name rather than a role when the source is invented or anonymized. An approach told as a list of principles rather than a sequence of events. A story with no setback in it. Lessons that are compliments. An "apply this" box that says "it depends" and stops. A testimonial in place of a result. Photos of people who did not take part. Any `<link>` or `<script>` beyond the ones the starter carries, and any image that is a link or a relative path rather than inline data: the file has to open from a USB stick. A file over about 1.5 MB.

## Honesty about research

Say on the page where the story came from and which parts are reconstructed. A case built from one interview says so; a case built from a published account says whose. Figures carry the period they cover and whatever else moved during it, because a reader who copies the approach will be comparing against the caveat, not the headline. When the case is composite or invented to be representative, the footer says so in one plain sentence. A thin honest case teaches something; a confident invented one teaches the wrong thing with conviction.
