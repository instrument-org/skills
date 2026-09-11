---
name: create-page
description: "Use when the answer is more than a few paragraphs, or lays out steps, options, a comparison, or figures. One self-contained HTML page to scan, print, send on, or use. Forms: FAQ, timeline, how-to, checklist, itinerary, comparison, dashboard, data explorer, scorecard, brief, memo, case study, explainer, recommendation, wireframe, whiteboard, or a small working tool."
---

# Create page

One self-contained HTML file that a reader can open, keep, print, send on, and in a few cases use. Twenty-one templates cover the kinds of page people actually ask for; each names a set of slots and the intent behind each one, and all of them share the look, the method, and the refusals below.

The page is the answer. When a reply would be long, structured, or worth keeping, a page beats a wall of chat: it can be scanned, linked into, printed, and handed to someone who was not in the conversation.

## Choose the template

Read the row that fits, then read that template's `template.md` in full before writing anything. Paths are given because the file listing you were handed may be truncated: open them directly.

| Template                                                           | Reach for it when                                                                                                                                        |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Briefing memo](templates/briefing-memo/template.md)               | Something with real stakes has to be decided, and the situation, the options, and a recommendation belong on one page before anyone commits.             |
| [Case study](templates/case-study/template.md)                     | A situation like the reader's played out start to finish, and the point is to learn from it or to show that an approach works.                           |
| [Checklist](templates/checklist/template.md)                       | A process is about to run where forgetting one step is expensive, and every item wants to be grouped, tickable, and printable.                           |
| [Comparison matrix](templates/comparison-matrix/template.md)       | Several options need measuring on the same attributes side by side, before deciding what matters.                                                        |
| [Decision matrix](templates/criteria-recommendation/template.md)   | The winner is wanted along with the arithmetic: named criteria, stated weights, scored options, and what would flip the answer.                          |
| [Dashboard](templates/dashboard/template.md)                       | A period has ended and someone has to know how it went: the figures with what to compare them against, and the thing the headline hides.                 |
| [Data explorer](templates/explorer/template.md)                    | There are more rows than anyone will read and the rows are the point: the whole set, what it turns out to say, and a grid to sort, filter and take away. |
| [Explainer](templates/explainer/template.md)                       | A mental model of a concept, a system, or a topic is needed before deciding or digging deeper.                                                           |
| [FAQ](templates/faq/template.md)                                   | The same questions keep arriving about one topic, and each wants answering once, in a block that can be found, skimmed, or sent.                         |
| [How-to guide](templates/how-to/template.md)                       | Something has to get done in order, with the tools listed, the traps marked, and a way to know when it is finished.                                      |
| [Itinerary](templates/itinerary/template.md)                       | A destination and a span of days want planning into mornings, afternoons, and evenings that can be followed from a phone.                                |
| [One-pager](templates/one-pager/template.md)                       | A project, a program, or a change is being proposed and needs one page that earns the next meeting.                                                      |
| [Pros and cons](templates/pro-con/template.md)                     | The question is torn on one option or between two, and each side deserves its strongest case, weighted for this situation.                               |
| [Recommendation guide](templates/recommendation-guide/template.md) | A product, a tool, or a vendor is being picked, and one page should name the pick and show its work.                                                     |
| [Scorecard](templates/scorecard/template.md)                       | One vendor, tool, candidate, place, or plan is in front of the reader and wants grading across the dimensions that matter, evidence beside each.         |
| [Should I…?](templates/should-i/template.md)                       | A should-I, is-it-worth-it, or do-I-need question wants a plain answer that shows what it turns on.                                                      |
| [Timeline](templates/timeline/template.md)                         | Change over time is the explanation: the order of events says why things are as they are, or what happens next.                                          |
| [TLDR brief](templates/tldr-brief/template.md)                     | The research is done, and the reader wants only the takeaways, on one screen.                                                                            |
| [Tool](templates/tool/template.md)                                 | The answer is a function rather than a fact: a calculator, converter, checker or planner that opens with a real example already in it.                   |
| [Whiteboard](templates/whiteboard/template.md)                     | The material has two dimensions of its own and an order throws them away: a wall of sorted notes, a plan of somewhere real, things placed on two axes.   |
| [Wireframe](templates/wireframe/template.md)                       | An interface is being proposed or argued about, and the fastest way to settle it is a sequence of frames that each prove something.                      |

When two rows both fit, the tie-breaker is what the reader does next. A page that ends in a decision is a brief, a should-I, or a recommendation; a page that ends in an action is a how-to, a checklist, or an itinerary; a page that ends in understanding is an explainer, a timeline, or an FAQ; and a page the reader keeps open and comes back to is a tool, a whiteboard, or an explorer.

Three of these are a family of their own, in that the page does something rather than only saying something: a wireframe draws a proposed interface, a whiteboard is a surface the reader moves around, and a tool computes. On all three **the page is the thing** -- there is no prose column, no opening paragraph and no closing section, because a drawing under three paragraphs is an essay with pictures in it and the paragraphs are the part nobody wanted. A name, one line, the artifact, and a line of provenance under it. They obey every rule below, including the one about the network, and each says in its own `template.md` what that costs it.

When none of them fit, say so and write the page anyway, using the nearest template's slots as a starting point and this file's method as the rule. A page whose shape had to be invented is a better answer than the wrong template filled in obediently.

## Make the page

1. Read the chosen template's `template.md` in full, and its `idea.json` for the page's stated purpose.
2. Read the two examples in that template's `examples/` whose situation is nearest the user's. Each has a sidecar `.json` with a design note saying what that example chose and why; read the notes, not only the pages. Never take the first example as the target.
3. Write a three-line brief before any HTML: who reads this and what they will do next, the one thing the page has to settle for them, and the one distinctive move this page makes that the two examples did not.
4. Copy `starter.html` to `output/<slug>.html`, set its `instrument:idea` meta to the template's name, and paste the template's `main.html` inside `<main>`. The starter carries the tab icon, the skin, the fonts, the icon set, and the page behavior, each inside a `shell:start` … `shell:end` pair; leave those regions as they are, and everything under `<main>` is yours. Your own CSS goes in the gap the starter leaves between them.
5. Fill the slots with the research. Sections may be reordered, merged, renamed, or rebuilt, but every intent the template names must be answered somewhere on the page.
6. Check it against the refusals below and the template's own, open it, and look at it once at a laptop width. Fix what you see, then stop.

Research before you write, and write from what you found. A page whose facts came from the model rather than from a source is the failure this whole skill exists to avoid.

## What stays fixed, and what must vary

Fixed, because every page shares one look: the skin block in the starter, the type stack and its scale, the palette with brand green as the only saturated color, the spacing scale, a single self-contained file, and a provenance footer. The type scale is Tailwind's and tops out where the templates put it: a page title is `text-3xl sm:text-4xl`, or `sm:text-5xl` on a long read, a section heading is `text-xl` or `text-2xl`, and nothing is sized in `vw`. A register asks for a serif or a wider measure, never for a larger headline; one that fills the first screen pushes what the reader came for below the fold.

Free, and expected to differ between two pages made a day apart: the layout and column count, the density, the register, the components, the way a slot is realized, and any interaction, which must be progressive so the page reads with scripts off. Each template names what varies most in its own case.

The look follows the reader's system theme, and you never choose between them. Write the page once against the tokens and both come out right: a step on a ramp names distance from the paper rather than a lightness, so 25 is the faintest wash and 950 the darkest ink in either theme, and what changes is which end of the spectrum each lands on. The saturated middle, 400 through 600, holds still in both. That is the whole rule for white: it rides the middle and nowhere else, because every other step moves out from under it. Never hand-pick a ground for the page, and never write a `dark:` variant; `bg-background`, `bg-card`, `bg-muted`, `text-foreground` and `text-muted-foreground` already say what you mean. The one exception is a terminal or code listing, which is a well cut into the paper and keeps its own colors in both themes: `bg-code` with the four `text-code-*` inks.

`pnpm check:contrast` reads both palettes out of the skin and every page for what sits on what, so a page that fails WCAG AA in either theme fails the build. It is the reason nobody has to open the page twice.

The starter also carries three behaviors every page gets, and none of them need doing by hand: every external link wears the icon of the site it points at, footnote markers and their notes link both ways and light up when jumped to, and the page prints with sane margins. A page wider than a portrait sheet adds `@page { size: landscape }` in its own style block.

A page's own logic is one `<script type="module">` at the end of `<main>`, never a plain `<script>`. The starter's last script keeps a copy of the page for sharing as the parser reaches it, and a module script runs after that, so a shared copy carries the markup as written rather than as the script changed it. Module scripts do not share top-level names, so keep the logic in one, and attach listeners in it rather than through `onclick` attributes.

## Refusals

A page that could be any of the examples with the words swapped. A thing that lives at a URL named in plain text, or a link whose text describes the destination rather than naming the thing. Any image whose `src` is a URL or a relative path rather than inline data, any sibling file, and any relative fetch: the file has to open from a USB stick, arrive as an email attachment, and be served from a share host, and only one of those has an origin. A file over about 1.5 MB, or an inline image over 200 KB.

**What a page may load, and the test it has to pass.** Most pages load nothing beyond the starter's fonts, icon set and Tailwind build, and that is the right default. Where the material is a dataset rather than an argument, a page may also load one of the libraries in `check-ideas.ts`'s `ALLOWED_SOURCES`, pinned to an exact version. The test is not whether it loads, it is what happens when the load fails: **open the page with the network off and every number, name, place and finding is still there, in the HTML.** A library may add motion, precision or scale to something already on the page; it may never be the only copy of a fact. A chart carries its own table. A map's container carries its own list. A figure fetched at open carries the value it was written with, and the date. A page that goes blank, empty or meaningless offline is the refusal this rule exists for, and a template that reaches past the list has to say in its own `template.md` why its document kind needs it.

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
