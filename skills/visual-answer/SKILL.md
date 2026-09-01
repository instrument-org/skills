---
name: visual-answer
description: When the user says "visual answer" or asks for a question answered or work explained visually, they mean this exact skill; invoke it rather than improvising a format. Also use it unprompted whenever a concept, change, plan, or result is complex enough to benefit from a visual treatment; err on that side, since a reader is never sad to receive one. It creates a tailored, single-file HTML page with diagrams, evidence, and forms the reader answers on the page, covering code changes, architecture, plans, incidents, comparisons, decisions, and product behavior.
---

# Visual answer

Create one HTML page whose form follows the question. This is a flexible explanatory canvas, not a fixed report, wireframe, slide deck, or exhaustive diff viewer.

The page is the primary reading surface. The reader often skips the conversation entirely, so every decision-relevant finding, recommendation, and open question belongs on the page, not only in chat.

## Make the page

1. Identify the exact thing the reader is trying to understand or decide. Use context and evidence already available in the task, inspecting only the additional source needed to avoid guessing.
2. Write the page content to a scratch file such as `work/<topic>-body.html`: the `<header>` (kicker, `h1`, thesis paragraph) plus your sections, without any `<main>` wrapper or document shell.
3. Generate the page with the bundled script, which owns the shell (Studio theme, locally served Tailwind and syntax highlighting, the orientation strip):

```text
tsx <visual-answer-skill-path>/scripts/create-visual-answer.ts --output output/<topic>.html --body-file work/<topic>-body.html --title "Short title"
```

4. Never hand-build or edit the shell, add remote `<link>` or `<script>` tags, or point at a CDN; the script pins local bundles so the page works offline exactly as generated. Page-local `<script>` blocks inside your body content are welcome.
5. Give top-level sections `id`s and real `h2`s. An orientation strip across the very top of the page builds itself from them, carrying the document title and marking the current section as the reader scrolls (`data-short` on an `h2` shortens its label); pages with fewer than four such sections get no strip, which is correct for them. The strip is deliberately one level; a section that grows to many screenfuls should be split, not sub-indexed.
6. When the page shows real product UI or rendered output, prefer captured images over redrawn approximations: land them under `output/` beside the page and reference them relatively; they are snapshots, so date them or re-shoot on revision.
7. Return the `output/` path and a one-sentence description of what the page answers.

## Keep the latitude

There are no required sections, length, navigation, number of panels, or interactions. Do not automatically add background, a table of contents, a quiz, metrics, or a file-by-file walkthrough. Lead with the answer and prefer selective depth over exhaustive coverage.

If three consecutive sections are coming out as prose lists, stop and reshape them into a diagram, sequence, table, or ledger. Long runs of text-shaped content are the single most common reader complaint with these pages.

Vary the volume. The bordered card is the focal layer, not the default wrapper: sections that support rather than decide can sit directly on the page background with tighter type and no chrome. Reserve toned fills, colored borders, and status color for the few elements carrying the verdict; when every panel is a card and every card is loud, nothing reads as important.

Respect the column. `main` is deliberately modest (`max-w-4xl`): these pages are read on laptops, and long lines defeat scanning. Structural elements (cards, grids, tables, figures) span the column; prose paragraphs cap near `max-w-3xl` for measure; wide tables and diagrams scroll inside their own overflow container rather than widening the page.

Distinguish depicted content from commentary. When a panel shows a thing (a slide, a UI, a transcript), annotations about it get a visibly distinct treatment and sit outside the depicted surface (the coach-mark idiom in `references/patterns.md`), so the reader never wonders whether a label is part of the thing shown.

For code changes, establish the relevant scope and distinguish implemented behavior from plans or open questions, but do not turn page creation into a separate code review or audit. Use focused code or diff excerpts only when exact syntax matters.

Label inference as inference. If evidence is incomplete or contradictory, show that uncertainty rather than smoothing it away.

## Reference files, read on demand

The `references/` directory holds canonical spellings and recipes. They are vocabulary, not layout: starting points to restyle freely, never a required structure. Read the ones whose form is in play, not all of them.

- `references/patterns.md`: the recurring vocabulary. Kicker labels, status pills, step circles, emphasis cards, terminal blocks, code excerpts, ledger openers, decision endings, evidence footers, coach marks. Worth reading for almost any page.
- `references/charts.md`: bar rows, meters, waffles, sparklines, timelines, and the normalization rule. Read whenever anything is quantified.
- `references/diagrams.md`: the SVG kit. Scroll wrappers, theme fills, arrowheads, swimlanes, and when HTML/CSS beats coordinate SVG. Read when geometry matters.
- `references/interaction.md`: the orientation strip, answer forms, runbook ticks, the screenshot comparator, click to enlarge, details/summary, generator JavaScript, and the narrow case for tabs. Read when the page is long, dense, or comparative, or when it asks the reader to decide or execute something.

Four rules that apply even without reading the references:

- **What the shell provides.** Trust this roster instead of inspecting the generated page: color scales `gray` and `brand` (25 through 950) and `error`/`warning`/`success`/`yellow`/`brown` (50/100/300/500/700/900); semantic tokens `background`, `foreground`, `card`, `popover`, `muted`, `muted-foreground`, `accent`, `primary`, `secondary`, `destructive`, `border`, `input`, `ring`; font stacks that fall back to the system UI faces; automatic local syntax highlighting for `pre > code` blocks. No icon font ships: use the text marks in `references/patterns.md`. Light theme only, by design.
- **Color.** Status is always the theme's `success`/`error`/`warning`/`brand` tokens, never raw Tailwind emerald/rose/red/amber. In SVG, use `fill-*`/`stroke-*` utility classes or `style="fill: var(--color-...)"`; presentation attributes cannot resolve `var()`, and hardcoded hex drifts from the theme.
- **Generated markup.** Small local JavaScript is welcome both for interaction that materially helps and for generating repeated structure from a data array (matrices, waffles, chart marks, rings). Never hand-repeat markup a ten-line loop can emit; conversely, hand-write elements whose instances carry heterogeneous content (decision cards, verdict cards). Place page scripts at the end of your body content; they share one global scope with the shell's trailing script (which owns `heading`, `tocSections`, `tocStrip`, `markSpy`, and `spy`), so name bindings something else.
- **Micro-lint.** The recurring authoring bugs: an unclosed bracket in an arbitrary value (`tracking-[-0.02em]`), and template-literal syntax leaking into plain HTML.

## When the page is one of a series

A design conversation often wants several pages, one per round, each a new file rather than an edit to the last. A few things earn their place in that mode and nowhere else:

- **Open with a settled-versus-cut ledger.** A compact grid of what is now decided and what has been dropped, so the reader confirms the shared state before reading the argument. It replaces recapping the previous page in prose.
- **Say plainly when you are reversing your own earlier recommendation, and on what new information.** A revision that quietly changes position makes the reader re-derive which version they are holding.
- **Link back to the previous round** near the top, by relative filename within `output/`. When the predecessor is missing, name it in text rather than linking a dead path.
- **Calibrate against a real reference implementation** when one exists, and verify rather than recall it. Comparing against how a known product actually behaves is usually more decisive than reasoning from first principles, and it can turn out to support the opposite conclusion.
- **Keep the open questions last and shrinking.** Lead with the answer while the design is still moving; once it has converged, a short list of what is genuinely undecided is the most useful ending.

## Embedding a wireframe

When the page needs to show product UI and the `wireframe` skill is available, build the UI once with that skill and embed the file, rather than redrawing the same frames inline. Embed with `srcdoc`, carrying the whole wireframe document escaped into the attribute (`html.escape(pathlib.Path(p).read_text(), quote=True)` in Python). A relative `src` iframe does not reliably render from a plain file, and both shells ship their own Tailwind and theme, so splicing wireframe markup into the page would collide. The embedded copy is a snapshot: re-embed on every revision or do not embed it.

## End with the decisions

When the work leaves anything genuinely open, end the page with a decision block: one card per decision, a plain-word handle naming its subject (never a coined label the reader must decode), and a recommendation chip on each. When the page instead needs answers the reader must send back, use the answer form in `references/interaction.md`.

## Hand off quickly

Treat the page as a single-use visual answer for the human reading it now. Open the generated HTML in Instrument's file viewer so it is on screen rather than waiting to be found. A search for leftover `TITLE`/`THESIS` placeholders is enough verification for ordinary pages; when the page carries positioned SVG beyond a dozen nodes or nontrivial generated markup, one screenshot via browser automation is allowed: fix what it shows, stop. Beyond that, do not iterate on visual details unless the user asks or generation reported a concrete error. Do not knowingly include secrets or private operational data.

## Script index

Read [`reference.md`](reference.md) for complete arguments.

- `create-visual-answer.ts`: Generate a visual answer page shell with the Studio theme and local bundles
