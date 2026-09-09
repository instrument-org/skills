---
name: create-page
description: "Makes one self-contained HTML page in the house style, in whichever form the material calls for: FAQ, timeline, how-to, checklist, itinerary, comparison, scorecard, brief, memo, one-pager, case study, explainer, pro-con, recommendation. Use when the answer wants to be a document the reader can keep, print, or send on."
---

# Create page

One self-contained HTML file that a reader can open, keep, print, and send on. Sixteen templates cover the document kinds people actually ask for; each names a set of slots and the intent behind each one, and all of them share the look, the method, and the refusals below.

The page is the answer. When a reply would be long, structured, or worth keeping, a page beats a wall of chat: it can be scanned, linked into, printed, and handed to someone who was not in the conversation.

## Choose the template

Read the row that fits, then read that template's `template.md` in full before writing anything. Paths are given because the file listing you were handed may be truncated: open them directly.

| Template                                                                      | Reach for it when                                                                                                                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Briefing memo](templates/briefing-memo/template.md)                          | Something with real stakes has to be decided, and the situation, the options, and a recommendation belong on one page before anyone commits.     |
| [Case study](templates/case-study/template.md)                                | A situation like the reader's played out start to finish, and the point is to learn from it or to show that an approach works.                   |
| [Checklist](templates/checklist/template.md)                                  | A process is about to run where forgetting one step is expensive, and every item wants to be grouped, tickable, and printable.                   |
| [Comparison matrix](templates/comparison-matrix/template.md)                  | Several options need measuring on the same attributes side by side, before deciding what matters.                                                |
| [Recommendation with criteria](templates/criteria-recommendation/template.md) | The winner is wanted along with the arithmetic: named criteria, stated weights, scored options, and what would flip the answer.                  |
| [Explainer](templates/explainer/template.md)                                  | A mental model of a concept, a system, or a topic is needed before deciding or digging deeper.                                                   |
| [FAQ](templates/faq/template.md)                                              | The same questions keep arriving about one topic, and each wants answering once, in a block that can be found, skimmed, or sent.                 |
| [How-to guide](templates/how-to/template.md)                                  | Something has to get done in order, with the tools listed, the traps marked, and a way to know when it is finished.                              |
| [Itinerary](templates/itinerary/template.md)                                  | A destination and a span of days want planning into mornings, afternoons, and evenings that can be followed from a phone.                        |
| [One-pager](templates/one-pager/template.md)                                  | A project, a program, or a change is being proposed and needs one page that earns the next meeting.                                              |
| [Pros and cons](templates/pro-con/template.md)                                | The question is torn on one option or between two, and each side deserves its strongest case, weighted for this situation.                       |
| [Recommendation guide](templates/recommendation-guide/template.md)            | A product, a tool, or a vendor is being picked, and one page should name the pick and show its work.                                             |
| [Scorecard](templates/scorecard/template.md)                                  | One vendor, tool, candidate, place, or plan is in front of the reader and wants grading across the dimensions that matter, evidence beside each. |
| [Should I…?](templates/should-i/template.md)                                  | A should-I, is-it-worth-it, or do-I-need question wants a plain answer that shows what it turns on.                                              |
| [Timeline](templates/timeline/template.md)                                    | Change over time is the explanation: the order of events says why things are as they are, or what happens next.                                  |
| [TLDR brief](templates/tldr-brief/template.md)                                | The research is done, and the reader wants only the takeaways, on one screen.                                                                    |

When two rows both fit, the tie-breaker is what the reader does next. A page that ends in a decision is a brief, a should-I, or a recommendation; a page that ends in an action is a how-to, a checklist, or an itinerary; a page that ends in understanding is an explainer, a timeline, or an FAQ.

When none of them fit, say so and write the page anyway, using the nearest template's slots as a starting point and this file's method as the rule. A page whose shape had to be invented is a better answer than the wrong template filled in obediently.

## Make the page

1. Read the chosen template's `template.md` in full, and its `idea.json` for the page's stated purpose.
2. Read the two examples in that template's `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
3. Write a three-line brief before any HTML: who reads this and what they will do next, the one thing the page has to settle for them, and the one distinctive move this page makes that the two examples did not.
4. Copy `starter.html` to `output/<slug>.html`, set its `instrument:idea` meta to the template's name, and paste the template's `main.html` inside `<main>`. The starter carries the skin, the fonts, the icon set, and the page behavior; keep the skin block untouched, and everything under `<main>` is yours.
5. Fill the slots with the research. Sections may be reordered, merged, renamed, or rebuilt, but every intent the template names must be answered somewhere on the page.
6. Check it against the refusals below and the template's own, open it, and look at it once at a laptop width. Fix what you see, then stop.

Research before you write, and write from what you found. A page whose facts came from the model rather than from a source is the failure this whole skill exists to avoid.

## What stays fixed, and what must vary

Fixed, because every page shares one look: the skin block in the starter, the type stack, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer.

Free, and expected to differ between two pages made a day apart: the layout and column count, the density, the register, the components, the way a slot is realized, and any interaction, which must be progressive so the page reads with scripts off. Each template names what varies most in its own case.

The look is one light theme, on purpose. A page may choose a darker surface within the palette, and that choice renders the same everywhere; it never switches with the reader's system theme, because a page that has to look right in two themes is a page that looks wrong in one of them.

The starter also carries three behaviors every page gets, and none of them need doing by hand: every external link wears the icon of the site it points at, footnote markers and their notes link both ways and light up when jumped to, and the page prints with sane margins. A page wider than a portrait sheet adds `@page { size: landscape }` in its own style block.

## Refusals

A page that could be any of the examples with the words swapped. A thing that lives at a URL named in plain text, or a link whose text describes the destination rather than naming the thing. Any `<link>` or `<script>` that fetches from the network beyond the ones the starter carries, and any image whose `src` is a URL or a relative path rather than inline data: the file has to open from a USB stick, which a hyperlink does nothing to prevent. A file over about 1.5 MB, or an inline image over 200 KB. A small inline script is fine where the page reads without it, and a refusal where the page does not.

Each template adds the refusals that only bite in its own case.

## Honesty about research

Say on the page what it rests on and when it was read. Where two sources disagree, say so and say which one the page followed. Where a figure is an estimate, a quote, or a reconstruction rather than a published number, label it as one. Where the research is thin, the page says so in its footer rather than performing certainty: a thin honest page is useful, and a confident invented one is worse than nothing, because a reader will act on it.

Numbers are the easiest thing to invent and the hardest for a reader to check. A page carries a figure only when the prompt, a source, or arithmetic over shown inputs gave it. Scores use coarse scales — letters, a few dots, a word — unless every input is on the page, and never a decimal that implies precision the research does not have.

## References

Vocabulary, not layout. Read the one whose form is in play, not all of them.

- [`references/patterns.md`](references/patterns.md) — the recurring elements: kickers, status pills, step circles, icon lists, emphasis cards, code and terminal blocks, quoting, evidence footers, and how a block wider than the column behaves.
- [`references/charts.md`](references/charts.md) — stat tiles, bar rows, meters, sparklines, timeline bars, and the honesty rule for drawing a number.
- [`references/diagrams.md`](references/diagrams.md) — when HTML beats SVG, the SVG kit, swimlanes, parallel routes, and generated geometry.
- [`references/interaction.md`](references/interaction.md) — answer forms, runbook ticks, click-to-enlarge, details/summary, and the rule that interaction may orient but never gate.
- [`references/images.md`](references/images.md) — when a picture earns its place, how to size and inline one, and what to draw when there is no photo to use.

Each template also has a `patterns.md` beside it, for the vocabulary only that document kind uses.
