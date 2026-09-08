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
node <visual-answer-skill-path>/scripts/create-visual-answer.ts --output output/<topic>.html --body-file work/<topic>-body.html --title "Short title"
```

4. Never hand-build or edit the shell, add remote `<link>` or `<script>` tags, or point at a CDN; the script pins local bundles so the page works offline exactly as generated. Page-local `<script>` blocks inside your body content are welcome.
5. Give top-level sections `id`s and real `h2`s. An orientation strip across the very top of the page builds itself from them, carrying the document title and marking the current section as the reader scrolls (`data-short` on an `h2` shortens its label); pages with fewer than four such sections get no strip, which is correct for them. The strip is deliberately one level; a section that grows to many screenfuls should be split, not sub-indexed.
6. When the page shows real product UI or rendered output, prefer captured images over redrawn approximations: land them under `output/` beside the page and reference them relatively; they are snapshots, so date them or re-shoot on revision. Land each one at its native resolution and let CSS scale it down, because a file downscaled on the way in looks fine in a grid and is useless the moment the reader opens it to read what it shows.
7. Return the `output/` path and a one-sentence description of what the page answers.

## Title it with its subject

Name the page after what it is about, and stop there: `Feedback knowledge base`, `1.6.9 test plan`, `Wayfair session post-mortem`, `PR 102 merge behavior`. A noun phrase, the way you would name a folder.

The finding, the verdict and the argument go in the thesis paragraph directly beneath the title, which is where they already read well. Keep it to two or three sentences: it is the only paragraph on the page with a real chance of being read in full, and it spends that credit fast. Do not put them in the title, and never append them to the subject as a clause: `The block was never a rate limit` and `Feedback knowledge base: Notion, not a repo` both read beautifully to whoever just finished the page and are unrecognizable to the same person a week later. A list of such titles cannot be skimmed at all, because every line has a different shape and none of them names a subject.

Name the file after the same subject. When a later round sharpens what the page is really about, rename the title and the file together; a better name later is worth more than a stable one.

## Keep the latitude

There are no required sections, length, navigation, number of panels, or interactions. Do not automatically add background, a table of contents, a quiz, metrics, or a file-by-file walkthrough. Lead with the answer and prefer selective depth over exhaustive coverage.

If three consecutive sections are coming out as prose lists, stop and reshape them into a diagram, sequence, table, or ledger. Long runs of text-shaped content are the single most common reader complaint with these pages.

Give the reader landmarks. A Phosphor regular icon at the head of each row turns a list into something the eye can jump around in, and a field of icon chips does the same for a set of things with no order; both beat a bare bullet and both beat an emoji. One icon per row, never two, and the same tone across a group so the tone carries the grouping. The spellings are in `references/patterns.md`.

An icon is a landmark, never the content. A card whose body is an icon in a rounded square standing in for a category is the house style of generated slop; show the thing the card is about instead, at whatever size it takes to be legible.

Sections can carry a mark of their own: a Phosphor icon as the first child of the `h2`, which the orientation strip mirrors automatically, so one authoring act marks the section in both places and they cannot drift. Use them on every section or on none, never on some. The icon has to name the section's actual subject and never its genre, which is the whole difference between a landmark and decoration: a repeat arrow on a section about things that keep recurring earns its place, while a lightbulb on ideas, a gear on settings, or a rocket on anything is what makes a page read as generated. The spelling is in `references/patterns.md`.

Vary the volume. The bordered card is the focal layer, not the default wrapper: sections that support rather than decide can sit directly on the page background with tighter type and no chrome. Reserve toned fills, colored borders, and status color for the few elements carrying the verdict; when every panel is a card and every card is loud, nothing reads as important.

Respect the column, and know when to leave it. `main` is deliberately modest (`max-w-4xl`): these pages are read on laptops, and long lines defeat scanning, so prose paragraphs cap near `max-w-3xl` for measure and structural elements span the column. Never widen `main` itself, and never leave blocks stranded at assorted widths.

Prose keeps the column; content does not have to. Any block leaves it with one attribute, `data-width="wide"` for the everyday case and `data-width="full"` for the rare one. Both center on the column and need nothing else on the element, so the prose around them keeps its measure and the page still reads as one document with a few things spanning it. Put the attribute on the block that needs the room rather than the section around it, so the heading and the intro stay where every other heading is.

Reach for `wide` (about `76rem`) whenever a block is being squeezed by the measure rather than served by it. **A dense table is the standard case**, and so is a matrix, a side-by-side comparison, a wide timeline: four columns of findings are unreadable at `max-w-4xl` and comfortable one step out. Reserve `full` (up to `132rem`) for content that **is** the argument rather than illustrating it: a row of captured screens being compared, a matrix whose whole point is seeing every cell at once, a diagram that only reads at scale. Neither is a default wrapper, and a page where everything is wide has no column left to break out of. A table forced to scroll horizontally, or shrunk to fit a measure meant for sentences, has been made unreadable to protect a rule about sentences.

Write for a reader who reads the headings and scans everything else, because that is the behavior these pages actually get. So headings carry content: a section heading states its finding (`Five problems, three homes`) rather than naming its topic (`Background`, `Findings`, `Analysis`), since it is the one line with a real chance of being read. The page title is the deliberate exception and stays a plain subject, because it has to be recognizable in a list of files months later, and `data-short` labels are navigation, so they stay nouns.

Then lead a section with the thing, not a paragraph about the thing. The reflex order is heading, intro sentence, diagram; what the reader wants is heading, diagram, and then whatever commentary survived seeing it. Introductory paragraphs are the least-read element on the page, so cut them or cut them to one line. The same holds for quoting anyone, the reader most of all: distill first and quote second, because a long verbatim block goes unread however good it is.

When something happens through several routes, draw every route, even where they rhyme. One generalized diagram with a table of variants beneath it is the tempting compression and it loses the reader: they want to trace each concrete path end to end, and the redundancy between the paths is what makes the shared shape visible.

Name things in plain words, everywhere on the page and not only in the decision block. A coined label for a flow, a stage, or a category makes the reader decode where they were reading, and a capitalized invented name on a working document reads as branding.

Assume any one section will be screenshotted out of the page and pasted into a chat thread with nothing around it, because that is how these travel. A section whose subject is established only by a paragraph three screens up arrives meaningless.

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

- **What the shell provides.** Trust this roster instead of inspecting the generated page: color scales `gray` and `brand` (25 through 950) and `error`/`warning`/`success`/`yellow`/`brown` (50/100/300/500/700/900); semantic tokens `background`, `foreground`, `card`, `popover`, `muted`, `muted-foreground`, `accent`, `primary`, `secondary`, `destructive`, `border`, `input`, `ring`; font stacks that fall back to the system UI faces; Phosphor icons in `ph` (regular) and `ph-fill`, served locally; automatic local syntax highlighting for `pre > code` blocks; a Copy button and a Wrap toggle attached to every `<pre>`, which wraps by default. Light theme only, by design.
- **Color.** Status is always the theme's `success`/`error`/`warning`/`brand` tokens, never raw Tailwind emerald/rose/red/amber. Yellow and amber read as caution whatever they were meant to say, so never reach for them to mark the thing worth looking at; that is `brand`. In SVG, use `fill-*`/`stroke-*` utility classes or `style="fill: var(--color-...)"`; presentation attributes cannot resolve `var()`, and hardcoded hex drifts from the theme.
- **Generated markup.** Small local JavaScript is welcome both for interaction that materially helps and for generating repeated structure from a data array (matrices, waffles, chart marks, rings). Never hand-repeat markup a ten-line loop can emit; conversely, hand-write elements whose instances carry heterogeneous content (decision cards, verdict cards). Place page scripts at the end of your body content; they share one global scope with the shell's trailing script (which owns `heading`, `tocSections`, `tocStrip`, `markSpy`, and `spy`), so name bindings something else.
- **Micro-lint.** The recurring authoring bugs: an unclosed bracket in an arbitrary value (`tracking-[-0.02em]`), template-literal syntax leaking into plain HTML, and Phosphor weights other than `ph` (regular) and `ph-fill`, the only two the shell loads.

## When the page is one of a series

A design conversation often returns to the same subject. Whether a later round edits the existing page or writes a new one is yours to judge: editing keeps one name for a subject that is still moving, and a new page earns its place when the decision changed enough that the earlier round is worth keeping beside it. A few things earn their place in this mode and nowhere else:

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

{{GENERATED_SCRIPT_INDEX}}
